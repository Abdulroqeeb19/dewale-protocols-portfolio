import { useEffect } from 'react'
import { useContent } from '../context/ContentContext'

const FAVICON_SIZES = { sm: 16, md: 32, lg: 180 }

function getResizedFavicon(url, size) {
  if (!url || !url.includes('supabase')) return url
  const separator = url.includes('?') ? '&' : '?'
  return `${url}${separator}width=${size}&height=${size}&quality=80&resize=contain`
}

export default function Favicon() {
  const { content } = useContent()
  const logo = content?.brand?.logoImage

  useEffect(() => {
    if (!logo) return
    const ext = logo.split('.').pop().split('?')[0].toLowerCase()
    const isIcon = ['svg', 'ico', 'png'].some(e => ext === e) && /favicon|icon|logo/i.test(logo)
    if (!isIcon) return

    let link = document.querySelector('link[rel="icon"]')
    if (!link) {
      link = document.createElement('link')
      link.rel = 'icon'
      document.head.appendChild(link)
    }
    link.href = getResizedFavicon(logo, FAVICON_SIZES.sm)

    let appleLink = document.querySelector('link[rel="apple-touch-icon"]')
    if (!appleLink) {
      appleLink = document.createElement('link')
      appleLink.rel = 'apple-touch-icon'
      document.head.appendChild(appleLink)
    }
    appleLink.href = getResizedFavicon(logo, FAVICON_SIZES.lg)
  }, [logo])

  return null
}
