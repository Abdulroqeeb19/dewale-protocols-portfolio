export const SERVICE_LABELS = {
  'ai-automation': 'AI Automation',
  'ai-chatbots': 'AI Chatbots',
  ecommerce: 'E-Commerce Systems',
  fullstack: 'Full Stack Development',
  'smart-campus': 'Smart Campus',
  'business-systems': 'Business Systems',
  consulting: 'Tech Consulting',
}

export const TYPE_LABELS = {
  order: 'New Order',
  booking: 'New Booking',
  enquiry: 'New Enquiry',
}

export const BUDGET_MAP = {
  'under-500': { label: 'Under $500', amount: 50000 },
  '500-1500': { label: '$500 - $1,500', amount: 150000 },
  '1500-5000': { label: '$1,500 - $5,000', amount: 400000 },
  '5000-10000': { label: '$5,000 - $10,000', amount: 800000 },
  '10000-plus': { label: '$10,000+', amount: 1500000 },
  flexible: { label: 'Flexible', amount: 100000 },
}

export const VALID_STATUSES = ['new', 'contacted', 'qualified', 'converted', 'closed']

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function isValidEmail(email) {
  return EMAIL_REGEX.test(email)
}
