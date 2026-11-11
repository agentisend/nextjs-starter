import { createHash } from 'node:crypto';
import { AgentiSend, AgentiSendError } from 'agentisend';

export type ContactState =
  | { status: 'idle' }
  | { status: 'sent'; id: string }
  | { status: 'error'; message: string };

const ADDRESS = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_MESSAGE = 5000;

function requiredEnv(name: 'AGENTISEND_API_KEY' | 'MAIL_FROM' | 'CONTACT_TO'): string {
  const value = process.env[name];
  if (!value) throw new Error(`Set ${name}. See .env.example.`);
  return value;
}

function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

/**
 * Sends one contact-form message to CONTACT_TO, with the visitor as Reply-To.
 *
 * The recipient is fixed by the environment, so a public deployment cannot be
 * used to mail arbitrary addresses. The idempotency key is a hash of the
 * submission: a double-click or a retried request sends one email, not two.
 */
export async function sendContact(form: FormData, client?: AgentiSend): Promise<ContactState> {
  const name = String(form.get('name') ?? '').trim().slice(0, 200);
  const email = String(form.get('email') ?? '').trim();
  const message = String(form.get('message') ?? '').trim();

  if (!ADDRESS.test(email)) return { status: 'error', message: 'Enter one email address, like you@example.com.' };
  if (message.length === 0) return { status: 'error', message: 'Write a message.' };
  if (message.length > MAX_MESSAGE) return { status: 'error', message: `Keep the message under ${MAX_MESSAGE} characters.` };

  const agentisend = client ?? new AgentiSend(requiredEnv('AGENTISEND_API_KEY'));
  const idempotencyKey = `contact/${createHash('sha256').update(`${email}\n${name}\n${message}`).digest('hex')}`;

  try {
    const { id } = await agentisend.emails.send(
      {
        from: requiredEnv('MAIL_FROM'),
        to: requiredEnv('CONTACT_TO'),
        reply_to: email,
        subject: `Contact form: ${name || email}`,
        text: `From: ${name || '(no name)'} <${email}>\n\n${message}`,
        html: `<p><strong>From:</strong> ${escapeHtml(name || '(no name)')} &lt;${escapeHtml(email)}&gt;</p><p style="white-space:pre-wrap">${escapeHtml(message)}</p>`,
        tags: { source: 'contact-form' },
      },
      { idempotencyKey },
    );
    return { status: 'sent', id };
  } catch (error) {
    if (error instanceof AgentiSendError) {
      // Logged for the site owner; the visitor gets a generic line.
      console.error(`AgentiSend refused the send: ${error.code}. ${error.fix}`);
      return { status: 'error', message: 'The message could not be sent. Try again in a minute.' };
    }
    throw error;
  }
}
