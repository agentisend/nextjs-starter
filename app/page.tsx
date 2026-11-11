import { ContactForm } from './contact-form';

export default function Home() {
  return (
    <main>
      <h1>Contact us</h1>
      <p className="lede">
        This form sends through <a href="https://agentisend.com">AgentiSend</a> from a Next.js Server Action. Messages go
        to one address set in <code>CONTACT_TO</code>.
      </p>
      <ContactForm />
    </main>
  );
}
