import { useContent } from '../context/ContentContext'
import TiltCard from './TiltCard'
import CountUp from './CountUp'
import { Reveal, RevealText, SectionHeading } from './Reveal'
import MagneticButton from './MagneticButton'
import Icon from './Icon'

function getResizedImageUrl(url, width) {
  if (!url || !url.includes('supabase')) return url
  const separator = url.includes('?') ? '&' : '?'
  return `${url}${separator}width=${width}&quality=80&resize=cover`
}

function Portrait({ portraitImage }) {
  return (
    <div className="about-portrait">
      <TiltCard max={7} className="about-portrait-card glass">
        {portraitImage ? (
          <img
            src={getResizedImageUrl(portraitImage, 400)}
            srcSet={`${getResizedImageUrl(portraitImage, 320)} 320w, ${getResizedImageUrl(portraitImage, 400)} 400w, ${getResizedImageUrl(portraitImage, 600)} 600w`}
            sizes="(max-width: 620px) 100vw, (max-width: 860px) 50vw, 400px"
            alt="Abdulroqeeb Olapade — Dewale Protocols"
            className="portrait-img"
            width="400"
            height="500"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <>
            <div className="portrait-glow" />
            <div className="portrait-ring portrait-ring-1" />
            <div className="portrait-ring portrait-ring-2" />
            <div className="portrait-monogram">
              <span>DP</span>
              <small>Systems Engineer</small>
            </div>
          </>
        )}
        <div className="portrait-tag glass">
          <span className="portrait-tag-dot" /> Building with intent
        </div>
      </TiltCard>
    </div>
  )
}

function Stats({ stats }) {
  return (
    <Reveal className="stats-grid">
      {stats.map((stat) => (
        <div className="stat glass" key={stat.label}>
          <CountUp value={stat.value} suffix={stat.suffix} className="stat-value" />
          <span className="stat-label text-dim">{stat.label}</span>
        </div>
      ))}
    </Reveal>
  )
}

export default function About() {
  const { content } = useContent()
  const { brand, profile, stats, disciplines } = content
  return (
    <section id="about" className="section">
      <div className="container">
        <SectionHeading
          eyebrow="About Me"
          title="Engineering intelligent systems, end to end."
          subtitle="From AI agents that do the work to platforms that ship them — I bridge the gap between automation and dependable software."
        />

        <div className="about-grid">
          <Portrait portraitImage={brand.portraitImage} />

          <div className="about-copy">
            <Reveal>
              <p className="about-lead">
                {profile.bioLead}
              </p>
            </Reveal>

            <Reveal delay={0.1}>
              <p className="text-dim">
                {profile.bioSecondary}
              </p>
            </Reveal>

            <div className="discipline-grid">
              {disciplines.map((d, i) => (
                <Reveal key={d} delay={0.12 + i * 0.08} className="discipline-card glass" y={30}>
                  <span className="discipline-num">0{i + 1}</span>
                  <span className="discipline-name">{d}</span>
                  <Icon name="arrowUpRight" size={18} />
                </Reveal>
              ))}
            </div>
          </div>
        </div>

        <Stats stats={stats} />
      </div>

      <div className="callout container">
        <Reveal className="callout-card glass">
          <div className="callout-glow" />
          <div className="callout-text">
            <RevealText as="span" text="Let's build the systems your competitors haven't shipped yet." />
            <span className="text-dim callout-meta">
              Trusted by 30+ clients across fintech, logistics & SaaS · 356 projects delivered.
            </span>
          </div>
          <MagneticButton className="btn-primary callout-btn" onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}>
            Hire Me <Icon name="arrow" size={18} />
          </MagneticButton>
        </Reveal>
      </div>
    </section>
  )
}
