export const applicationForms = [
  {
    id: 'new-registration',
    title: 'New Registration',
    tamilTitle: 'புதிய விண்ணப்பப் பதிவு',
    fields: ['Worker Name', 'District', 'Phone Number', 'Photo', 'Date of Birth', 'DOB Document', 'Religion', 'Caste', 'Sub-Caste', 'Workers Job', 'Bank Passbook', 'Aadhar Card', 'Ration Card', 'Worker Registration Card', 'Nominee Name', 'Nominee Aadhar', 'Signature', 'Live Photo'],
  },
  {
    id: 'renewal',
    title: 'Renewal',
    tamilTitle: 'புதுப்பித்தல்',
    fields: ['Worker Name', 'District', 'Phone Number', 'Photo', 'Date of Birth', 'DOB Document', 'Religion', 'Caste', 'Sub-Caste', 'Workers Job', 'Bank Passbook', 'Aadhar Card', 'Ration Card', 'Worker Registration Card', 'Nominee Name', 'Nominee Aadhar', 'Signature', 'Live Photo'],
  },
  {
    id: 'education-6-9',
    title: 'Application for Educational Assistance for studying in 6th/7th/8th/9th Standard',
    tamilTitle: '6 ஆம் வகுப்பு / 7 ஆம் வகுப்பு / 8 ஆம் வகுப்பு / 9 ஆம் வகுப்பு கல்வி உதவி பெறுவதற்கான விண்ணப்பம்',
    fields: ['Standard', 'Child Name', 'Academic Year', 'Child Aadhar', 'Bonafide Certificate', 'Worker Name', 'Phone Number', 'District', 'Worker Registration Card', 'Aadhar Card', 'Ration Card', 'Bank Passbook Front', 'Bank Passbook Last', 'Signature', 'Live Photo'],
  },
  {
    id: 'education-girls-10-12',
    title: 'Application for Educational Assistance for Girl Children studying in 10th/11th/12th Standard',
    tamilTitle: '10 ஆம் வகுப்பு / 11 ஆம் வகுப்பு / 12 ஆம் வகுப்பு பெண் குழந்தைகளுக்கான கல்வி உதவி பெறுவதற்கான விண்ணப்பம்',
    fields: ['Standard', 'Child Name', 'Academic Year', 'Child Aadhar', 'Bonafide Certificate', 'Worker Name', 'Phone Number', 'District', 'Worker Registration Card', 'Aadhar Card', 'Ration Card', 'Bank Passbook Front', 'Bank Passbook Last', 'Signature', 'Live Photo'],
  },
  {
    id: 'education-pass',
    title: 'Application for Educational Assistance for Pass in 10th and 12th Standard Examination',
    tamilTitle: '10 ஆம் வகுப்பு மற்றும் 12 ஆம் வகுப்பு தேர்வில் தேர்ச்சி பெறுவதற்கான கல்வி உதவி பெறுவதற்கான விண்ணப்பம்',
    fields: ['Examination Passed', 'Child Name', 'Academic Year', 'Child Aadhar', 'Mark Sheet', 'Worker Name', 'Phone Number', 'District', 'Worker Registration Card', 'Aadhar Card', 'Ration Card', 'Bank Passbook Front', 'Bank Passbook Last', 'Signature', 'Live Photo'],
  },
  {
    id: 'higher-education',
    title: 'Application for Higher Education and Other Welfare Schemes',
    tamilTitle: 'உயர் கல்வி மற்றும் பிற நலத்திட்டங்களுக்கான விண்ணப்பம்',
    description:
      'இந்த விண்ணப்பத்தின் மூலம் உயர் கல்வி உதவி மற்றும் மற்ற 9 நலத்திட்டங்களுக்கும் விண்ணப்பிக்கலாம். விண்ணப்ப வகைகள்: உயர் கல்வி, திருமண உதவித் தொகை, மகப்பேறு, கருக்கலைப்பு, இயற்கை மரணம், விபத்து மரணம், கண் கண்ணாடி, ஓய்வூதியம், வீடு கட்டும் திட்டம், ஆட்டோ வாங்க மானியம். / This form covers Higher Education assistance and the other 9 welfare applications. Application types: Higher Education, Marriage, Maternity, Abortion, Natural Death, Accident Death, Spectacles, Pension, House Construction, Auto Subsidy.',
    applicationTypeOptions: [
      'Higher Education / உயர் கல்வி',
      'திருமண உதவித் தொகை',
      'மகப்பேறு',
      'கருக்கலைப்பு',
      'இயற்கை மரணம்',
      'விபத்து மரணம்',
      'கண் கண்ணாடி',
      'ஓய்வூதியம்',
      'வீடு கட்டும் திட்டம்',
      'ஆட்டோ வாங்க மானியம்',
    ],
    fields: ['Course Type', 'Child Name', 'Course Name', 'Course Duration', 'Applying Year', 'Academic Year', 'Child Aadhar', 'Bonafide Certificate', 'Worker Name', 'Phone Number', 'District', 'Worker Registration Card', 'Worker Aadhar', 'Ration Card', 'Bank Passbook Front', 'Bank Passbook Last', 'Signature', 'Live Photo'],
  },
]
