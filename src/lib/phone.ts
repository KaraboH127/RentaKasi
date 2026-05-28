export interface PhoneFormatResult {
  display: string
  e164: string
  digits: string
  whatsapp: string
  isValid: boolean
  reason?: string
}

const SA_MOBILE_PATTERN = /^27[6-8][0-9]{8}$/

export function normalizeSouthAfricanPhone(input?: string | null): PhoneFormatResult {
  const raw = input?.trim() ?? ''
  const digits = raw.replace(/[^\d]/g, '')

  if (!raw || !digits) {
    return { display: raw, e164: '', digits: '', whatsapp: '', isValid: false, reason: 'missing' }
  }

  let normalized = digits

  if (normalized.startsWith('0027')) {
    normalized = normalized.slice(2)
  } else if (normalized.startsWith('27')) {
    normalized = normalized
  } else if (normalized.startsWith('0')) {
    normalized = `27${normalized.slice(1)}`
  } else if (normalized.length === 9 && /^[6-8]/.test(normalized)) {
    normalized = `27${normalized}`
  }

  const isValid = SA_MOBILE_PATTERN.test(normalized)
  const e164 = isValid ? `+${normalized}` : ''
  const whatsapp = isValid ? normalized : ''
  const display = isValid
    ? `+27 ${normalized.slice(2, 4)} ${normalized.slice(4, 7)} ${normalized.slice(7)}`
    : raw

  return {
    display,
    e164,
    digits: isValid ? normalized : digits,
    whatsapp,
    isValid,
    reason: isValid ? undefined : 'invalid_sa_mobile',
  }
}

export function isValidSouthAfricanPhone(input?: string | null) {
  return normalizeSouthAfricanPhone(input).isValid
}

export function buildWhatsAppUrl(phoneInput: string | null | undefined, message: string) {
  const phone = normalizeSouthAfricanPhone(phoneInput)
  if (!phone.isValid) return null

  return `https://wa.me/${phone.whatsapp}?text=${encodeURIComponent(message)}`
}
