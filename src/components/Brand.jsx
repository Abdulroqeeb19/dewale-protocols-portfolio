export function BrandText({ text }) {
  const words = text.split(' ')
  if (words.length <= 1) return text
  return (
    <>
      {words.slice(0, -1).join(' ')} <span className="grad-text">{words[words.length - 1]}</span>
    </>
  )
}

export default function Brand({ brand, href = '#hero', className = '' }) {
  const logoUrl = brand.logoImage
    ? `${brand.logoImage}${brand.logoImage.includes('?') ? '&' : '?'}width=80&quality=80`
    : null

  return (
    <a href={href} className={`brand ${className}`} data-cursor>
      {logoUrl ? (
        <img src={logoUrl} alt={brand.logoText} className="brand-img" width="40" height="40" decoding="async" loading="eager" />
      ) : (
        <span className="brand-mark">{brand.logoMark}</span>
      )}
      <span className="brand-text">
        <BrandText text={brand.logoText} />
      </span>
    </a>
  )
}
