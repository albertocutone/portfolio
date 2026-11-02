import { useEffect, useRef, useState } from 'react';
import { contactEndpoint } from '../../config/contact.js';
import { submitMessage } from '../../contact/submitMessage.js';

export default function ContactForm() {
  const [status, setStatus] = useState('idle');
  const request = useRef();
  useEffect(() => () => request.current?.abort(), []);

  async function submit(event) {
    event.preventDefault();
    if (!contactEndpoint || status === 'sending') return;
    const form = event.currentTarget;
    const values = Object.fromEntries(new FormData(form));
    request.current = new AbortController();
    setStatus('sending');
    try {
      await submitMessage(contactEndpoint, values, { signal: request.current.signal });
      setStatus('sent');
      form.reset();
    } catch (error) {
      if (error.name !== 'AbortError') setStatus('error');
    }
  }

  return <section className="contact-form-panel">
    <h2 id="detail-title">Let's talk</h2>
    <p className="dialog-role">Have a project or an idea in mind? Send me a message.</p>
    {status === 'sent' ? <p className="contact-success" role="status">Thanks! Your message was sent.</p> : <form className="contact-form" onSubmit={submit}>
      <label>Your name<input name="name" autoComplete="name" maxLength={120} required /></label>
      <label>Your email<input name="email" type="email" autoComplete="email" maxLength={254} required /></label>
      <label>Message<textarea name="message" rows={5} maxLength={5000} required /></label>
      {!contactEndpoint && <p className="contact-unavailable" role="status">The contact form is temporarily unavailable. Please check back soon.</p>}
      {status === 'error' && <p className="contact-error" role="alert">Your message could not be sent. Please try again.</p>}
      <button className="primary-link" type="submit" disabled={!contactEndpoint || status === 'sending'}>{status === 'sending' ? 'Sending…' : 'Send message'}</button>
    </form>}
  </section>;
}
