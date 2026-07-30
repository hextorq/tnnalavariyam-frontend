export function normalizePhone(value = '') {
  return value.replace(/\D/g, '').slice(0, 10)
}

export function normalizePincode(value = '') {
  return value.replace(/\D/g, '').slice(0, 6)
}

export const phoneInputProps = {
  inputMode: 'numeric',
  maxLength: 10,
  minLength: 10,
  pattern: '[0-9]{10}',
  type: 'tel',
}

export const pincodeInputProps = {
  inputMode: 'numeric',
  maxLength: 6,
  minLength: 6,
  pattern: '[0-9]{6}',
}
