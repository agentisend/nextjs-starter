import { createServer, type IncomingMessage, type Server } from 'node:http';
import { AddressInfo } from 'node:net';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { AgentiSend } from 'agentisend';
import { sendContact } from '../lib/contact';

type Seen = { url?: string; idempotencyKey?: string; body: Record<string, unknown> };
let server: Server;
let seen: Seen[] = [];
let status = 201;
let client: AgentiSend;

function read(req: IncomingMessage): Promise<string> {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', (chunk) => (body += chunk));
    req.on('end', () => resolve(body));
  });
}

beforeAll(async () => {
  server = createServer(async (req, res) => {
    seen.push({ url: req.url, idempotencyKey: req.headers['idempotency-key'] as string, body: JSON.parse(await read(req)) });
    res.writeHead(status, { 'content-type': 'application/json' });
    res.end(
      status === 201
        ? JSON.stringify({ id: 'email-1' })
        : JSON.stringify({ error: { code: 'domain_not_verified', message: 'Not verified.', fix: 'Verify the domain.' } }),
    );
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address() as AddressInfo;
  client = new AgentiSend('as_test', { baseUrl: `http://127.0.0.1:${port}` });
  process.env.MAIL_FROM = 'Contact form <contact@example.com>';
  process.env.CONTACT_TO = 'owner@example.com';
});

afterAll(() => new Promise<void>((resolve) => server.close(() => resolve())));

beforeEach(() => {
  seen = [];
  status = 201;
});

function form(fields: Record<string, string>): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) data.set(key, value);
  return data;
}

describe('sendContact', () => {
  it('sends to CONTACT_TO with the visitor as Reply-To', async () => {
    const result = await sendContact(form({ name: 'Ada', email: 'ada@example.com', message: 'Hi <there>' }), client);

    expect(result).toEqual({ status: 'sent', id: 'email-1' });
    expect(seen).toHaveLength(1);
    expect(seen[0].url).toBe('/emails');
    expect(seen[0].body).toMatchObject({
      from: 'Contact form <contact@example.com>',
      to: 'owner@example.com',
      reply_to: 'ada@example.com',
      subject: 'Contact form: Ada',
      tags: { source: 'contact-form' },
    });
    expect(String(seen[0].body.html)).toContain('Hi &#60;there&#62;');
  });

  it('uses the same idempotency key for the same submission', async () => {
    const fields = { name: 'Ada', email: 'ada@example.com', message: 'Same message' };
    await sendContact(form(fields), client);
    await sendContact(form(fields), client);
    await sendContact(form({ ...fields, message: 'Different' }), client);

    expect(seen[0].idempotencyKey).toMatch(/^contact\/[0-9a-f]{64}$/);
    expect(seen[1].idempotencyKey).toBe(seen[0].idempotencyKey);
    expect(seen[2].idempotencyKey).not.toBe(seen[0].idempotencyKey);
  });

  it('refuses a bad address or an empty message without calling the API', async () => {
    expect(await sendContact(form({ email: 'nope', message: 'x' }), client)).toMatchObject({ status: 'error' });
    expect(await sendContact(form({ email: 'a@b.co', message: '  ' }), client)).toMatchObject({ status: 'error' });
    expect(seen).toHaveLength(0);
  });

  it('hides the API refusal from the visitor', async () => {
    status = 422;
    const result = await sendContact(form({ email: 'ada@example.com', message: 'Hi' }), client);

    expect(result).toEqual({ status: 'error', message: 'The message could not be sent. Try again in a minute.' });
  });
});
