'use client';

import { useActionState } from 'react';
import { submitContact } from './actions';
import type { ContactState } from '@/lib/contact';

const initial: ContactState = { status: 'idle' };

export function ContactForm() {
  const [state, action, pending] = useActionState(submitContact, initial);

  return (
    <form action={action} className="form">
      <label>
        Name
        <input name="name" autoComplete="name" maxLength={200} />
      </label>
      <label>
        Email
        <input name="email" type="email" autoComplete="email" required />
      </label>
      <label>
        Message
        <textarea name="message" rows={6} maxLength={5000} required />
      </label>
      <button type="submit" disabled={pending}>
        {pending ? 'Sending…' : 'Send'}
      </button>
      <p role="status" aria-live="polite" className={state.status}>
        {state.status === 'sent' && 'Sent. We will reply to the address you entered.'}
        {state.status === 'error' && state.message}
      </p>
    </form>
  );
}
