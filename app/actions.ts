'use server';

import { sendContact, type ContactState } from '@/lib/contact';

export async function submitContact(_previous: ContactState, form: FormData): Promise<ContactState> {
  return sendContact(form);
}
