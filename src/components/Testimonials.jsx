import { motion } from 'framer-motion'
import { useContent } from '../context/ContentContext'
import { SectionHeading, Reveal } from './Reveal'
import Icon from './Icon'

function TestimonialCard({ testimonial, index }) {
  return (
    <Reveal delay={index * 0.1} className="testimonial-card glass">
      <div className="testimonial-stars" aria-label={`${testimonial.rating} out of 5 stars`}>
        {Array.from({ length: 5 }, (_, i) => (
          <Icon
            key={i}
            name={i < testimonial.rating ? 'star' : 'starOutline'}
            size={18}
            className={i < testimonial.rating ? 'star-filled' : 'star-empty'}
          />
        ))}
      </div>
      <blockquote className="testimonial-text">&ldquo;{testimonial.text}&rdquo;</blockquote>
      <div className="testimonial-author">
        <div className="testimonial-avatar">
          <span>{testimonial.name.charAt(0)}</span>
        </div>
        <div>
          <span className="testimonial-name">{testimonial.name}</span>
          <span className="testimonial-role text-dim">{testimonial.role}</span>
        </div>
      </div>
    </Reveal>
  )
}

export default function Testimonials() {
  const { content } = useContent()
  const { testimonials } = content

  if (!testimonials || testimonials.length === 0) return null

  return (
    <section id="testimonials" className="section">
      <div className="container">
        <SectionHeading
          eyebrow="Testimonials"
          title="What clients say."
          subtitle="Real feedback from founders and teams I've worked with."
        />

        <div className="testimonials-grid">
          {testimonials.map((t, i) => (
            <TestimonialCard key={t.name} testimonial={t} index={i} />
          ))}
        </div>
      </div>
    </section>
  )
}
