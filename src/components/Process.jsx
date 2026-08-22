import { useContent } from '../context/ContentContext'
import { SectionHeading, Reveal } from './Reveal'
import Icon from './Icon'

const defaultSteps = [
  {
    icon: 'at',
    title: 'Discovery',
    desc: 'We align on goals, constraints, and success metrics before a single line of code.',
  },
  {
    icon: 'compass',
    title: 'Architecture',
    desc: 'System design, tech stack selection, and a roadmap with clear milestones.',
  },
  {
    icon: 'layers',
    title: 'Build',
    desc: 'Iterative development with demos at every checkpoint — no surprises.',
  },
  {
    icon: 'cloud',
    title: 'Ship & Scale',
    desc: 'Deploy, monitor, and harden. Your system stays fast as usage grows.',
  },
]

export default function Process() {
  const steps = defaultSteps

  return (
    <section id="process" className="section">
      <div className="container">
        <SectionHeading
          eyebrow="How I Work"
          title="From idea to production, reliably."
          subtitle="A repeatable process that keeps scope tight, communication clear, and delivery on time."
        />

        <div className="process-grid">
          {steps.map((step, i) => (
            <Reveal key={step.title} delay={i * 0.1} className="process-card glass">
              <div className="process-num">{String(i + 1).padStart(2, '0')}</div>
              <span className="process-icon">
                <Icon name={step.icon} size={24} />
              </span>
              <h3>{step.title}</h3>
              <p className="text-dim">{step.desc}</p>
              {i < steps.length - 1 && <span className="process-arrow" aria-hidden="true">→</span>}
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
