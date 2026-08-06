// ============================================================
// VITARA — Professionnels de santé
// ============================================================

export interface Professional {
  id: string;
  name: string;
  title: string;
  dept: string;
  lang: string[];
  specialties: string[];
  acceptsCNESST?: boolean;
  acceptsSAAQ?: boolean;
}

// Médecins GMF
export const GMF_DOCTORS: Professional[] = [
  { id:'d001', name:'Dr. Fahd Awada', title:'Médecin de famille', dept:'medecine-familiale', lang:['fr','ar','en'], specialties:['consultation','suivi','ordonnance','bilan'], acceptsCNESST:false, acceptsSAAQ:false },
  { id:'d002', name:'Dr. Bogdan Caricevic', title:'Médecin de famille', dept:'medecine-familiale', lang:['fr','en'], specialties:['consultation','suivi','pédiatrie'], acceptsCNESST:false, acceptsSAAQ:false },
  { id:'d003', name:'Dr. Lucien Fruchtermann', title:'Médecin de famille', dept:'medecine-familiale', lang:['fr','en'], specialties:['consultation','gériatrie','suivi'], acceptsCNESST:false, acceptsSAAQ:false },
  { id:'d004', name:'Dr. Myrlène Kalim', title:'Médecin de famille', dept:'medecine-familiale', lang:['fr','en','ht'], specialties:['consultation','gynécologie','suivi'], acceptsCNESST:false, acceptsSAAQ:false },
  { id:'d005', name:'Dr. Claudette Moriconi', title:'Médecin de famille', dept:'medecine-familiale', lang:['fr','it','en'], specialties:['consultation','suivi','gériatrie'], acceptsCNESST:false, acceptsSAAQ:false },
  { id:'d006', name:'Dr. Stephanie A. Moynihan', title:'Médecin de famille', dept:'medecine-familiale', lang:['fr','en'], specialties:['consultation','pédiatrie','suivi'], acceptsCNESST:false, acceptsSAAQ:false },
  { id:'d007', name:'Dr. Huguette Ohayon-Gabbay', title:'Médecin de famille', dept:'medecine-familiale', lang:['fr','en','he'], specialties:['consultation','suivi','femmes'], acceptsCNESST:false, acceptsSAAQ:false },
  { id:'d008', name:'Dr. Samuel Serfaty', title:'Médecin de famille', dept:'medecine-familiale', lang:['fr','en','ar'], specialties:['consultation','suivi','sans-rdv'], acceptsCNESST:false, acceptsSAAQ:false },
  { id:'d009', name:'Dr. Odette Préfontaine', title:'Médecin de famille', dept:'medecine-familiale', lang:['fr'], specialties:['consultation','suivi','gériatrie'], acceptsCNESST:false, acceptsSAAQ:false },
];

// Physiothérapeutes
export const PHYSIO: Professional[] = [
  { id:'p001', name:'Shaheer Haider, PT', title:'Physiothérapeute', dept:'physiotherapie', lang:['fr','en','ur'], specialties:['rachis','sport','CNESST','SAAQ','post-op','membres'], acceptsCNESST:true, acceptsSAAQ:true },
  { id:'p002', name:'Omar Khalil, PT', title:'Physiothérapeute', dept:'physiotherapie', lang:['fr','en','ar'], specialties:['membres inférieurs','sport','post-op','rachis'], acceptsCNESST:true, acceptsSAAQ:true },
  { id:'p003', name:'Sophie Tremblay, PT', title:'Physiothérapeute', dept:'physiotherapie', lang:['fr','en'], specialties:['pédiatrique','neurologique','membres supérieurs'], acceptsCNESST:false, acceptsSAAQ:true },
];

// Ergothérapeutes
export const ERGO: Professional[] = [
  { id:'e001', name:'Fatima Zahra, erg.', title:'Ergothérapeute', dept:'ergotherapie', lang:['fr','ar'], specialties:['retour au travail','AVC','CNESST'], acceptsCNESST:true, acceptsSAAQ:false },
  { id:'e002', name:'Lucas Bernard, erg.', title:'Ergothérapeute', dept:'ergotherapie', lang:['fr','en'], specialties:['réadaptation','cognitif','SAAQ'], acceptsCNESST:true, acceptsSAAQ:true },
];

// Nutritionnistes
export const NUTRITION: Professional[] = [
  { id:'n001', name:'Claire Fontaine, Dt.P.', title:'Nutritionniste-Diététiste', dept:'nutrition', lang:['fr','en'], specialties:['diabète','poids','cholestérol'] },
  { id:'n002', name:'Youssef Benali, Dt.P.', title:'Nutritionniste-Diététiste', dept:'nutrition', lang:['fr','en','ar'], specialties:['nutrition sportive','maladies chroniques','végétalisme'] },
];

// Psychologie / Santé mentale
export const PSY: Professional[] = [
  { id:'ps001', name:'Dr. Amira Hassan, Ph.D.', title:'Psychologue', dept:'psychologie', lang:['fr','en','ar'], specialties:['TCC','trauma','PTSD','anxiété'] },
  { id:'ps002', name:'M. Pierre Dubois, M.Ps.', title:'Psychologue', dept:'psychologie', lang:['fr','en'], specialties:['dépression','gestion stress','burn-out'] },
  { id:'ps003', name:'Mme Sarah Cohen, T.S.', title:'Travailleuse sociale', dept:'psychologie', lang:['fr','en','he'], specialties:['crise','famille','deuil'] },
];

// Spécialistes
export const SPECIALISTS: Professional[] = [
  { id:'sp001', name:'Dr. Marc Tremblay', title:'Cardiologue', dept:'cardiologie', lang:['fr','en'], specialties:['hypertension','arythmie','prévention'] },
];

// Praticiens sans-rendez-vous
export const WALK_IN: Professional[] = [
  { id:'inf001', name:'Infirmière praticienne spécialisée', title:'IPS', dept:'sans-rdv', lang:['fr','en'], specialties:['soins aigus','infections','prescriptions'] },
];

export function getProfessionalsByDept(dept: string): Professional[] {
  const all = [...GMF_DOCTORS, ...PHYSIO, ...ERGO, ...NUTRITION, ...PSY, ...SPECIALISTS, ...WALK_IN];
  return all.filter(p => p.dept === dept);
}

export function formatDoctorList(professionals: Professional[], lang = 'fr'): string {
  return professionals.map((p, i) => `${i+1}. ${p.name}${p.lang.includes(lang) ? ' ✓' : ''}`).join('\n');
}
