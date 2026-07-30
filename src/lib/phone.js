export function normalizePhone(value = '') {
  return value.replace(/\D/g, '').slice(0, 10)
}

export const phoneInputProps = {
  inputMode: 'numeric',
  maxLength: 10,
  minLength: 10,
  pattern: '[0-9]{10}',
  type: 'tel',
}
