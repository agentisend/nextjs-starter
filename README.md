# Next.js contact form with AgentiSend

A Next.js App Router contact form that sends email through [AgentiSend](https://agentisend.com) from a Server Action.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fagentisend%2Fnextjs-starter&env=AGENTISEND_API_KEY,MAIL_FROM,CONTACT_TO&envDescription=An%20AgentiSend%20sending%20key%2C%20a%20From%20address%20on%20a%20verified%20domain%2C%20and%20the%20address%20that%20receives%20messages&envLink=https%3A%2F%2Fgithub.com%2Fagentisend%2Fnextjs-starter%2Fblob%2Fmain%2F.env.example&project-name=agentisend-contact-form&repository-name=agentisend-contact-form)
[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/agentisend/nextjs-starter)

- Messages go to one address, `CONTACT_TO`. The visitor's address becomes Reply-To, so you answer from your inbox. A public deployment cannot be used to mail anyone else.
- The idempotency key is a hash of the submission, so a double-click or a retried request sends one email.
- An AgentiSend refusal is logged with its `code` and `fix` for you. The visitor sees one generic line.

## Run it locally

```bash
cp .env.example .env.local   # fill in the three values
npm install
npm run dev
```

| Variable | What it is |
|---|---|
| `AGENTISEND_API_KEY` | A key with `sending_access`, from [API keys](https://console.agentisend.com/api-keys) in the AgentiSend console. |
| `MAIL_FROM` | The From address, on a domain you have [verified](https://agentisend.com/docs/guides/domains-and-dns). |
| `CONTACT_TO` | Where messages from the form go. |

## Files

| File | What it does |
|---|---|
| `lib/contact.ts` | Validates the form and sends one email with an idempotency key. |
| `app/actions.ts` | The Server Action the form posts to. |
| `app/contact-form.tsx` | The form, with `useActionState` for the pending and result states. |
| `test/contact.test.ts` | Runs `sendContact` against a local stub of the API: `npm test`. |

## Guides

- [Send email from Next.js](https://agentisend.com/docs/guides/nextjs)
- [Idempotency and the error envelope](https://agentisend.com/docs/guides/api-conventions)

MIT licensed.
