import { useEffect, useState } from 'react'
import { motion, useMotionValue, useSpring } from 'framer-motion'

export default function Cursor() {
  const [enabled] = useState(() => window.matchMedia('(pointer: fine)').matches)
  const [hovering, setHovering] = useState(false)
  const [down, setDown] = useState(false)

  const x = useMotionValue(-100)
  const y = useMotionValue(-100)
  const springX = useSpring(x, { stiffness: 500, damping: 40, mass: 0.5 })
  const springY = useSpring(y, { stiffness: 500, damping: 40, mass: 0.5 })

  useEffect(() => {
    if (!enabled) return
    const move = (e) => {
      x.set(e.clientX)
      y.set(e.clientY)
    }
    const over = (e) => {
      const interactive = e.target.closest('a, button, [data-cursor]')
      setHovering(Boolean(interactive))
    }
    const downFn = () => setDown(true)
    const upFn = () => setDown(false)
    window.addEventListener('mousemove', move, { passive: true })
    window.addEventListener('mouseover', over)
    window.addEventListener('mousedown', downFn)
    window.addEventListener('mouseup', upFn)
    return () => {
      window.removeEventListener('mousemove', move)
      window.removeEventListener('mouseover', over)
      window.removeEventListener('mousedown', downFn)
      window.removeEventListener('mouseup', upFn)
    }
  }, [enabled, x, y])

  if (!enabled) return null

  return (
    <>
      <motion.div
        className="cursor-dot"
        style={{ x: springX, y: springY }}
      />
      <motion.div
        className="cursor-ring"
        style={{ x: springX, y: springY }}
        animate={{
          scale: down ? 0.8 : hovering ? 1.9 : 1,
          opacity: hovering ? 0.9 : 0.55,
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      />
    </>
  )
}
