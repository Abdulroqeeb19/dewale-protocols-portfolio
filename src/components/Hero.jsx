import { motion, useScroll, useTransform } from 'framer-motion'
import { useContent } from '../context/ContentContext'
import Particles from './Particles'
import MagneticButton from './MagneticButton'
import { RevealText } from './Reveal'
import Icon from './Icon'

function ParallaxLayer({ className, speed = 0.5 }) {
  const { scrollYProgress } = useScroll()
  const y = useTransform(scrollYProgress, [0, 1], [0, -600 * speed])
  return <motion.div className={`parallax ${className}`} style={{ y }} aria-hidden="true" />
}

async function downloadCv(url, filename) {
  const res = await fetch(url)
  const blob = await res.blob()
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = filename
  link.click()
  URL.revokeObjectURL(link.href)
}

export default function Hero({ onOpenResume }) {
  const { content } = useContent()
  const { brand, profile } = content
  const { scrollYProgress } = useScroll()
  const bgY = useTransform(scrollYProgress, [0, 1], [0, 300])
  const textY = useTransform(scrollYProgress, [0, 1], [0, -120])
  const fade = useTransform(scrollYProgress, [0, 0.5], [1, 0])

  const handleDownloadCv = () => {
    if (profile.resumeFile) {
      downloadCv(profile.resumeFile, `${profile.alias || 'CV'}.pdf`)
    } else {
      onOpenResume()
    }
  }

  const handleExploreWork = () => {
    document.getElementById('work')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <section id="hero" className="hero">
      <motion.div className="hero-bg" style={{ y: bgY }}>
        <Particles density={5200} />
        <ParallaxLayer className="hero-orb hero-orb-1" speed={0.4} />
        <ParallaxLayer className="hero-orb hero-orb-2" speed={0.2} />
        <ParallaxLayer className="hero-grid-overlay" speed={0.15} />
      </motion.div>

      <motion.div className="container hero-content" style={{ y: textY, opacity: fade }}>
        <motion.span
          className="hero-badge glass"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
        >
          <span className="hero-badge-dot" />
          Available for select projects
        </motion.span>

        <h1 className="hero-title">
          <span className="hero-line">
            <RevealText text={brand.heroGreeting} as="span" split="words" delay={0.2} stagger={0.1} />
            <RevealText text={brand.heroAccent} as="span" split="chars" delay={0.45} stagger={0.035} className="grad-text" />
          </span>
          <span className="hero-line hero-line-role">
            <RevealText text={brand.heroLine2} as="span" split="chars" delay={0.9} stagger={0.028} />
          </span>
          <span className="hero-line hero-line-role">
            <RevealText text={brand.heroLine3} as="span" split="chars" delay={1.35} stagger={0.02} />
          </span>
        </h1>

        <motion.p
          className="hero-sub text-dim"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.9 }}
        >
          {profile.tagline}
        </motion.p>

        <motion.div
          className="hero-cta"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 2.1 }}
        >
          <MagneticButton className="btn-primary" onClick={handleExploreWork}>
            Explore Work <Icon name="arrow" size={18} />
          </MagneticButton>
          <a href="#contact" className="btn btn-ghost" data-cursor>
            <Icon name="mail" size={18} /> Let&apos;s Talk
          </a>
          <MagneticButton className="btn-ghost" onClick={handleDownloadCv}>
            <Icon name="download" size={18} /> Download CV
          </MagneticButton>
        </motion.div>

        <motion.div
          className="hero-scroll"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.6, duration: 1 }}
        >
          <span className="hero-scroll-text">Scroll to explore</span>
          <motion.span
            className="hero-scroll-line"
            animate={{ scaleY: [0, 1, 0], originY: 0 }}
            transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
          />
        </motion.div>
      </motion.div>
    </section>
  )
}
