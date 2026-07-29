export const roleHierarchy = [
  {
    role: 'Super Admin',
    tamilRole: 'முழு நிர்வாகி',
    scope: 'All Tamil Nadu',
    canView: 'Every state, district, taluk, village and partner application',
  },
  {
    role: 'State Admin',
    tamilRole: 'மாநில நிர்வாகி',
    scope: 'State',
    canView: 'All district, taluk, village and partner applications under the assigned state',
  },
  {
    role: 'District Admin',
    tamilRole: 'மாவட்ட நிர்வாகி',
    scope: 'District',
    canView: 'All taluk, village and partner applications under the assigned district',
  },
  {
    role: 'Taluk Admin',
    tamilRole: 'தாலுகா நிர்வாகி',
    scope: 'Taluk',
    canView: 'All village and partner applications under the assigned taluk',
  },
  {
    role: 'Village Admin',
    tamilRole: 'கிராம நிர்வாகி',
    scope: 'Village',
    canView: 'All partner applications under the assigned village',
  },
  {
    role: 'Village Partner',
    tamilRole: 'கிராம பங்குதாரர்',
    scope: 'Village partner account',
    canView: 'Only applications submitted by that partner. More than one partner can work in the same village.',
  },
]

export const rbacRules = [
  'Every application is attached to the applicant, selected form and village hierarchy scope.',
  'Higher roles can review applications from their own scope and every child scope below it.',
  'Village partners can submit all six forms and track only their own application numbers.',
  'If an officer returns an application with a reason, the partner edits the same application and resubmits it with the same application number.',
]

export const applicationWorkflow = [
  'Partner submits application with payment reference',
  'System generates one application number',
  'Hierarchy officer reviews application details',
  'Officer approves or returns/rejects with a clear reason',
  'Partner corrects the same application record',
  'Partner resubmits and the application number remains unchanged',
]
