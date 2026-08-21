import { motion, useScroll, useSpring } from 'framer-motion'
import { useRef } from 'react'
import { useContent } from '../context/ContentContext'
import { SectionHeading, Reveal } from './Reveal'

export default function Timeline() {
  const { content } = useContent()
  const { timeline } = content
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 75%', 'end 60%'] })
  const scaleY = useSpring(scrollYProgress, { stiffness: 90, damping: 25 })

  return (
    <section id="experience" className="section">
      <div className="container">
        <SectionHeading
          eyebrow="Experience"
          title="The road so far."
          subtitle="Every milestone lit the way toward autonomous, dependable systems."
        />

        <div className="timeline" ref={ref}>
          <motion.div className="timeline-track" style={{ scaleY }} />
          {timeline.map((item, i) => (
            <Reveal key={item.role} className="timeline-row" delay={i * 0.08}>
              <div className="timeline-meta">
                <span className="timeline-year">{item.year}</span>
                <span className="timeline-company text-dim">{item.company}</span>
              </div>
              <div className="timeline-node">
                <span className="timeline-dot" />
              </div>
              <div className="timeline-card glass">
                <h3>{item.role}</h3>
                <p className="text-dim">{item.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
