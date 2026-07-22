import { Request, Response } from 'express';
import { logger } from '../utils/logger';
import xlsx from 'xlsx';
import { prisma } from '../config/prisma';
import { esClient } from '../config/elasticsearch';
import { sendContactEmail, sendDemoEmail, sendContactThankYouEmail, sendDemoThankYouEmail } from '../services/email.service';

// Case-insensitive key retriever for robust spreadsheet parsing
function getValue(row: any, normalizedKey: string): string | null {
  const clean = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
  const targetClean = clean(normalizedKey);
  
  for (const k of Object.keys(row)) {
    if (clean(k) === targetClean) {
      const val = row[k];
      return val !== undefined && val !== null ? String(val).trim() : null;
    }
  }

  // Fallbacks for duplicates or known header variations
  if (normalizedKey === 'licensorCountry') {
    return getValue(row, 'countrysecondoccurrence') || getValue(row, 'country1') || getValue(row, 'country_1') || getValue(row, 'licensorcountry');
  }
  if (normalizedKey === 'country1') {
    return getValue(row, 'country1') || getValue(row, 'country_2') || getValue(row, 'country2') || getValue(row, 'country.1');
  }
  if (normalizedKey === 'developmentPhase') {
    return getValue(row, 'developmentphase') || getValue(row, 'phase') || getValue(row, 'phases') || getValue(row, 'development_phase');
  }
  if (normalizedKey === 'moa') {
    return getValue(row, 'moa') || getValue(row, 'mechanismOfAction') || getValue(row, 'mechanism_of_action');
  }
  if (normalizedKey === 'roa') {
    return getValue(row, 'roa') || getValue(row, 'routeOfAdministration') || getValue(row, 'route_of_administration');
  }
  if (normalizedKey === 'applicant') {
    return getValue(row, 'applicant') || getValue(row, 'sponsor') || getValue(row, 'companyName');
  }
  
  return null;
}

// Map spreadsheet row to PipelineProspector structure
function mapRowToPipeline(row: any) {
  return {
    srNo: getValue(row, 'srNo'),
    companyName: getValue(row, 'companyName'),
    headQuarter: getValue(row, 'headQuarter'),
    nctNumber: getValue(row, 'nctNumber'),
    leadDrug: getValue(row, 'leadDrug'),
    secondaryDrug: getValue(row, 'secondaryDrug') || getValue(row, 'secondaryDrugCombinationDrug'),
    primaryIndication: getValue(row, 'primaryIndication'),
    therapeuticArea: getValue(row, 'therapeuticArea'),
    phases: getValue(row, 'phases') || getValue(row, 'developmentPhase'),
    developmentPhase: getValue(row, 'developmentPhase') || getValue(row, 'phases'),
    startingDate: getValue(row, 'startingDate'),
    completionDate: getValue(row, 'completionDate'),
    predictionOfLaunching: getValue(row, 'predictionOfLaunching'),
    trialStatus: getValue(row, 'trialStatus'),
    terminatedReason: getValue(row, 'terminatedReason'),
    moleculeType: getValue(row, 'moleculeType'),
    moleculeClass: getValue(row, 'moleculeClass'),
    researchCode: getValue(row, 'researchCode') || getValue(row, 'researchCodeBrandSynonyms'),
    mechanismOfAction: getValue(row, 'mechanismOfAction'),
    targetBiomarker: getValue(row, 'targetBiomarker') || getValue(row, 'target'),
    orphanDrugStatus: getValue(row, 'orphanDrugStatus'),
    fastTrackApproval: getValue(row, 'fastTrackApproval'),
    lineOfTherapy: getValue(row, 'lineOfTherapy'),
    title: getValue(row, 'title'),
    licensee: getValue(row, 'licensee'),
    country: getValue(row, 'country'),
    licensor: getValue(row, 'licensor') || getValue(row, 'lecensor'),
    licensorCountry: getValue(row, 'licensorCountry'),
    upfrontPayment: getValue(row, 'upfrontPayment'),
    dealSizeMillion: getValue(row, 'dealSizeMillion'),
    paymentMode: getValue(row, 'paymentMode'),
    year: getValue(row, 'year'),
    deals: getValue(row, 'deals'),
    dealsType: getValue(row, 'dealsType'),
    link: getValue(row, 'link'),
    licensingAvailability: getValue(row, 'licensingAvailability'),
    contactPersonName: getValue(row, 'contactPersonName'),
    designation: getValue(row, 'designation'),
    contactNo: getValue(row, 'contactNo'),
    emailIdLink: getValue(row, 'emailIdLink'),
    locations: getValue(row, 'locations'),
    country1: getValue(row, 'country1'),
    clinicalInvestigatorName: getValue(row, 'clinicalInvestigatorName'),
    contactEmail: getValue(row, 'contactEmail'),
    contactTel: getValue(row, 'contactTel'),
    gender: getValue(row, 'gender'),
    age: getValue(row, 'age'),
    enrollment: getValue(row, 'enrollment'),
    fundedBy: getValue(row, 'fundedBy'),
    studyType: getValue(row, 'studyType'),
    indicationMarketSize2023: getValue(row, 'indicationMarketSize2023'),
    epidemiology: getValue(row, 'epidemiology'),
    sponsor: getValue(row, 'sponsor'),
    collaboration: getValue(row, 'collaboration'),
    studyResults: getValue(row, 'studyResults'),
    outcomeMeasures: getValue(row, 'outcomeMeasures'),
    originator: getValue(row, 'originator'),
    developer: getValue(row, 'developer'),
    technology: getValue(row, 'technology'),
    routeOfAdministration: getValue(row, 'routeOfAdministration'),
    strength: getValue(row, 'strength'),
    dosageForm: getValue(row, 'dosageForm'),
    patentInfo: getValue(row, 'patentInfo'),
    lastUpdated: getValue(row, 'lastUpdated'),
  };
}

// Map spreadsheet row to PatentSalesForecasting structure
function mapRowToForecasting(row: any) {
  return {
    applicationNumber: getValue(row, 'applicationNumber'),
    patentNumber: getValue(row, 'patentNumber'),
    applicant: getValue(row, 'applicant'),
    approvalDate: getValue(row, 'approvalDate'),
    patentExpiryDate: getValue(row, 'patentExpiryDate'),
    brandName: getValue(row, 'brandName'),
    activeIngredient: getValue(row, 'activeIngredient'),
    moa: getValue(row, 'moa'),
    biomarker: getValue(row, 'biomarker'),
    lineOfTherapy: getValue(row, 'lineOfTherapy'),
    roa: getValue(row, 'roa'),
    dose: getValue(row, 'dose'),
    indicationApproved: getValue(row, 'indicationApproved'),
    therapeuticArea: getValue(row, 'therapeuticArea'),
    indicationUnderEvaluation: getValue(row, 'indicationUnderEvaluation'),
    rld: getValue(row, 'rld'),
    rs: getValue(row, 'rs'),
    country: getValue(row, 'country'),
    sales2018: getValue(row, 'sales2018') || getValue(row, 'sales2018inmillion'),
    sales2019: getValue(row, 'sales2019') || getValue(row, 'sales2019inmillion'),
    sales2020: getValue(row, 'sales2020') || getValue(row, 'sales2020inmillion'),
    sales2021: getValue(row, 'sales2021') || getValue(row, 'sales2021inmillion'),
    sales2022: getValue(row, 'sales2022') || getValue(row, 'sales2022inmillion'),
    forecastingSales2023: getValue(row, 'forecastingSales2023') || getValue(row, '2023salesmillionforecasting'),
    forecastingSales2024: getValue(row, 'forecastingSales2024') || getValue(row, '2024salesmillionforecasting'),
    forecastingSales2025: getValue(row, 'forecastingSales2025') || getValue(row, '2025salesmillionforecasting'),
    forecastingSales2026: getValue(row, 'forecastingSales2026') || getValue(row, '2026salesmillionforecasting'),
    forecastingSales2027: getValue(row, 'forecastingSales2027') || getValue(row, '2027salesmillionforecasting'),
    noOfCompetitors: getValue(row, 'noOfCompetitors'),
    sources: getValue(row, 'sources'),
  };
}

export const uploadMedicineSheet = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No spreadsheet file uploaded.' });
    }

    const { mode = 'append' } = req.body;

    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });

    // Wipe tables first if clear mode is requested
    if (mode === 'clear') {
      await prisma.pipelineProspector.deleteMany({});
      await prisma.patentSalesForecasting.deleteMany({});
      logger.info('Database catalog tables cleared before overwrite.');
    }

    let pipelineInserted = 0;
    let pipelineUpdated = 0;
    let forecastingInserted = 0;
    let forecastingUpdated = 0;

    for (const sheetName of workbook.SheetNames) {
      const worksheet = workbook.Sheets[sheetName];
      const rawRows = xlsx.utils.sheet_to_json<any>(worksheet);
      if (rawRows.length === 0) continue;

      // Classify the sheet domain
      const firstRow = rawRows[0];
      const keys = Object.keys(firstRow).map(k => k.toLowerCase().replace(/[^a-z0-9]/g, ''));

      const isPipeline = sheetName.toLowerCase().includes('pipeline') || 
                         keys.includes('leaddrug') || 
                         keys.includes('nctnumber');
                         
      const isForecasting = sheetName.toLowerCase().includes('forecasting') || 
                           sheetName.toLowerCase().includes('sales') || 
                           keys.includes('patentnumber') || 
                           keys.includes('activeingredient') || 
                           keys.includes('applicationnumber');

      if (isPipeline || (!isForecasting && keys.length > 40)) {
        // Handle PipelineProspector Sheet
        if (mode === 'upsert') {
          for (const row of rawRows) {
            const mapped = mapRowToPipeline(row);
            if (!mapped.leadDrug) continue;

            const existing = await prisma.pipelineProspector.findFirst({
              where: { leadDrug: { equals: mapped.leadDrug, mode: 'insensitive' } }
            });

            if (existing) {
              await prisma.pipelineProspector.update({
                where: { id: existing.id },
                data: mapped
              });
              pipelineUpdated++;
            } else {
              await prisma.pipelineProspector.create({ data: mapped });
              pipelineInserted++;
            }
          }
        } else {
          // Bulk Insert for append or clear mode
          const dataToInsert = rawRows
            .map(row => mapRowToPipeline(row))
            .filter(r => r.leadDrug !== null);

          if (dataToInsert.length > 0) {
            const result = await prisma.pipelineProspector.createMany({
              data: dataToInsert as any
            });
            pipelineInserted += result.count;
          }
        }
      } else {
        // Handle PatentSalesForecasting Sheet
        if (mode === 'upsert') {
          for (const row of rawRows) {
            const mapped = mapRowToForecasting(row);
            if (!mapped.activeIngredient) continue;

            const existing = await prisma.patentSalesForecasting.findFirst({
              where: { activeIngredient: { equals: mapped.activeIngredient, mode: 'insensitive' } }
            });

            if (existing) {
              await prisma.patentSalesForecasting.update({
                where: { id: existing.id },
                data: mapped
              });
              forecastingUpdated++;
            } else {
              await prisma.patentSalesForecasting.create({ data: mapped });
              forecastingInserted++;
            }
          }
        } else {
          // Bulk Insert
          const dataToInsert = rawRows
            .map(row => mapRowToForecasting(row))
            .filter(r => r.activeIngredient !== null);

          if (dataToInsert.length > 0) {
            const result = await prisma.patentSalesForecasting.createMany({
              data: dataToInsert as any
            });
            forecastingInserted += result.count;
          }
        }
      }
    }

    // Trigger Elasticsearch re-indexing in background
    try {
      const { exec } = require('child_process');
      exec('npx ts-node prisma/reindex.ts', (err: any) => {
        if (err) logger.error('Elasticsearch background re-indexing failed:', { error: err });
      });
    } catch (esErr) {
      console.warn('Failed to start background Elasticsearch indexing:', esErr);
    }

    let completionMessage = '';
    if (mode === 'upsert') {
      completionMessage = `Upsert completed. Pipeline: ${pipelineInserted} inserted, ${pipelineUpdated} updated. Forecasting: ${forecastingInserted} inserted, ${forecastingUpdated} updated.`;
    } else {
      completionMessage = `Import completed. Added ${pipelineInserted} Pipeline records and ${forecastingInserted} Patent Forecasting records.`;
    }

    return res.status(200).json({
      message: completionMessage,
      recordsCount: pipelineInserted + pipelineUpdated + forecastingInserted + forecastingUpdated,
    });
  } catch (error) {
    logger.error('File import error:', { error: error });
    return res.status(500).json({ message: 'Error processing database update sheet.' });
  }
};

// Selective Deletion API (searches both tables to find and delete the match)
export const deleteMedicine = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Check Pipeline table
    const pipelineRecord = await prisma.pipelineProspector.findUnique({ where: { id } });
    if (pipelineRecord) {
      await prisma.pipelineProspector.delete({ where: { id } });
      if (esClient) {
        try {
          await esClient.delete({ index: 'pipeline_prospector', id });
        } catch (esError) {
          console.warn('Failed to delete document from Elasticsearch pipeline index:', esError);
        }
      }
      return res.status(200).json({ message: `Successfully deleted Pipeline record: ${pipelineRecord.leadDrug}` });
    }

    // Check Forecasting table
    const forecastingRecord = await prisma.patentSalesForecasting.findUnique({ where: { id } });
    if (forecastingRecord) {
      await prisma.patentSalesForecasting.delete({ where: { id } });
      if (esClient) {
        try {
          await esClient.delete({ index: 'patent_sales_forecasting', id });
        } catch (esError) {
          console.warn('Failed to delete document from Elasticsearch forecasting index:', esError);
        }
      }
      return res.status(200).json({ message: `Successfully deleted Patent Forecasting record: ${forecastingRecord.brandName || forecastingRecord.activeIngredient}` });
    }

    return res.status(404).json({ message: 'Record not found' });
  } catch (error) {
    logger.error('Delete error:', { error: error });
    return res.status(500).json({ message: 'Error deleting database record' });
  }
};

// Clear All Data API
export const clearAllMedicines = async (req: Request, res: Response) => {
  try {
    const delPipeline = await prisma.pipelineProspector.deleteMany({});
    const delForecasting = await prisma.patentSalesForecasting.deleteMany({});

    // Sync clear to Elasticsearch
    if (esClient) {
      for (const index of ['pipeline_prospector', 'patent_sales_forecasting']) {
        try {
          const indexExists = await esClient.indices.exists({ index });
          if (indexExists) {
            await esClient.deleteByQuery({
              index,
              body: { query: { match_all: {} } }
            });
          }
        } catch (esError) {
          console.warn(`Failed to clear ES index ${index}:`, esError);
        }
      }
    }

    return res.status(200).json({ 
      message: `Successfully cleared all data. Removed ${delPipeline.count} pipeline and ${delForecasting.count} forecasting records.` 
    });
  } catch (error) {
    logger.error('Clear catalog error:', { error: error });
    return res.status(500).json({ message: 'Error clearing database tables.' });
  }
};

export const postDemoRequest = async (req: Request, res: Response) => {
  try {
    const { name, company, email, jobTitle, requirements } = req.body;
    if (!name || !company || !email || !jobTitle) {
      return res.status(400).json({ message: 'Please fill in all required fields' });
    }

    await prisma.demoRequest.create({
      data: {
        name,
        company,
        email,
        jobTitle,
        requirements: requirements || '',
      },
    });

    // Send demo request notification email in the background
    sendDemoEmail(name, company, email, jobTitle, requirements || '').catch(err => {
      logger.error('Background sendDemoEmail failed:', { error: err });
    });

    // Send thank you confirmation email to the user in the background
    sendDemoThankYouEmail(name, company, email, jobTitle, requirements || '').catch(err => {
      logger.error('Background sendDemoThankYouEmail failed:', { error: err });
    });

    return res.status(201).json({ message: 'Your demo request has been successfully registered.' });
  } catch (error) {
    logger.error('Demo request submission error:', { error: error });
    return res.status(500).json({ message: 'Error registering demo request.' });
  }
};

export const postContactMessage = async (req: Request, res: Response) => {
  try {
    const { name, email, message } = req.body;
    if (!name || !email || !message) {
      return res.status(400).json({ message: 'All fields are required.' });
    }

    await prisma.contactMessage.create({
      data: { name, email, message },
    });

    // Send contact notification email in the background
    sendContactEmail(name, email, message).catch(err => {
      logger.error('Background sendContactEmail failed:', { error: err });
    });

    // Send thank you confirmation email to the user in the background
    sendContactThankYouEmail(name, email, message).catch(err => {
      logger.error('Background sendContactThankYouEmail failed:', { error: err });
    });

    return res.status(201).json({ message: 'Message recorded successfully.' });
  } catch (error) {
    logger.error('Contact message error:', { error: error });
    return res.status(500).json({ message: 'Error registering message.' });
  }
};

export const getStats = async (req: Request, res: Response) => {
  try {
    res.setHeader('Cache-Control', 'public, max-age=60'); // 1 minute cache for database metrics
    const totalPipeline = await prisma.pipelineProspector.count();
    const totalForecasting = await prisma.patentSalesForecasting.count();
    const totalUsers = await prisma.user.count();
    const totalDemos = await prisma.demoRequest.count();
    
    return res.status(200).json({
      totalMedicines: totalPipeline + totalForecasting,
      totalPipeline,
      totalForecasting,
      totalUsers,
      totalDemos,
    });
  } catch (err) {
    return res.status(500).json({ message: 'Error fetching stats' });
  }
};
