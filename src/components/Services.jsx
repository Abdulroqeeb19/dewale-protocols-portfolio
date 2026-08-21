import { useContent } from '../context/ContentContext'
import Icon from './Icon'
import TiltCard from './TiltCard'
import { SectionHeading, Reveal } from './Reveal'

export default function Services() {
  const { content } = useContent()
  const { services } = content
  return (
    <section id="services" className="section">
      <div className="container">
        <SectionHeading
          eyebrow="Services"
          title="What I can build for you."
          subtitle="A bento mix of capabilities — pick one, or let me stitch them into a system."
        />

        <div className="bento">
          {services.map((service, i) => (
            <Reveal key={service.title} className={`bento-item ${service.span}`} delay={(i % 3) * 0.08}>
              <TiltCard max={5} glare className="bento-card glass">
                <span className="bento-icon">
                  <Icon name={service.icon} size={26} />
                </span>
                <h3>{service.title}</h3>
                <p className="text-dim">{service.desc}</p>
                <span className="bento-index">0{i + 1}</span>
              </TiltCard>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
