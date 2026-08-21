import { useRef, useState } from 'react'
import { useContent } from '../context/ContentContext'
import { supabase, supabaseConfigured } from '../lib/supabase'
import Icon from './Icon'
import { SectionHeading, Reveal } from './Reveal'
import MagneticButton from './MagneticButton'

export default function Contact() {
  const { content } = useContent()
  const { profile, contactChannels } = content
  const [form, setForm] = useState({ name: '', email: '', message: '' })
  const [status, setStatus] = useState('idle')
  const [errorMsg, setErrorMsg] = useState(null)
  const honeypotRef = useRef(null)
  const mountedAt = useRef(Date.now())

  const pretendSuccess = () => {
    setStatus('sent')
    setForm({ name: '', email: '', message: '' })
    setTimeout(() => setStatus('idle'), 6000)
  }

  const mailtoFallback = () => {
    const subject = encodeURIComponent(`Portfolio message from ${form.name}`)
    const body = encodeURIComponent(`${form.message}\n\n— ${form.name} (${form.email})`)
    window.location.href = `mailto:${profile.email}?subject=${subject}&body=${body}`
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (honeypotRef.current?.value || Date.now() - mountedAt.current < 4000) {
      pretendSuccess()
      return
    }
    setStatus('sending')
    setErrorMsg(null)

    if (!supabaseConfigured) {
      mailtoFallback()
      setStatus('sent')
      setForm({ name: '', email: '', message: '' })
      setTimeout(() => setStatus('idle'), 6000)
      return
    }

    try {
      const { error } = await supabase.from('contact_messages').insert({
        name: form.name,
        email: form.email,
        message: form.message,
      })
      if (error) throw error

      try {
        await fetch('/api/contact', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            name: form.name,
            email: form.email,
            message: form.message,
            notifyEmail: profile.email,
          }),
        })
      } catch {
        // Email notification is best-effort — the message is already saved to the admin inbox.
      }

      setStatus('sent')
      setForm({ name: '', email: '', message: '' })
      setTimeout(() => setStatus('idle'), 6000)
    } catch (err) {
      mailtoFallback()
      setErrorMsg(err.message)
      setStatus('error')
      setTimeout(() => setStatus('idle'), 8000)
    }
  }

  return (
    <section id="contact" className="section">
      <div className="container">
        <SectionHeading
          eyebrow="Contact"
          title="Let's build something reliable."
          subtitle="Tell me what you're automating, shipping, or untangling — I'll reply within a day."
        />

        <div className="contact-grid">
          <div className="contact-channels">
            {contactChannels.map((channel, i) => (
              <Reveal key={channel.label} delay={i * 0.1} className="contact-channel-wrap">
                <a href={channel.href} className="contact-channel glass" data-cursor>
                  <span className="contact-icon">
                    <Icon name={channel.icon} size={22} />
                  </span>
                  <div>
                    <span className="contact-label text-dim">{channel.label}</span>
                    <span className="contact-value">{channel.value}</span>
                  </div>
                  <Icon name="arrowUpRight" size={18} className="contact-arrow" />
                </a>
              </Reveal>
            ))}

            <Reveal delay={0.3}>
              <div className="contact-social">
                {profile.socials.map((social) => (
                  <a key={social.label} href={social.href} target="_blank" rel="noreferrer" className="social-chip glass" data-cursor>
                    {social.label}
                  </a>
                ))}
              </div>
            </Reveal>

            <Reveal delay={0.4}>
              <p className="contact-note text-dim">
                Prefer asking now? Shoot an email to <a href={`mailto:${profile.email}`} className="contact-note-link">{profile.email}</a> or use the form.
              </p>
            </Reveal>
          </div>

          <Reveal delay={0.15}>
            <form className="contact-form glass" onSubmit={handleSubmit}>
              <input
                ref={honeypotRef}
                type="text"
                name="website"
                tabIndex="-1"
                autoComplete="off"
                aria-hidden="true"
                style={{ position: 'absolute', left: '-9999px', top: 'auto', width: '1px', height: '1px', overflow: 'hidden' }}
              />
              <div className="form-field">
                <input
                  id="cf-name"
                  type="text"
                  required
                  placeholder=" "
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
                <label htmlFor="cf-name">Your name</label>
              </div>
              <div className="form-field">
                <input
                  id="cf-email"
                  type="email"
                  required
                  placeholder=" "
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
                <label htmlFor="cf-email">Email address</label>
              </div>
              <div className="form-field">
                <textarea
                  id="cf-message"
                  rows="5"
                  required
                  placeholder=" "
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                />
                <label htmlFor="cf-message">Your message</label>
              </div>
              <MagneticButton type="submit" className="btn-primary form-submit" disabled={status === 'sending'}>
                {status === 'sending' ? 'Sending…' : 'Send Message'}{' '}
                <Icon name="arrow" size={18} />
              </MagneticButton>
              {status === 'sent' && (
                <p className="form-sent" role="status">
                  Message sent — I'll get back to you shortly.
                </p>
              )}
              {status === 'error' && (
                <p className="form-error" role="alert">
                  Couldn't deliver directly ({errorMsg}) — I opened your email app with the message ready to send instead.
                </p>
              )}
            </form>
          </Reveal>
        </div>
      </div>
    </section>
  )
}