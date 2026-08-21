import { useEffect, useRef } from 'react'
import { ADSENSE_CLIENT } from '../config/ads'

const VALID_SLOT = /^\d{5,}$/

export default function AdSlot({ slot, format = 'auto', className = '' }) {
  const ref = useRef(null)

  useEffect(() => {
    if (!slot || !VALID_SLOT.test(slot)) return
    if (ref.current?.dataset.pushed) return
    try {
      ;(window.adsbygoogle = window.adsbygoogle || []).push({})
      if (ref.current) ref.current.dataset.pushed = 'true'
    } catch {
      /* ad service unavailable */
    }
  }, [slot])

  if (!slot || !VALID_SLOT.test(slot)) return null

  return (
    <div className={`ad-slot ${className}`}>
      <ins
        ref={ref}
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={ADSENSE_CLIENT}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </div>
  )
}