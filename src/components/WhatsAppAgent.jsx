import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Icon from './Icon'
import '../styles/whatsapp-agent.css'

const FLOW = [
  {
    id: 'greeting',
    type: 'bot',
    message: "Hello! Welcome to Dewale Protocols. I'm here to help you place an order, book a service, or get a quote. Let's get started!",
    options: [
      { label: 'Place an Order', value: 'order' },
      { label: 'Book a Service', value: 'booking' },
      { label: 'General Enquiry', value: 'enquiry' },
    ],
    field: 'type',
  },
  {
    id: 'service',
    type: 'bot',
    message: 'Great! Which service are you interested in?',
    options: [
      { label: 'AI Automation', value: 'ai-automation' },
      { label: 'AI Chatbots', value: 'ai-chatbots' },
      { label: 'E-Commerce Systems', value: 'ecommerce' },
      { label: 'Full Stack Development', value: 'fullstack' },
      { label: 'Smart Campus', value: 'smart-campus' },
      { label: 'Business Systems', value: 'business-systems' },
      { label: 'Tech Consulting', value: 'consulting' },
    ],
    field: 'service',
  },
  {
    id: 'name',
    type: 'bot',
    message: 'What is your full name?',
    inputType: 'text',
    placeholder: 'Enter your name',
    field: 'name',
    validate: (v) => v.trim().length >= 2 || 'Please enter a valid name',
  },
  {
    id: 'email',
    type: 'bot',
    message: 'What is your email address?',
    inputType: 'email',
    placeholder: 'you@example.com',
    field: 'email',
    validate: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) || 'Please enter a valid email',
  },
  {
    id: 'phone',
    type: 'bot',
    message: 'What is your phone number?',
    inputType: 'tel',
    placeholder: '+234 xxx xxx xxxx',
    field: 'phone',
    validate: (v) => v.replace(/\D/g, '').length >= 8 || 'Please enter a valid phone number',
  },
  {
    id: 'description',
    type: 'bot',
    message: 'Please describe what you need — your project goal, timeline, or any specific requirements.',
    inputType: 'textarea',
    placeholder: 'Tell us about your project or order...',
    field: 'description',
    validate: (v) => v.trim().length >= 10 || 'Please provide more details (min 10 characters)',
  },
  {
    id: 'budget',
    type: 'bot',
    message: 'What is your estimated budget range?',
    options: [
      { label: 'Under $500', value: 'under-500' },
      { label: '$500 - $1,500', value: '500-1500' },
      { label: '$1,500 - $5,000', value: '1500-5000' },
      { label: '$5,000 - $10,000', value: '5000-10000' },
      { label: '$10,000+', value: '10000-plus' },
      { label: 'Discuss later', value: 'flexible' },
    ],
    field: 'budget',
  },
  {
    id: 'location',
    type: 'bot',
    message: 'Where are you located? (City & Country, or delivery address)',
    inputType: 'text',
    placeholder: 'e.g. Lagos, Nigeria',
    field: 'location',
    validate: (v) => v.trim().length >= 3 || 'Please enter your location',
  },
  {
    id: 'payment',
    type: 'bot',
    message: 'To proceed, a deposit is required. Would you like to make a payment now?',
    options: [
      { label: 'Pay Now (Paystack)', value: 'pay-now' },
      { label: 'Invoice Later', value: 'invoice-later' },
      { label: 'Discuss Payment', value: 'discuss' },
    ],
    field: 'paymentPreference',
  },
  {
    id: 'refund',
    type: 'bot',
    message: `**Refund Policy:**
- Full refund within 24 hours of payment (before work begins)
- 50% refund if cancelled within 3 days of project start
- No refund after deliverables have been provided
- Disputes resolved within 7 business days
- All refunds processed via original payment method

Do you accept our refund policy?`,
    options: [
      { label: 'I Accept', value: 'accepted' },
      { label: 'I Have Questions', value: 'questions' },
    ],
    field: 'refundAccepted',
  },
  {
    id: 'lead',
    type: 'bot',
    message: 'One last thing — how did you hear about us?',
    options: [
      { label: 'Google Search', value: 'google' },
      { label: 'Social Media', value: 'social-media' },
      { label: 'Referral', value: 'referral' },
      { label: 'LinkedIn', value: 'linkedin' },
      { label: 'Twitter/X', value: 'twitter' },
      { label: 'Portfolio Site', value: 'portfolio' },
    ],
    field: 'leadSource',
  },
]

const PAYSTACK_KEY = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || ''

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function formatMessage(text) {
  return escapeHtml(text)
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br>')
}

function safeRender(text) {
  const parts = text.split(/(\*\*.*?\*\*)/)
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i}>{part.slice(2, -2)}</strong>
    }
    return <span key={i}>{part}</span>
  })
}

export default function WhatsAppAgent() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([])
  const [currentStep, setCurrentStep] = useState(0)
  const [inputValue, setInputValue] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [complete, setComplete] = useState(false)
  const [paymentProcessing, setPaymentProcessing] = useState(false)
  const [formData, setFormData] = useState({})
  const [error, setError] = useState(null)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  useEffect(() => {
    if (open && messages.length === 0) {
      initConversation()
    }
  }, [open, messages.length])

  const initConversation = () => {
    const first = FLOW[0]
    setMessages([{ role: 'bot', text: first.message, options: first.options }])
  }

  const addBotMessage = (text, options = null) => {
    setMessages((prev) => [...prev, { role: 'bot', text, options }])
  }

  const addUserMessage = (text) => {
    setMessages((prev) => [...prev, { role: 'user', text }])
  }

  const processStep = (stepIndex, value) => {
    const step = FLOW[stepIndex]
    if (!step) return

    setFormData((prev) => ({ ...prev, [step.field]: value }))

    const displayValue =
      step.options?.find((o) => o.value === value)?.label || value
    addUserMessage(displayValue)

    const nextStep = stepIndex + 1

    if (step.field === 'refundAccepted' && value === 'questions') {
      addBotMessage(
        'No worries! Please email us at hello@dewaleprotocols.io with your questions, and we\'ll get back to you within 24 hours.'
      )
      return
    }

    if (step.field === 'paymentPreference' && value === 'pay-now') {
      addBotMessage('Redirecting you to our secure payment gateway...')
      setTimeout(() => initiatePayment(stepIndex), 500)
      return
    }

    if (nextStep >= FLOW.length) {
      submitEnquiry(stepIndex, value)
      return
    }

    setCurrentStep(nextStep)
    const next = FLOW[nextStep]
    setTimeout(() => {
      addBotMessage(next.message, next.options)
    }, 400)
  }

  const handleOptionClick = (value) => {
    const step = FLOW[currentStep]
    if (!step) return
    processStep(currentStep, value)
  }

  const handleInputSubmit = (e) => {
    e.preventDefault()
    const step = FLOW[currentStep]
    if (!step) return

    const value = inputValue.trim()
    if (!value) return

    if (step.validate) {
      const result = step.validate(value)
      if (result !== true) {
        setError(result)
        return
      }
    }

    setError(null)
    setInputValue('')
    processStep(currentStep, value)
  }

  const initiatePayment = async (stepIndex) => {
    setPaymentProcessing(true)

    const budgetRange = formData.budget || 'flexible'

    if (!PAYSTACK_KEY) {
      setPaymentProcessing(false)
      addBotMessage(
        'Payment gateway is not configured yet. Please select "Invoice Later" and we\'ll send you a payment link.'
      )
      return
    }

    try {
      const res = await fetch('/api/validate-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          budget: budgetRange,
          email: formData.email || '',
        }),
      })

      const data = await res.json()
      if (!data.ok) {
        setPaymentProcessing(false)
        addBotMessage('Unable to process payment. Please try again or select "Invoice Later".')
        return
      }

      const handler = window.PaystackPop?.setup({
        key: PAYSTACK_KEY,
        email: formData.email || 'customer@example.com',
        amount: data.amount,
        currency: data.currency,
        ref: data.reference,
        metadata: {
          custom_fields: [
            { display_name: 'Service', value: formData.service },
            { display_name: 'Type', value: formData.type },
          ],
        },
        callback: (response) => {
          setPaymentProcessing(false)
          setFormData((prev) => ({ ...prev, paymentRef: response.reference }))
          addBotMessage(`Payment confirmed! Reference: ${response.reference}`)

          const nextStep = stepIndex + 1
          if (nextStep >= FLOW.length) {
            submitEnquiry(stepIndex, 'pay-now')
          } else {
            setCurrentStep(nextStep)
            const next = FLOW[nextStep]
            setTimeout(() => addBotMessage(next.message, next.options), 400)
          }
        },
        onClose: () => {
          setPaymentProcessing(false)
          addBotMessage('Payment cancelled. Would you like to try again or choose a different option?', [
            { label: 'Try Again', value: 'pay-now' },
            { label: 'Invoice Later', value: 'invoice-later' },
          ])
        },
      })

      handler?.openIframe?.()
    } catch {
      setPaymentProcessing(false)
      addBotMessage('Payment verification failed. Please try again or select "Invoice Later".')
    }
  }

  const submitEnquiry = async (stepIndex, lastValue) => {
    const allData = { ...formData, [FLOW[stepIndex]?.field]: lastValue }
    setSubmitting(true)

    addBotMessage('Submitting your enquiry... Please wait.')

    try {
      const res = await fetch('/api/enquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: allData.name,
          email: allData.email,
          phone: allData.phone,
          type: allData.type,
          service: allData.service,
          description: allData.description,
          budget: allData.budget,
          location: allData.location,
          paymentPreference: allData.paymentPreference,
          paymentRef: allData.paymentRef || null,
          refundAccepted: allData.refundAccepted === 'accepted',
          leadSource: allData.leadSource,
        }),
      })

      const result = await res.json()
      if (!result.ok) throw new Error(result.reason || 'submission-failed')

      setComplete(true)
      addBotMessage(
        `**Enquiry Submitted Successfully!**

Thank you, **${allData.name}**! Here's a summary:

**Type:** ${allData.type === 'order' ? 'Order' : allData.type === 'booking' ? 'Service Booking' : 'General Enquiry'}
**Service:** ${allData.service?.replace(/-/g, ' ')}
**Budget:** ${allData.budget?.replace(/-/g, ' ')}
**Location:** ${allData.location}
**Payment:** ${allData.paymentPreference === 'pay-now' ? 'Paid' : allData.paymentPreference === 'invoice-later' ? 'Invoice pending' : 'Discuss later'}

We'll get back to you within **24 hours** at **${allData.email}**.

Need immediate help? Email us at hello@dewaleprotocols.io`
      )
    } catch {
      addBotMessage(
        'There was an issue submitting your enquiry. Please try again or contact us directly at hello@dewaleprotocols.io'
      )
    } finally {
      setSubmitting(false)
    }
  }

  const restart = () => {
    setMessages([])
    setFormData({})
    setCurrentStep(0)
    setInputValue('')
    setComplete(false)
    setError(null)
    setTimeout(initConversation, 300)
  }

  const currentFlowStep = FLOW[currentStep]
  const showInput = currentFlowStep?.inputType && !complete && !submitting

  return (
    <>
      <motion.button
        className="wa-fab"
        onClick={() => setOpen((o) => !o)}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.94 }}
        aria-label="Open WhatsApp Agent"
      >
        {open ? (
          <Icon name="close" size={24} />
        ) : (
          <div className="wa-fab-icon">
            <svg viewBox="0 0 24 24" fill="currentColor" width="28" height="28">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
          </div>
        )}
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="wa-chat-window"
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            <div className="wa-header">
              <div className="wa-header-avatar">
                <span>DP</span>
              </div>
              <div className="wa-header-info">
                <h3>Dewale Protocols</h3>
                <span className="wa-status">Online - AI Assistant</span>
              </div>
              <button className="wa-close" onClick={() => setOpen(false)} aria-label="Close chat">
                <Icon name="close" size={20} />
              </button>
            </div>

            <div className="wa-messages">
              <div className="wa-messages-inner">
                {messages.map((msg, i) => (
                  <div key={i} className={`wa-msg ${msg.role === 'user' ? 'wa-msg-user' : 'wa-msg-bot'}`}>
                    {msg.role === 'bot' && (
                      <div className="wa-avatar-small">
                        <span>DP</span>
                      </div>
                    )}
                    <div className="wa-msg-content">
                      <div className="wa-msg-bubble">
                        {safeRender(msg.text)}
                      </div>
                      {msg.options && i === messages.length - 1 && !complete && (
                        <div className="wa-options">
                          {msg.options.map((opt) => (
                            <button
                              key={opt.value}
                              className="wa-option-btn"
                              onClick={() => handleOptionClick(opt.value)}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {(submitting || paymentProcessing) && (
                  <div className="wa-msg wa-msg-bot">
                    <div className="wa-avatar-small">
                      <span>DP</span>
                    </div>
                    <div className="wa-msg-content">
                      <div className="wa-msg-bubble wa-typing">
                        <span></span>
                        <span></span>
                        <span></span>
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            </div>

            {showInput && (
              <form className="wa-input-bar" onSubmit={handleInputSubmit}>
                <input
                  ref={inputRef}
                  type={currentFlowStep.inputType || 'text'}
                  value={inputValue}
                  onChange={(e) => {
                    setInputValue(e.target.value)
                    setError(null)
                  }}
                  placeholder={currentFlowStep.placeholder || 'Type your response...'}
                  className="wa-input"
                  disabled={submitting}
                  autoFocus
                />
                <button
                  type="submit"
                  className="wa-send-btn"
                  disabled={!inputValue.trim() || submitting}
                >
                  <Icon name="send" size={18} />
                </button>
              </form>
            )}

            {error && <div className="wa-error">{error}</div>}

            {complete && (
              <div className="wa-footer-bar">
                <button className="wa-restart-btn" onClick={restart}>
                  <Icon name="refresh" size={16} /> Start New Enquiry
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
