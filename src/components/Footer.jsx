import { useContent } from '../context/ContentContext'
import Brand from './Brand'
import Icon from './Icon'

export default function Footer() {
  const { content } = useContent()
  const { brand, profile, footer } = content
  const year = new Date().getFullYear()

  return (
    <footer className="footer">
      <div className="container footer-inner">
        <Brand brand={brand} href="#hero" />

        <p className="footer-note text-dim">
          {footer.note}
        </p>

        <div className="footer-actions">
          <a href={profile.email} className="footer-mail" data-cursor>
            {profile.email} <Icon name="arrowUpRight" size={16} />
          </a>
          {footer.showAdmin && (
            <a href="#/admin" className="footer-top" data-cursor>
              Admin
            </a>
          )}
          <button
            className="footer-top"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            aria-label="Back to top"
            data-cursor
          >
            Top <Icon name="arrowUp" size={16} />
          </button>
        </div>
      </div>

      <div className="container footer-bottom">
        <span className="text-dim">© {year} {profile.name} ({profile.alias}). All rights reserved.</span>
        <span className="text-dim">{footer.madeWith}</span>
      </div>
    </footer>
  )
}
