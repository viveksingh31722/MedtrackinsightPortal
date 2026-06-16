import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Dynamic mock generator to compile a realistic 45-column structure for each drug entry
const makeDrugData = (
  drugName: string,
  indication: string,
  moa: string,
  phase: string,
  dataset: 'Approved Drugs' | 'Clinical Pipeline',
  sponsor: string,
  brandName: string,
  target: string,
  status: string,
  route: string
) => {
  return {
    drugName,
    indication,
    moa,
    additionalData: JSON.stringify({
      // Primary search mappings
      drugName,
      indication,
      moa,
      phase,
      dataset,
      sponsor,
      brandName,
      target,
      status,
      route,
      
      // Clinical & Scientific Specifications (Remaining 35 columns)
      country: 'USA',
      completionDate: '2025-10-30',
      trialId: 'NCT0' + Math.floor(10000000 + Math.random() * 90000000),
      estimatedEnrollment: Math.floor(200 + Math.random() * 1500),
      primaryEndpoint: 'Overall Response Rate (ORR)',
      moleculeType: 'Monoclonal Antibody',
      approvalYear: dataset === 'Approved Drugs' ? '2021' : 'Pending',
      chemicalFormula: 'C6532H10034N1712O2022S44',
      casRegistryNumber: '1374853-91-4',
      atcCode: 'L01FF02',
      patentExpiry: '2034-08-15',
      dosageForms: '100 mg / 4 mL sterile solution',
      halfLife: '22 days',
      mechanismCategory: 'Immunotherapy',
      sideEffects: 'Fatigue, nausea, diarrhea, pruritus, rash',
      contraindications: 'Severe hypersensitivity to active substance',
      excretion: 'Glomerular filtration & receptor-mediated clearance',
      molecularWeight: '149 kDa',
      waterSolubility: 'Soluble in saline buffers at physiological pH',
      storageTemperature: '2-8°C (Do not freeze, protect from light)',
      blackBoxWarning: 'Severe immune-mediated pneumonitis and colitis warnings',
      fdaOrphanDrugStatus: 'Yes',
      emaOrphanDrugStatus: 'Yes',
      pmdaOrphanDrugStatus: 'Yes',
      chmpOpinionDate: '2021-04-12',
      pediatricStudyRequired: 'Yes',
      geriatricUsagePrecaution: 'No dosage adjustments necessary for patients over 65',
      pregnancyCategory: 'Category D - Potential fetal harm risks',
      nursingPrecaution: 'Discontinue nursing during therapy and for 4 months post last dose',
      drugInteractions: 'Systemic corticosteroids may interfere with pharmacodynamic activity',
      atcClassification: 'Antineoplastic agents, monoclonal antibodies',
      adverseReactionRate: 'Grade 3 or 4 adverse reactions reported in 12% of trials',
      firstApprovalJurisdiction: 'FDA (United States)',
      activeIngredients: drugName,
      manufacturerName: sponsor + ' Inc.',
      therapeuticClass: 'Oncology / Immunotherapy',
      safetyProfile: 'Manageable with early corticosteroid intervention',
      developmentTimeline: '6.5 years from Pre-clinical to Phase III completion',
      efficacyRate: '45% Objective Response Rate vs 18% chemotherapy control',
      targetAffinity: 'Kd = 0.3 nM for target receptor binding',
      phase3StartDate: '2020-01-15',
      registrationalTrial: 'Key-Study-901',
      commercialAvailability: dataset === 'Approved Drugs' ? 'Immediate' : 'Under Review',
    }),
  };
};

async function main() {
  console.log('🌱 Start seeding clinical database...');

  // Delete existing records to allow re-runnable seeding runs
  await prisma.medicine.deleteMany({});
  await prisma.user.deleteMany({});

  // 1. Create default test accounts
  const bcrypt = require('bcrypt');
  const hashedUserPassword = await bcrypt.hash('password123', 10);
  const hashedAdminPassword = await bcrypt.hash('admin123', 10);

  // Normal unpaid/guest account
  await prisma.user.create({
    data: {
      email: 'user@medtrack.com',
      password: hashedUserPassword,
      isSubscribed: false,
    },
  });

  // Paid pro user account
  const subEnd = new Date();
  subEnd.setDate(subEnd.getDate() + 30);
  await prisma.user.create({
    data: {
      email: 'pro@medtrack.com',
      password: hashedUserPassword,
      isSubscribed: true,
      subscriptionEnd: subEnd,
    },
  });

  // Admin user
  await prisma.user.create({
    data: {
      email: 'admin@medtrack.com',
      password: hashedAdminPassword,
      isSubscribed: true, // admin has pro view access
      subscriptionEnd: subEnd,
    },
  });

  console.log('👤 Created default accounts:');
  console.log('   - Guest: user@medtrack.com / password123');
  console.log('   - Pro: pro@medtrack.com / password123');
  console.log('   - Admin: admin@medtrack.com / admin123');

  // 2. Populate standard sample clinical records (Total 10 detailed profiles)
  const seedMedicines = [
    makeDrugData(
      'Pembrolizumab',
      'Non-Small Cell Lung Cancer',
      'PD-1 Inhibitor',
      'Approved',
      'Approved Drugs',
      'Merck & Co.',
      'Keytruda',
      'Programmed Death Receptor 1',
      'Active',
      'Intravenous Infusion'
    ),
    makeDrugData(
      'Semaglutide',
      'Type 2 Diabetes & Obesity',
      'GLP-1 Receptor Agonist',
      'Approved',
      'Approved Drugs',
      'Novo Nordisk',
      'Ozempic / Wegovy',
      'Glucagon-like Peptide-1 Receptor',
      'Active',
      'Subcutaneous Injection'
    ),
    makeDrugData(
      'Adalimumab',
      'Rheumatoid Arthritis',
      'TNF-Alpha Inhibitor',
      'Approved',
      'Approved Drugs',
      'AbbVie',
      'Humira',
      'Tumor Necrosis Factor Alpha',
      'Active',
      'Subcutaneous Injection'
    ),
    makeDrugData(
      'Lecanemab',
      'Alzheimer\'s Disease',
      'Amyloid-Beta Antibody',
      'Approved',
      'Approved Drugs',
      'Eisai & Biogen',
      'Leqembi',
      'Amyloid Beta Aggregates',
      'Active',
      'Intravenous Infusion'
    ),
    makeDrugData(
      'Empagliflozin',
      'Heart Failure with Preserved Ejection Fraction',
      'SGLT2 Inhibitor',
      'Approved',
      'Approved Drugs',
      'Boehringer Ingelheim',
      'Jardiance',
      'Sodium-Glucose Cotransporter 2',
      'Active',
      'Oral Tablet'
    ),
    makeDrugData(
      'Tirzepatide',
      'Obesity & Chronic Weight Management',
      'Dual GIP & GLP-1 Receptor Agonist',
      'Approved',
      'Approved Drugs',
      'Eli Lilly',
      'Mounjaro / Zepbound',
      'GIP & GLP-1 Receptors',
      'Active',
      'Subcutaneous Injection'
    ),
    makeDrugData(
      'Niraparib',
      'Ovarian Cancer Maintenance',
      'PARP Inhibitor',
      'Approved',
      'Approved Drugs',
      'GSK',
      'Zejula',
      'Poly (ADP-ribose) Polymerase',
      'Active',
      'Oral Tablet'
    ),
    // Clinical Pipeline drugs
    makeDrugData(
      'Gantenerumab',
      'Early Alzheimer\'s Dementia',
      'Amyloid-Beta Aggregation Inhibitor',
      'Phase III',
      'Clinical Pipeline',
      'Roche Genentech',
      'N/A',
      'Amyloid Beta Fibrils',
      'Completed',
      'Subcutaneous Injection'
    ),
    makeDrugData(
      'Survodutide',
      'NASH (Non-Alcoholic Steatohepatitis)',
      'Dual GCGR/GLP-1R Agonist',
      'Phase III',
      'Clinical Pipeline',
      'Boehringer Ingelheim',
      'N/A',
      'Glucagon and GLP-1 Receptors',
      'Recruiting',
      'Subcutaneous Injection'
    ),
    makeDrugData(
      'Donanemab',
      'Early Stage Cognitive Decline',
      'Amyloid-Beta Monoclonal Antibody',
      'Phase III',
      'Clinical Pipeline',
      'Eli Lilly',
      'N/A',
      'N3pG-Amyloid Beta peptide',
      'Pending Approval',
      'Intravenous Infusion'
    ),
  ];

  await prisma.medicine.createMany({
    data: seedMedicines,
  });

  console.log(`💊 Populated ${seedMedicines.length} medicine records containing 45 detail columns each.`);
  console.log('✅ Seeding completed.');
}

main()
  .catch((e) => {
    console.error('Seeding critical failure:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
