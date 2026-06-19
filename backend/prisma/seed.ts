import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Helper to generate random item from list
const choice = <T>(list: T[]): T => list[Math.floor(Math.random() * list.length)];

// Generate a PipelineProspector record
const makePipelineProspector = (
  srNo: string,
  leadDrug: string,
  primaryIndication: string,
  mechanismOfAction: string,
  developmentPhase: string,
  sponsor: string,
  routeOfAdministration: string
) => {
  const country = choice(['US', 'EU', 'Japan', 'Canada', 'Korea', 'India', 'Aus/NZ']);
  return {
    srNo,
    companyName: sponsor + ' Corp',
    headQuarter: choice(['New York, US', 'London, UK', 'Tokyo, Japan', 'Basel, Switzerland', 'Frankfurt, Germany']),
    nctNumber: 'NCT0' + Math.floor(10000000 + Math.random() * 90000000),
    leadDrug,
    secondaryDrug: choice(['Metformin', 'Aspirin', 'Placebo', 'N/A']),
    primaryIndication,
    therapeuticArea: choice(['Oncology', 'Cardiovascular', 'Immunology', 'Neurology', 'Endocrine']),
    phases: developmentPhase,
    developmentPhase,
    startingDate: '2023-01-15',
    completionDate: '2026-12-30',
    predictionOfLaunching: '2027',
    trialStatus: choice(['Recruiting', 'Active, not recruiting', 'Completed', 'Terminated']),
    terminatedReason: 'N/A',
    moleculeType: choice(['Monoclonal Antibody', 'Small Molecule', 'Recombinant Protein', 'Gene Therapy']),
    moleculeClass: choice(['PD-1 Inhibitor', 'TKI', 'GLP-1 Agonist', 'TNF Blocker']),
    researchCode: 'MK-' + Math.floor(1000 + Math.random() * 9000),
    mechanismOfAction,
    targetBiomarker: mechanismOfAction.split(' ')[0] || 'Target-X',
    orphanDrugStatus: choice(['Yes', 'No']),
    fastTrackApproval: choice(['Yes', 'No']),
    lineOfTherapy: choice(['First-line', 'Second-line', 'Third-line']),
    title: 'A Study to Evaluate the Efficacy and Safety of ' + leadDrug,
    licensee: choice(['AstraZeneca', 'Roche', 'Pfizer', 'N/A']),
    country,
    licensor: sponsor,
    licensorCountry: country,
    upfrontPayment: '$' + Math.floor(5 + Math.random() * 95) + 'M',
    dealSizeMillion: String(50 + Math.floor(Math.random() * 950)),
    paymentMode: 'Milestone-based',
    year: '2024',
    deals: 'Licensing Option',
    dealsType: 'Co-development',
    link: 'https://clinicaltrials.gov/study/' + leadDrug,
    licensingAvailability: 'No',
    contactPersonName: 'Dr. ' + choice(['Smith', 'Johnson', 'Davis', 'Chen', 'Garcia']),
    designation: 'Clinical Program Director',
    contactNo: '+1-555-' + Math.floor(1000000 + Math.random() * 9000000),
    emailIdLink: 'info@' + sponsor.toLowerCase().replace(/[^a-z0-9]/g, '') + '.com',
    locations: country + ' Clinical Centers',
    country1: country,
    clinicalInvestigatorName: 'Prof. ' + choice(['Anderson', 'Martinez', 'Taylor', 'Thomas']),
    contactEmail: 'investigator@' + sponsor.toLowerCase().replace(/[^a-z0-9]/g, '') + '.org',
    contactTel: '+1-800-' + Math.floor(1000000 + Math.random() * 9000000),
    gender: choice(['Both', 'Male', 'Female']),
    age: choice(['18-65 years', 'Adult', 'Child & Adult']),
    enrollment: String(150 + Math.floor(Math.random() * 1500)),
    fundedBy: 'Industry',
    studyType: choice(['Interventional', 'Observational']),
    indicationMarketSize2023: '$' + Math.floor(1 + Math.random() * 20) + 'B',
    epidemiology: 'Affects approx 1 in 10,000 adults globally.',
    sponsor,
    collaboration: choice(['academic alliance', 'biotech partnership', 'N/A']),
    studyResults: 'Efficacy endpoint achieved, safety profile acceptable.',
    outcomeMeasures: 'Overall survival and progression free survival.',
    originator: sponsor,
    developer: sponsor,
    technology: choice(['Pegylation', 'Liposomal Delivery', 'Standard Formulation']),
    routeOfAdministration,
    strength: '100mg/vial',
    dosageForm: choice(['Injection', 'Infusion', 'Tablet', 'Capsule']),
    patentInfo: 'Expiry 2034-08-15',
    lastUpdated: '2026-05-15',
  };
};

// Generate a PatentSalesForecasting record
const makePatentSalesForecasting = (
  applicationNumber: string,
  activeIngredient: string,
  brandName: string,
  moa: string,
  indicationApproved: string,
  applicant: string,
  roa: string
) => {
  return {
    applicationNumber,
    patentNumber: 'US' + Math.floor(7000000 + Math.random() * 5000000) + 'B2',
    applicant,
    approvalDate: '2020-04-12',
    patentExpiryDate: '2035-11-20',
    brandName,
    activeIngredient,
    moa,
    biomarker: choice(['EGFR', 'ALK', 'PD-L1', 'None']),
    lineOfTherapy: choice(['First-line', 'Second-line']),
    roa,
    dose: choice(['10mg', '50mg', '100mg', '200mg']),
    indicationApproved,
    therapeuticArea: choice(['Oncology', 'Immunology', 'Neurology', 'Cardiovascular']),
    indicationUnderEvaluation: choice(['Adjuvant therapy', 'N/A']),
    rld: choice(['Yes', 'No']),
    rs: choice(['Yes', 'No']),
    country: choice(['US', 'EU', 'Japan', 'Canada']),
    sales2018: String(50 + Math.floor(Math.random() * 200)),
    sales2019: String(70 + Math.floor(Math.random() * 250)),
    sales2020: String(100 + Math.floor(Math.random() * 300)),
    sales2021: String(150 + Math.floor(Math.random() * 400)),
    sales2022: String(200 + Math.floor(Math.random() * 500)),
    forecastingSales2023: String(250 + Math.floor(Math.random() * 600)),
    forecastingSales2024: String(300 + Math.floor(Math.random() * 700)),
    forecastingSales2025: String(350 + Math.floor(Math.random() * 800)),
    forecastingSales2026: String(400 + Math.floor(Math.random() * 900)),
    forecastingSales2027: String(450 + Math.floor(Math.random() * 1000)),
    noOfCompetitors: String(Math.floor(Math.random() * 6)),
    sources: 'FDA Orange Book & Company Annual Financial Reports',
  };
};

async function main() {
  console.log('🌱 Start seeding clinical databases...');

  // Delete existing records
  await prisma.pipelineProspector.deleteMany({});
  await prisma.patentSalesForecasting.deleteMany({});
  await prisma.user.deleteMany({});

  // Create default test accounts
  const bcrypt = require('bcrypt');
  const hashedUserPassword = await bcrypt.hash('password123', 10);
  const hashedAdminPassword = await bcrypt.hash('admin123', 10);

  const subEnd = new Date();
  subEnd.setDate(subEnd.getDate() + 30);

  // Normal unpaid/guest account
  await prisma.user.create({
    data: {
      email: 'user@medtrack.com',
      password: hashedUserPassword,
      isSubscribed: false,
    },
  });

  // Paid pro user account
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
      isSubscribed: true,
      subscriptionEnd: subEnd,
    },
  });

  console.log('👤 Created default accounts:');
  console.log('   - Guest: user@medtrack.com / password123');
  console.log('   - Pro: pro@medtrack.com / password123');
  console.log('   - Admin: admin@medtrack.com / admin123');

  // Populate PipelineProspector records (Sheet 1)
  const pipelineMedicines = [
    makePipelineProspector('1', 'Pembrolizumab', 'Non-Small Cell Lung Cancer', 'PD-1 Inhibitor', 'Approved', 'Merck & Co.', 'Intravenous Infusion'),
    makePipelineProspector('2', 'Semaglutide', 'Type 2 Diabetes & Obesity', 'GLP-1 Receptor Agonist', 'Approved', 'Novo Nordisk', 'Subcutaneous Injection'),
    makePipelineProspector('3', 'Adalimumab', 'Rheumatoid Arthritis', 'TNF-Alpha Inhibitor', 'Approved', 'AbbVie', 'Subcutaneous Injection'),
    makePipelineProspector('4', 'Lecanemab', 'Alzheimer\'s Disease', 'Amyloid-Beta Antibody', 'Approved', 'Eisai & Biogen', 'Intravenous Infusion'),
    makePipelineProspector('5', 'Empagliflozin', 'Heart Failure', 'SGLT2 Inhibitor', 'Approved', 'Boehringer Ingelheim', 'Oral Tablet'),
    makePipelineProspector('6', 'Tirzepatide', 'Obesity & Weight Management', 'GIP & GLP-1 Receptor Agonist', 'Approved', 'Eli Lilly', 'Subcutaneous Injection'),
    makePipelineProspector('7', 'Niraparib', 'Ovarian Cancer Maintenance', 'PARP Inhibitor', 'Approved', 'GSK', 'Oral Tablet'),
    makePipelineProspector('8', 'Gantenerumab', 'Alzheimer\'s Dementia', 'Amyloid-Beta Aggregation Inhibitor', 'Phase III', 'Roche Genentech', 'Subcutaneous Injection'),
    makePipelineProspector('9', 'Survodutide', 'NASH', 'Dual GCGR/GLP-1R Agonist', 'Phase III', 'Boehringer Ingelheim', 'Subcutaneous Injection'),
    makePipelineProspector('10', 'Donanemab', 'Cognitive Decline', 'Amyloid-Beta Antibody', 'Phase III', 'Eli Lilly', 'Intravenous Infusion'),
    makePipelineProspector('11', 'Paracetamol', 'Fever', 'COX Inhibitor', 'Approved', 'Johnson & Johnson', 'Oral Tablet'),
    makePipelineProspector('12', 'Dextromethorphan', 'Cold/Cough', 'NMDA Receptor Antagonist', 'Approved', 'Reckitt Benckiser', 'Oral Syrup'),
    makePipelineProspector('13', 'Ibuprofen', 'Fever', 'COX Inhibitor', 'Approved', 'Advil Inc.', 'Oral Tablet'),
    makePipelineProspector('14', 'Guaifenesin', 'Cold/Cough', 'Mucolytic Expectorant', 'Approved', 'Mucinex Health', 'Oral Tablet'),
  ];

  const drugNames = ['Liraglutide', 'Dapagliflozin', 'Nivolumab', 'Ipilimumab', 'Trastuzumab', 'Rituximab', 'Infliximab', 'Etanercept', 'Ustekinumab', 'Dupilumab', 'Secukinumab', 'Ocrelizumab', 'Emicizumab', 'Risankizumab', 'Teclistamab', 'Mirvetuximab', 'Epcoritamab', 'Glofitamab', 'Talquetamab', 'Elranatamab'];
  const indications = ['Type 2 Diabetes', 'Heart Failure', 'Non-Small Cell Lung Cancer', 'Melanoma', 'Renal Cell Carcinoma', 'Breast Cancer', 'Rheumatoid Arthritis', 'Plaque Psoriasis', 'Atopic Dermatitis', 'Multiple Sclerosis', 'Hemophilia A', 'Crohns Disease', 'Ulcerative Colitis', 'Asthma', 'Lupus Nephritis', 'Fever', 'Cold/Cough'];
  const moas = ['GLP-1 Receptor Agonist', 'SGLT2 Inhibitor', 'PD-1 Inhibitor', 'CTLA-4 Inhibitor', 'HER2 Receptor Antagonist', 'CD20 Monoclonal Antibody', 'TNF Inhibitor', 'IL-23 Inhibitor', 'IL-4R/IL-13 Inhibitor', 'IL-17A Inhibitor', 'CD20 x CD3 Bispecific Antibody', 'BCMA x CD3 Bispecific Antibody', 'BTK Inhibitor', 'AKT Inhibitor'];
  const sponsors = ['Merck & Co.', 'Novo Nordisk', 'AstraZeneca', 'Bristol Myers Squibb', 'Roche Genentech', 'Pfizer', 'Eli Lilly', 'AbbVie', 'Johnson & Johnson', 'Sanofi', 'Novartis', 'GlaxoSmithKline'];
  const routes = ['Intravenous Infusion', 'Subcutaneous Injection', 'Oral Tablet', 'Oral Capsule', 'Intramuscular Injection'];
  const phases = ['Phase I', 'Phase II', 'Phase III', 'Pre-clinical', 'Approved'];

  for (let i = 0; i < 40; i++) {
    const drugName = drugNames[i % drugNames.length] + ' ' + (Math.floor(i / drugNames.length) + 1);
    const indication = choice(indications);
    const moa = choice(moas);
    const phase = choice(phases);
    const sponsor = choice(sponsors);
    const route = choice(routes);
    pipelineMedicines.push(
      makePipelineProspector(String(i + 15), drugName, indication, moa, phase, sponsor, route)
    );
  }

  await prisma.pipelineProspector.createMany({
    data: pipelineMedicines,
  });
  console.log(`💊 Populated ${pipelineMedicines.length} PipelineProspector records (64 columns).`);

  // Populate PatentSalesForecasting records (Sheet 2)
  const forecastingRecords = [
    makePatentSalesForecasting('US10485912', 'Pembrolizumab', 'Keytruda', 'PD-1 Inhibitor', 'Non-Small Cell Lung Cancer', 'Merck & Co.', 'Intravenous Infusion'),
    makePatentSalesForecasting('US11284567', 'Semaglutide', 'Ozempic / Wegovy', 'GLP-1 Receptor Agonist', 'Type 2 Diabetes & Obesity', 'Novo Nordisk', 'Subcutaneous Injection'),
    makePatentSalesForecasting('US9583845', 'Adalimumab', 'Humira', 'TNF-Alpha Inhibitor', 'Rheumatoid Arthritis', 'AbbVie', 'Subcutaneous Injection'),
    makePatentSalesForecasting('US12384758', 'Lecanemab', 'Leqembi', 'Amyloid-Beta Antibody', 'Alzheimer\'s Disease', 'Eisai & Biogen', 'Intravenous Infusion'),
    makePatentSalesForecasting('US8475834', 'Empagliflozin', 'Jardiance', 'SGLT2 Inhibitor', 'Heart Failure', 'Boehringer Ingelheim', 'Oral Tablet'),
    makePatentSalesForecasting('US13982845', 'Tirzepatide', 'Mounjaro / Zepbound', 'GIP & GLP-1 Receptor Agonist', 'Obesity & Weight Management', 'Eli Lilly', 'Subcutaneous Injection'),
    makePatentSalesForecasting('US7983457', 'Niraparib', 'Zejula', 'PARP Inhibitor', 'Ovarian Cancer Maintenance', 'GSK', 'Oral Tablet'),
    makePatentSalesForecasting('US10283478', 'Paracetamol', 'Tylenol / Panadol', 'COX Inhibitor', 'Fever', 'Johnson & Johnson', 'Oral Tablet'),
    makePatentSalesForecasting('US9834723', 'Dextromethorphan', 'Robitussin', 'NMDA Receptor Antagonist', 'Cold/Cough', 'Reckitt Benckiser', 'Oral Syrup'),
    makePatentSalesForecasting('US11038472', 'Ibuprofen', 'Advil / Motrin', 'COX Inhibitor', 'Fever', 'Advil Inc.', 'Oral Tablet'),
    makePatentSalesForecasting('US9923847', 'Guaifenesin', 'Mucinex', 'Mucolytic Expectorant', 'Cold/Cough', 'Mucinex Health', 'Oral Tablet'),
  ];

  for (let i = 0; i < 25; i++) {
    const active = drugNames[i % drugNames.length] + ' ' + (Math.floor(i / drugNames.length) + 1);
    const brand = active.substring(0, 5) + 'ra';
    const moa = choice(moas);
    const indication = choice(indications);
    const applicant = choice(sponsors);
    const route = choice(routes);
    forecastingRecords.push(
      makePatentSalesForecasting(
        'US' + Math.floor(10000000 + Math.random() * 5000000),
        active,
        brand,
        moa,
        indication,
        applicant,
        route
      )
    );
  }

  await prisma.patentSalesForecasting.createMany({
    data: forecastingRecords,
  });
  console.log(`📈 Populated ${forecastingRecords.length} PatentSalesForecasting records (30 columns).`);

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
