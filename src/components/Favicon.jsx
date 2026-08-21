import { useEffect } from 'react'
import { useContent } from '../context/ContentContext'

export default function Favicon() {
  const { content } = useContent()
  const logo = content?.brand?.logoImage

  useEffect(() => {
    if (!logo) return
    let link = document.querySelector('link[rel="icon"]')
    if (!link) {
      link = document.createElement('link')
      link.rel = 'icon'
      document.head.appendChild(link)
    }
    link.href = logo
  }, [logo])

  return null
}
