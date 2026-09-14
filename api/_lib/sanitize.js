export function trim(s, max = 1000) {
  return String(s || '')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, ' ')
    .trim()
    .slice(0, max)
}

export function escapeHtml(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export function stripControlChars(s) {
  return String(s || '').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, ' ')
}
