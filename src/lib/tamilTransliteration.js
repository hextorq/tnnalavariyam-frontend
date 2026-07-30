const independentVowels = {
  அ: 'A',
  ஆ: 'Aa',
  இ: 'I',
  ஈ: 'Ee',
  உ: 'U',
  ஊ: 'Oo',
  எ: 'E',
  ஏ: 'Ae',
  ஐ: 'Ai',
  ஒ: 'O',
  ஓ: 'Oa',
  ஔ: 'Au',
}

const consonants = {
  க: 'k',
  ங: 'ng',
  ச: 's',
  ஞ: 'ny',
  ட: 't',
  ண: 'n',
  த: 'th',
  ந: 'n',
  ப: 'p',
  ம: 'm',
  ய: 'y',
  ர: 'r',
  ல: 'l',
  வ: 'v',
  ழ: 'zh',
  ள: 'l',
  ற: 'r',
  ன: 'n',
  ஜ: 'j',
  ஷ: 'sh',
  ஸ: 's',
  ஹ: 'h',
}

const vowelMarks = {
  'ா': 'aa',
  'ி': 'i',
  'ீ': 'ee',
  'ு': 'u',
  'ூ': 'oo',
  'ெ': 'e',
  'ே': 'ae',
  'ை': 'ai',
  'ொ': 'o',
  'ோ': 'oa',
  'ௌ': 'au',
}

export function transliterateTamil(text = '') {
  let output = ''

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index]
    const nextChar = text[index + 1]

    if (independentVowels[char]) {
      output += independentVowels[char]
      continue
    }

    if (consonants[char]) {
      if (nextChar === '்') {
        output += consonants[char]
        index += 1
        continue
      }
      if (vowelMarks[nextChar]) {
        output += consonants[char] + vowelMarks[nextChar]
        index += 1
        continue
      }
      output += `${consonants[char]}a`
      continue
    }

    output += vowelMarks[char] || char
  }

  return output
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}
