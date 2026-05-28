export interface PhoneFormatResult {
  display: string
  e164: string
  whatsapp: string
  isValid: boolean
}

const SA_MOBILE_PATTERN = /^27[6-8][0-9]{8}$/

export function normalizeSouthAfricanPhone(input?: string | null): PhoneFormatResult {
  const raw = input?.trim() ?? ''
  const digits = raw.replace(/[^\d]/g, '')
  let normalized = digits

  if (normalized.startsWith('0027')) {
    normalized = normalized.slice(2)
  } else if (normalized.startsWith('0')) {
    normalized = `27${normalized.slice(1)}`
  }

  const isValid = SA_MOBILE_PATTERN.test(normalized)
  const e164 = isValid ? `+${normalized}` : ''
  const whatsapp = isValid ? normalized : ''
  const display = isValid
    ? `+27 ${normalized.slice(2, 4)} ${normalized.slice(4, 7)} ${normalized.slice(7)}`
    : raw

  return { display, e164, whatsapp, isValid }
}

export function isValidSouthAfricanPhone(input?: string | null) {
  return normalizeSouthAfricanPhone(input).isValid
}
