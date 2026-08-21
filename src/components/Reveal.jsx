import { motion } from 'framer-motion'

const ease = [0.22, 1, 0.36, 1]

export function RevealText({ text, as: Tag = 'h2', split = 'words', delay = 0, stagger = 0.06, className = '' }) {
  const words = text.split(' ')
  const container = {
    hidden: {},
    visible: { transition: { staggerChildren: stagger, delayChildren: delay } },
  }

  const wordVariants = {
    hidden: { y: '110%', opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.9, ease } },
  }

  const charVariants = {
    hidden: { y: '110%', opacity: 0, rotateX: 45 },
    visible: { y: 0, opacity: 1, rotateX: 0, transition: { duration: 0.8, ease } },
  }

  return (
    <motion.span
      className={`reveal-text ${className}`}
      variants={container}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-80px' }}
      style={{ display: 'block' }}
    >
      {words.map((word, wi) => (
        <span key={wi} className="reveal-word" aria-hidden="true">
          {split === 'chars'
            ? word.split('').map((ch, ci) => (
                <motion.span key={ci} className="reveal-char" variants={charVariants} style={{ display: 'inline-block' }}>
                  {ch}
                </motion.span>
              ))
            : <motion.span variants={wordVariants} style={{ display: 'inline-block' }}>{word}</motion.span>}
          {wi < words.length - 1 && <span style={{ display: 'inline-block' }}>&nbsp;</span>}
        </span>
      ))}
      <span className="sr-only">{text}</span>
    </motion.span>
  )
}

export function Reveal({ children, delay = 0, y = 40, className = '', ...rest }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.9, ease, delay }}
      {...rest}
    >
      {children}
    </motion.div>
  )
}

export function SectionHeading({ eyebrow, title, subtitle, align = 'left' }) {
  return (
    <div className={`section-heading ${align}`}>
      {eyebrow && (
        <motion.span
          className="section-eyebrow"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease }}
        >
          {eyebrow}
        </motion.span>
      )}
      <RevealText text={title} split="words" as="h2" />
      {subtitle && (
        <Reveal delay={0.15}>
          <p className="section-subtitle text-dim">{subtitle}</p>
        </Reveal>
      )}
    </div>
  )
}
