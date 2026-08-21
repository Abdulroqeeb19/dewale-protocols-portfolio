import { motion } from 'framer-motion'
import { useContent } from '../context/ContentContext'
import { SectionHeading, Reveal } from './Reveal'

function SkillBar({ name, level }) {
  return (
    <div className="skill-bar">
      <div className="skill-bar-head">
        <span>{name}</span>
        <span className="skill-level">{level}%</span>
      </div>
      <div className="skill-track">
        <motion.div
          className="skill-fill"
          initial={{ width: 0 }}
          whileInView={{ width: `${level}%` }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>
    </div>
  )
}

export default function Skills() {
  const { content } = useContent()
  const { skills } = content
  return (
    <section id="skills" className="section">
      <div className="container">
        <SectionHeading
          eyebrow="Skills"
          title="A stack that ships, not just sparkles."
          subtitle="Core competencies measured by how much production code they've survived."
        />

        <div className="skills-grid">
          {skills.map((group, gi) => (
            <Reveal key={group.group} className="skills-card glass" delay={gi * 0.1}>
              <h3 className="skills-group-title">{group.group}</h3>
              <div className="skill-list">
                {group.items.map((item) => (
                  <SkillBar key={item.name} {...item} />
                ))}
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
