import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useContent } from '../context/ContentContext'
import Icon from './Icon'
import { SectionHeading } from './Reveal'

export default function Portfolio() {
  const { content } = useContent()
  const { projectCategories, projects } = content
  const [active, setActive] = useState('All')
  const filtered = active === 'All' ? projects : projects.filter((p) => p.category === active)

  return (
    <section id="work" className="section">
      <div className="container">
        <SectionHeading
          eyebrow="Selected Work"
          title="Projects with real production gravity."
          subtitle="A few builds that shipped, scaled, and kept running."
        />

        <div className="filter-tabs" role="tablist">
          {projectCategories.map((cat) => (
            <button
              key={cat}
              role="tab"
              aria-selected={active === cat}
              className={`filter-tab ${active === cat ? 'active' : ''}`}
              onClick={() => setActive(cat)}
              data-cursor
            >
              {active === cat && (
                <motion.span layoutId="filter-pill" className="filter-pill" transition={{ type: 'spring', stiffness: 320, damping: 28 }} />
              )}
              <span className="filter-label">{cat}</span>
            </button>
          ))}
        </div>

        <motion.div layout className="projects-grid">
          <AnimatePresence mode="popLayout">
            {filtered.map((project) => (
              <motion.article
                key={project.title}
                layout
                className="project-card glass"
                initial={{ opacity: 0, scale: 0.9, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                data-cursor
              >
                <div
                  className="project-media"
                  style={project.image ? undefined : { background: project.grad }}
                >
                  {project.image ? (
                    <img src={project.image} alt={project.title} className="project-img" />
                  ) : (
                    <span className="project-initials">{project.title.slice(0, 2).toUpperCase()}</span>
                  )}
                  <span className="project-media-glow" />
                  <div className="project-overlay">
                    <p className="project-desc">{project.desc}</p>
                    <div className="project-actions">
                      <button className="project-btn" aria-label="Quick view" onClick={() => alert(`Quick view: ${project.title}`)}>
                        <Icon name="eye" size={18} />
                      </button>
                      <button className="project-btn" aria-label="Open project" onClick={() => alert(`Open: ${project.title}`)}>
                        <Icon name="external" size={18} />
                      </button>
                    </div>
                  </div>
                </div>
                <div className="project-info">
                  <span className="project-tag">{project.tag}</span>
                  <h3>{project.title}</h3>
                </div>
              </motion.article>
            ))}
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  )
}
