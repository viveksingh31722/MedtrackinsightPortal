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

  // 3. Generate 60 additional random mock records for testing scale & UI pagination
  const drugNames = ['Liraglutide', 'Dapagliflozin', 'Nivolumab', 'Ipilimumab', 'Trastuzumab', 'Rituximab', 'Infliximab', 'Etanercept', 'Ustekinumab', 'Dupilumab', 'Secukinumab', 'Ocrelizumab', 'Emicizumab', 'Risankizumab', 'Teclistamab', 'Mirvetuximab', 'Epcoritamab', 'Glofitamab', 'Talquetamab', 'Elranatamab', 'Zanubrutinib', 'Acalabrutinib', 'Pirtobrutinib', 'Capivasertib', 'Elacestrant', 'Sotatercept', 'Margetuximab', 'Loncastuximab', 'Tisotumab', 'Garnetumab', 'Velsertib', 'Daxotral', 'Pegzilarginase', 'Efruxifermin', 'Bifenercept', 'Ranibizumab', 'Pegfilgrastim', 'Filgrastim', 'Denosumab', 'Daratumumab'];
  const indications = ['Type 2 Diabetes', 'Heart Failure', 'Non-Small Cell Lung Cancer', 'Melanoma', 'Renal Cell Carcinoma', 'Breast Cancer', 'Rheumatoid Arthritis', 'Plaque Psoriasis', 'Atopic Dermatitis', 'Multiple Sclerosis', 'Hemophilia A', 'Crohns Disease', 'Ulcerative Colitis', 'Asthma', 'Lupus Nephritis', 'Ovarian Cancer', 'Multiple Myeloma', 'NASH', 'Anemia'];
  const moas = ['GLP-1 Receptor Agonist', 'SGLT2 Inhibitor', 'PD-1 Inhibitor', 'CTLA-4 Inhibitor', 'HER2 Receptor Antagonist', 'CD20 Monoclonal Antibody', 'TNF Inhibitor', 'IL-23 Inhibitor', 'IL-4R/IL-13 Inhibitor', 'IL-17A Inhibitor', 'CD20 x CD3 Bispecific Antibody', 'BCMA x CD3 Bispecific Antibody', 'BTK Inhibitor', 'AKT Inhibitor', 'Estrogen Receptor Antagonist', 'Activin Receptor Type IIA Ligand Trap', 'VEGF Inhibitor', 'G-CSF Receptor Agonist', 'RANKL Inhibitor', 'CD38 Monoclonal Antibody'];
  const sponsors = ['Merck & Co.', 'Novo Nordisk', 'AstraZeneca', 'Bristol Myers Squibb', 'Roche Genentech', 'Pfizer', 'Eli Lilly', 'AbbVie', 'Johnson & Johnson', 'Sanofi', 'Novartis', 'GlaxoSmithKline', 'Takeda', 'Amgen', 'Gilead Sciences'];
  const routes = ['Intravenous Infusion', 'Subcutaneous Injection', 'Oral Tablet', 'Oral Capsule', 'Intramuscular Injection'];
  const phases = ['Phase I', 'Phase II', 'Phase III', 'Pre-clinical', 'Approved'];

  for (let i = 0; i < 60; i++) {
    const drugName = drugNames[i % drugNames.length] + ' ' + (Math.floor(i / drugNames.length) + 1);
    const indication = indications[Math.floor(Math.random() * indications.length)];
    const moa = moas[Math.floor(Math.random() * moas.length)];
    const phase = phases[Math.floor(Math.random() * phases.length)];
    const dataset = phase === 'Approved' ? 'Approved Drugs' : 'Clinical Pipeline';
    const sponsor = sponsors[Math.floor(Math.random() * sponsors.length)];
    const brandName = phase === 'Approved' ? (drugName.substring(0, 5) + 'ra') : 'N/A';
    const target = moa.replace(' Inhibitor', '').replace(' Receptor Agonist', '').replace(' Receptor Antagonist', '') + ' Protein';
    const status = phase === 'Approved' ? 'Active' : (Math.random() > 0.3 ? 'Recruiting' : 'Completed');
    const route = routes[Math.floor(Math.random() * routes.length)];

    seedMedicines.push(
      makeDrugData(
        drugName,
        indication,
        moa,
        phase,
        dataset,
        sponsor,
        brandName,
        target,
        status,
        route
      )
    );
  }

  await prisma.medicine.createMany({
    data: seedMedicines,
  });

  console.log(`💊 Populated ${seedMedicines.length} medicine records containing 45 detail columns each.`);

  // Trigger Elasticsearch reindexing dynamically
  try {
    console.log('🔄 Seeding complete. Triggering Elasticsearch indexing...');
    const { execSync } = require('child_process');
    execSync('npx ts-node prisma/reindex.ts', { stdio: 'inherit' });
  } catch (esError) {
    console.warn('⚠️ Elasticsearch reindexing was skipped or failed. Ensure your Elasticsearch container is running.');
  }

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
