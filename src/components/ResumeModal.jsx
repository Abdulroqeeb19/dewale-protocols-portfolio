import { motion } from 'framer-motion'
import { useEffect } from 'react'
import { useContent } from '../context/ContentContext'
import Icon from './Icon'

function Section({ title, children }) {
  return (
    <section className="resume-section">
      <h3>{title}</h3>
      <div className="resume-section-body">{children}</div>
    </section>
  )
}

export default function ResumeModal({ onClose }) {
  const { content } = useContent()
  const { brand, profile, skills, timeline, services, projects, stats, contactChannels } = content

  useEffect(() => {
    document.body.classList.add('resume-open')
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.classList.remove('resume-open')
      window.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  return (
    <div className="resume-modal">
      <div className="resume-backdrop" onClick={onClose} />
      <motion.div
        className="resume-card"
        initial={{ opacity: 0, y: 40, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 220, damping: 26 }}
      >
        <div className="resume-toolbar">
          <span className="resume-toolbar-title">
            <Icon name="user" size={16} /> Resume preview
          </span>
          <div className="resume-toolbar-actions">
            <button className="admin-btn admin-btn-primary" onClick={() => window.print()}>
              <Icon name="download" size={16} /> Print / Save as PDF
            </button>
            <button className="admin-btn admin-btn-ghost" onClick={onClose}>
              Close
            </button>
          </div>
        </div>

        <div className="resume-sheet">
          <header className="resume-header">
            <div>
              <h1>{profile.name} <span className="resume-alias">({profile.alias})</span></h1>
              <p className="resume-role">{profile.role}</p>
            </div>
            <div className="resume-contact">
              {contactChannels.map((c) => (
                <span key={c.label}>
                  {c.label}: <strong>{c.value}</strong>
                </span>
              ))}
              {profile.website && (
                <span>
                  Web: <strong>{profile.website.replace(/^https?:\/\//, '')}</strong>
                </span>
              )}
            </div>
          </header>

          <Section title="Profile">
            <p>{profile.bioLead}</p>
            <p>{profile.bioSecondary}</p>
          </Section>

          <Section title="Experience">
            {timeline.map((t) => (
              <div className="resume-entry" key={t.role}>
                <div className="resume-entry-head">
                  <strong>{t.role}</strong>
                  <span>{t.company} · {t.year}</span>
                </div>
                <p>{t.desc}</p>
              </div>
            ))}
          </Section>

          <Section title="Core Skills">
            {skills.map((g) => (
              <div className="resume-skill-group" key={g.group}>
                <strong>{g.group}</strong>
                <div className="resume-skill-chips">
                  {g.items.map((item) => (
                    <span key={item.name} className="resume-chip">
                      {item.name} · {item.level}%
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </Section>

          <Section title="Services">
            <div className="resume-skill-chips">
              {services.map((s) => (
                <span key={s.title} className="resume-chip">{s.title}</span>
              ))}
            </div>
          </Section>

          <Section title="Selected Work">
            <div className="resume-projects">
              {projects.map((p) => (
                <div className="resume-entry" key={p.title}>
                  <div className="resume-entry-head">
                    <strong>{p.title}</strong>
                    <span>{p.tag}</span>
                  </div>
                  <p>{p.desc}</p>
                </div>
              ))}
            </div>
          </Section>

          <footer className="resume-stats">
            {stats.map((s) => (
              <div key={s.label}>
                <strong>{s.value}{s.suffix}</strong>
                <span>{s.label}</span>
              </div>
            ))}
          </footer>
        </div>
      </motion.div>
    </div>
  )
}