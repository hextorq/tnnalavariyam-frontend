const independentVowels = {
  அ: 'A',
  ஆ: 'A',
  இ: 'I',
  ஈ: 'I',
  உ: 'U',
  ஊ: 'U',
  எ: 'E',
  ஏ: 'E',
  ஐ: 'Ai',
  ஒ: 'O',
  ஓ: 'O',
  ஔ: 'Au',
}

const consonants = {
  க: 'k',
  ங: 'ng',
  ச: 'ch',
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
  'ா': 'a',
  'ி': 'i',
  'ீ': 'i',
  'ு': 'u',
  'ூ': 'u',
  'ெ': 'e',
  'ே': 'e',
  'ை': 'ai',
  'ொ': 'o',
  'ோ': 'o',
  'ௌ': 'au',
}

const commonNames = {
  காஞ்சிபுரம்: 'Kanchipuram',
  செங்கல்பட்டு: 'Chengalpattu',
  திருவள்ளூர்: 'Tiruvallur',
  திருவள்ளுர்: 'Tiruvallur',
  சென்னை: 'Chennai',
  இராணிப்பேட்டை: 'Ranipet',
  ராணிப்பேட்டை: 'Ranipet',
  வேலூர்: 'Vellore',
  திருப்பத்தூர்: 'Tirupathur',
  திருவண்ணாமலை: 'Thiruvannamalai',
  விழுப்புரம்: 'Villupuram',
  கள்ளக்குறிச்சி: 'Kallakurichi',
  சேலம்: 'Salem',
  நாமக்கல்: 'Namakkal',
  தர்மபுரி: 'Dharmapuri',
  கிருஷ்ணகிரி: 'Krishnagiri',
  ஈரோடு: 'Erode',
  திருப்பூர்: 'Tiruppur',
  கோயம்புத்தூர்: 'Coimbatore',
  நீலகிரி: 'Nilgiris',
  கடலூர்: 'Cuddalore',
  மயிலாடுதுறை: 'Mayiladuthurai',
  நாகப்பட்டினம்: 'Nagapattinam',
  திருவாரூர்: 'Thiruvarur',
  தஞ்சாவூர்: 'Thanjavur',
  திருச்சிராப்பள்ளி: 'Tiruchirappalli',
  கரூர்: 'Karur',
  பெரம்பலூர்: 'Perambalur',
  அரியலூர்: 'Ariyalur',
  புதுக்கோட்டை: 'Pudukkottai',
  மதுரை: 'Madurai',
  தேனி: 'Theni',
  திண்டுக்கல்: 'Dindigul',
  இராமநாதபுரம்: 'Ramanathapuram',
  விருதுநகர்: 'Virudhunagar',
  சிவகங்கை: 'Sivaganga',
  தூத்துக்குடி: 'Thoothukudi',
  திருநெல்வேலி: 'Tirunelveli',
  தென்காசி: 'Tenkasi',
  கன்னியாகுமரி: 'Kanniyakumari',
  போளுர்: 'Polur',
}

export function transliterateTamil(text = '') {
  if (commonNames[text]) return commonNames[text]

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
    .replace(/a\b/gi, '')
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}
