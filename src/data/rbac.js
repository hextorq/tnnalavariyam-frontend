export const roleHierarchy = [
  {
    role: 'Super Admin',
    tamilRole: 'முழு நிர்வாகி',
    scope: 'All Tamil Nadu',
    canView: 'Every state, district, taluk, village and user application',
  },
  {
    role: 'State Admin',
    tamilRole: 'மாநில நிர்வாகி',
    scope: 'State',
    canView: 'All district, taluk, village and user applications under the assigned state',
  },
  {
    role: 'District Admin',
    tamilRole: 'மாவட்ட நிர்வாகி',
    scope: 'District',
    canView: 'All taluk, village and user applications under the assigned district',
  },
  {
    role: 'Taluk Admin',
    tamilRole: 'தாலுகா நிர்வாகி',
    scope: 'Taluk',
    canView: 'All village and user applications under the assigned taluk',
  },
  {
    role: 'Village Admin',
    tamilRole: 'கிராம நிர்வாகி',
    scope: 'Village',
    canView: 'All user applications under the assigned village',
  },
  {
    role: 'User',
    tamilRole: 'பயனர்',
    scope: 'Village citizen account',
    canView: 'Only their own six welfare application forms',
  },
]

export const rbacRules = [
  'Every application is attached to the applicant, selected form and village hierarchy scope.',
  'Higher roles can review applications from their own scope and every child scope below it.',
  'Users can submit all six forms, but cannot view other users applications.',
]
