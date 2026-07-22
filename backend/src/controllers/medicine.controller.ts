import { Request, Response } from 'express';
import { prisma } from '../config/prisma';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { verifyAccessToken } from '../utils/jwt';
import { esClient, checkEsHealth } from '../config/elasticsearch';
import { logger } from '../utils/logger';

// Helper to determine if a request has an active subscription
const checkSubscriptionStatus = async (req: Request): Promise<boolean> => {
  try {
    let token = '';
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.cookies && req.cookies.accessToken) {
      token = req.cookies.accessToken;
    }

    if (!token) return false;

    const decoded = verifyAccessToken(token);
    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
    if (!user) return false;

    if (user.isSubscribed) {
      const now = new Date();
      return !user.subscriptionEnd || new Date(user.subscriptionEnd) > now;
    }
    return false;
  } catch (err) {
    return false;
  }
};

// Map PipelineProspector record for frontend compatibility
function formatPipelineRecord(med: any, isSubscribed: boolean) {
  const additional = {
    ...med,
    sponsor: med.sponsor || med.companyName || 'N/A',
    brandName: med.researchCode || 'N/A',
    status: med.trialStatus || 'Active',
    completionDate: med.completionDate || 'N/A',
    trialId: med.nctNumber || 'N/A',
    estimatedEnrollment: med.enrollment || 'N/A',
    target: med.targetBiomarker || 'N/A',
    route: med.routeOfAdministration || 'N/A',
    dataset: 'Pipeline Prospector',
  };

  const basicData = {
    id: med.id,
    drugName: med.leadDrug || 'Unnamed Drug',
    indication: med.primaryIndication || 'Not Specified',
    moa: med.mechanismOfAction || 'Not Specified',
    phase: med.developmentPhase || 'N/A',
    country: med.country || 'US',
    dataset: 'Pipeline Prospector',
    createdAt: med.createdAt,
  };

  if (isSubscribed) {
    return {
      ...basicData,
      additionalData: additional,
    };
  } else {
    return {
      ...basicData,
      additionalData: {
        phase: basicData.phase,
        dataset: basicData.dataset,
        locked: true,
      },
    };
  }
}

// Map PatentSalesForecasting record for frontend compatibility
function formatForecastingRecord(med: any, isSubscribed: boolean) {
  const additional = {
    ...med,
    sponsor: med.applicant || 'N/A',
    brandName: med.brandName || 'N/A',
    status: 'Approved',
    completionDate: med.patentExpiryDate || 'N/A',
    trialId: med.patentNumber || 'N/A',
    estimatedEnrollment: 'N/A',
    target: med.biomarker || 'N/A',
    route: med.roa || 'N/A',
    dataset: 'Patent & Sales Forecasting',
  };

  const basicData = {
    id: med.id,
    drugName: med.brandName || med.activeIngredient || 'Unnamed Drug',
    indication: med.indicationApproved || 'Not Specified',
    moa: med.moa || 'Not Specified',
    phase: 'Approved',
    country: med.country || 'US',
    dataset: 'Patent & Sales Forecasting',
    createdAt: med.createdAt,
  };

  if (isSubscribed) {
    return {
      ...basicData,
      additionalData: additional,
    };
  } else {
    return {
      ...basicData,
      additionalData: {
        phase: basicData.phase,
        dataset: basicData.dataset,
        locked: true,
      },
    };
  }
}

export const searchMedicines = async (req: Request, res: Response) => {
  try {
    const { query, field, dataset, page = '1', limit = '10', countries, diseases } = req.query;
    const isSubscribed = await checkSubscriptionStatus(req);

    const pageNum = Math.max(parseInt(page as string, 10) || 1, 1);
    const limitNum = Math.min(Math.max(parseInt(limit as string, 10) || 10, 1), 100);
    const skip = (pageNum - 1) * limitNum;

    // Parse filters
    let selectedCountries: string[] = [];
    let hasCountryFilter = false;
    if (countries !== undefined) {
      if (typeof countries === 'string') {
        selectedCountries = countries.split(',').map(c => c.trim()).filter(Boolean);
      } else if (Array.isArray(countries)) {
        selectedCountries = countries.map(c => String(c).trim()).filter(Boolean);
      }
      hasCountryFilter = selectedCountries.length > 0;
    }

    // Basic Plan Restriction: US Only
    const reqUser = (req as any).user;
    if (reqUser && reqUser.planType === 'Basic') {
      selectedCountries = ['US'];
      hasCountryFilter = true;
    }

    let selectedDiseases: string[] = [];
    let hasDiseaseFilter = false;
    if (diseases !== undefined) {
      if (typeof diseases === 'string') {
        selectedDiseases = diseases.split(',').map(d => d.trim()).filter(Boolean);
      } else if (Array.isArray(diseases)) {
        selectedDiseases = diseases.map(d => String(d).trim()).filter(Boolean);
      }
      hasDiseaseFilter = selectedDiseases.length > 0;
    }

    // Determine target domain
    const isPipelineDataset = !dataset || String(dataset).toLowerCase().includes('pipeline') || String(dataset).toLowerCase().includes('prospector');
    const indexName = isPipelineDataset ? 'pipeline_prospector' : 'patent_sales_forecasting';

    let paginated: any[] = [];
    let total = 0;
    let isEsUsed = false;

    // 1. Resilient search: Elasticsearch query
    const isEsHealthy = await checkEsHealth();
    if (isEsHealthy && esClient && query && query.toString().trim() !== '') {
      try {
        const searchStr = query.toString().trim();
        const searchTerms = searchStr.split(',').map((s: string) => s.trim()).filter(Boolean);
        const shouldQueries: any[] = [];

        searchTerms.forEach(term => {
          if (isPipelineDataset) {
            if (field === 'drugName') {
              shouldQueries.push({ match: { leadDrug: { query: term, fuzziness: 'AUTO' } } });
            } else if (field === 'indication') {
              shouldQueries.push({ match: { primaryIndication: { query: term, fuzziness: 'AUTO' } } });
            } else if (field === 'moa') {
              shouldQueries.push({ match: { mechanismOfAction: { query: term, fuzziness: 'AUTO' } } });
            } else {
              shouldQueries.push({
                multi_match: {
                  query: term,
                  fields: ['leadDrug^4', 'primaryIndication^3', 'mechanismOfAction^2', 'therapeuticArea^2', 'sponsor^2', 'companyName'],
                  fuzziness: 'AUTO',
                  operator: 'or'
                }
              });
            }
          } else {
            // Forecasting
            if (field === 'drugName') {
              shouldQueries.push({
                multi_match: {
                  query: term,
                  fields: ['activeIngredient^3', 'brandName^4'],
                  fuzziness: 'AUTO'
                }
              });
            } else if (field === 'indication') {
              shouldQueries.push({
                multi_match: {
                  query: term,
                  fields: ['indicationApproved^3', 'indicationUnderEvaluation^2'],
                  fuzziness: 'AUTO'
                }
              });
            } else if (field === 'moa') {
              shouldQueries.push({ match: { moa: { query: term, fuzziness: 'AUTO' } } });
            } else {
              shouldQueries.push({
                multi_match: {
                  query: term,
                  fields: ['activeIngredient^3', 'brandName^4', 'indicationApproved^3', 'moa^2', 'therapeuticArea^2', 'applicant^2'],
                  fuzziness: 'AUTO',
                  operator: 'or'
                }
              });
            }
          }
        });

        const queryBody: any = {
          query: {
            bool: {
              should: shouldQueries,
              minimum_should_match: 1
            }
          },
          from: skip,
          size: limitNum
        };

        if (hasCountryFilter) {
          queryBody.query.bool.filter = queryBody.query.bool.filter || [];
          queryBody.query.bool.filter.push({
            terms: { country: selectedCountries }
          });
        }

        if (hasDiseaseFilter) {
          queryBody.query.bool.filter = queryBody.query.bool.filter || [];
          const targetIndicationField = isPipelineDataset ? 'primaryIndication' : 'indicationApproved';
          const diseaseShouldQueries = selectedDiseases.map((d: string) => ({
            match_phrase: { [targetIndicationField]: d }
          }));
          queryBody.query.bool.filter.push({
            bool: {
              should: diseaseShouldQueries,
              minimum_should_match: 1
            }
          });
        }

        logger.info(`🔍 Querying Elasticsearch index "${indexName}" for search string: "${searchStr}"...`);
        const searchResponse = await esClient.search({
          index: indexName,
          body: queryBody
        });

        const hits = searchResponse.hits.hits;
        const docIds = hits.map((hit: any) => hit._id);

        if (docIds.length > 0) {
          if (isPipelineDataset) {
            const matched = await prisma.pipelineProspector.findMany({
              where: { id: { in: docIds } }
            });
            const map = new Map(matched.map(m => [m.id, m]));
            paginated = docIds.map(id => map.get(id)).filter(Boolean);
          } else {
            const matched = await prisma.patentSalesForecasting.findMany({
              where: { id: { in: docIds } }
            });
            const map = new Map(matched.map(m => [m.id, m]));
            paginated = docIds.map(id => map.get(id)).filter(Boolean);
          }

          total = typeof searchResponse.hits.total === 'number'
            ? searchResponse.hits.total
            : (searchResponse.hits.total as any)?.value || 0;

          isEsUsed = true;
          logger.info(`✅ Elasticsearch search returned ${paginated.length} ordered records.`);
        }
      } catch (esError) {
        logger.warn('⚠️ Elasticsearch query failed, falling back to database search:', { error: esError });
      }
    }

    // 2. Fallback: Direct PostgreSQL Prisma Search
    if (!isEsUsed) {
      logger.info('🔌 Running direct database search query fallback...');
      const andClauses: any[] = [];

      if (query && query.toString().trim() !== '') {
        const fullSearchStr = query.toString().trim();
        const searchTerms = fullSearchStr.split(',').map((s: string) => s.trim()).filter(Boolean);
        const queryOrBranches: any[] = [];

        searchTerms.forEach(searchStr => {
          if (isPipelineDataset) {
            if (field === 'drugName') {
              queryOrBranches.push({ leadDrug: { contains: searchStr, mode: 'insensitive' } });
            } else if (field === 'indication') {
              queryOrBranches.push({ primaryIndication: { contains: searchStr, mode: 'insensitive' } });
            } else if (field === 'moa') {
              queryOrBranches.push({ mechanismOfAction: { contains: searchStr, mode: 'insensitive' } });
            } else {
              queryOrBranches.push(
                { leadDrug: { contains: searchStr, mode: 'insensitive' } },
                { primaryIndication: { contains: searchStr, mode: 'insensitive' } },
                { mechanismOfAction: { contains: searchStr, mode: 'insensitive' } },
                { therapeuticArea: { contains: searchStr, mode: 'insensitive' } },
                { developmentPhase: { contains: searchStr, mode: 'insensitive' } },
                { sponsor: { contains: searchStr, mode: 'insensitive' } },
                { companyName: { contains: searchStr, mode: 'insensitive' } },
              );
            }
          } else {
            if (field === 'drugName') {
              queryOrBranches.push(
                { activeIngredient: { contains: searchStr, mode: 'insensitive' } },
                { brandName: { contains: searchStr, mode: 'insensitive' } },
              );
            } else if (field === 'indication') {
              queryOrBranches.push(
                { indicationApproved: { contains: searchStr, mode: 'insensitive' } },
                { indicationUnderEvaluation: { contains: searchStr, mode: 'insensitive' } },
              );
            } else if (field === 'moa') {
              queryOrBranches.push({ moa: { contains: searchStr, mode: 'insensitive' } });
            } else {
              queryOrBranches.push(
                { activeIngredient: { contains: searchStr, mode: 'insensitive' } },
                { brandName: { contains: searchStr, mode: 'insensitive' } },
                { indicationApproved: { contains: searchStr, mode: 'insensitive' } },
                { moa: { contains: searchStr, mode: 'insensitive' } },
                { therapeuticArea: { contains: searchStr, mode: 'insensitive' } },
                { applicant: { contains: searchStr, mode: 'insensitive' } },
              );
            }
          }
        });

        if (queryOrBranches.length > 0) {
          andClauses.push({ OR: queryOrBranches });
        }
      }

      if (hasCountryFilter) {
        andClauses.push({ country: { in: selectedCountries } });
      }

      if (hasDiseaseFilter) {
        const targetIndicationField = isPipelineDataset ? 'primaryIndication' : 'indicationApproved';
        andClauses.push({
          OR: selectedDiseases.map(d => ({
            [targetIndicationField]: { contains: d, mode: 'insensitive' }
          }))
        });
      }

      const whereClause: any = andClauses.length > 0 ? { AND: andClauses } : {};

      total = await (isPipelineDataset
        ? prisma.pipelineProspector.count({ where: whereClause })
        : prisma.patentSalesForecasting.count({ where: whereClause }));

      paginated = await (isPipelineDataset
        ? prisma.pipelineProspector.findMany({
            where: whereClause,
            orderBy: { leadDrug: 'asc' },
            skip,
            take: limitNum,
          })
        : prisma.patentSalesForecasting.findMany({
            where: whereClause,
            orderBy: { brandName: 'asc' },
            skip,
            take: limitNum,
          }));
    }

    const processed = paginated.map((med) => {
      return isPipelineDataset 
        ? formatPipelineRecord(med, isSubscribed) 
        : formatForecastingRecord(med, isSubscribed);
    });

    return res.status(200).json({
      medicines: processed,
      meta: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
        isSubscribed,
        searchDriver: isEsUsed ? 'elasticsearch' : 'database'
      },
    });
  } catch (error) {
    logger.error('Search error:', { error });
    return res.status(500).json({ message: 'Internal server error while searching clinical data' });
  }
};

export const getMedicineById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const isSubscribed = await checkSubscriptionStatus(req);

    // Try Pipeline Prospects table first
    const pipelineMed = await prisma.pipelineProspector.findUnique({ where: { id } });
    if (pipelineMed) {
      return res.status(200).json(formatPipelineRecord(pipelineMed, isSubscribed));
    }

    // Try Forecasting table
    const forecastingMed = await prisma.patentSalesForecasting.findUnique({ where: { id } });
    if (forecastingMed) {
      return res.status(200).json(formatForecastingRecord(forecastingMed, isSubscribed));
    }

    return res.status(404).json({ message: 'Medicine record not found' });
  } catch (error) {
    logger.error('Get medicine error:', { error });
    return res.status(500).json({ message: 'Error retrieving medicine details' });
  }
};

export const downloadMedicines = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ message: 'Not authorized to download. Please log in.' });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
    });

    if (!user) {
      return res.status(404).json({ message: 'User profile not found' });
    }

    const now = new Date();
    const isSubscribed = user.isSubscribed && (!user.subscriptionEnd || new Date(user.subscriptionEnd) > now);
    if (!isSubscribed) {
      return res.status(403).json({ message: 'CSV downloads require a PRO subscription' });
    }

    const limit = user.planType === 'Professional' ? 1000 : 500;
    if (user.downloadCount >= limit) {
      return res.status(429).json({
        message: `Export limit exceeded. You have downloaded the maximum allowed rows (${limit.toLocaleString()}) for this subscription.`,
      });
    }

    const { query, field, dataset, countries, diseases } = req.query;

    const isPipelineDataset = !dataset || String(dataset).toLowerCase().includes('pipeline') || String(dataset).toLowerCase().includes('prospector');

    // Reuse direct search filters to fetch matching records for export
    const whereClause: any = {};
    let selectedCountries: string[] = [];
    if (countries) {
      selectedCountries = String(countries).split(',').map(c => c.trim()).filter(Boolean);
      if (selectedCountries.length > 0) {
        whereClause.country = { in: selectedCountries };
      }
    }
    if (diseases) {
      const selectedDiseases = String(diseases).split(',').map(d => d.trim()).filter(Boolean);
      if (selectedDiseases.length > 0) {
        const targetIndicationField = isPipelineDataset ? 'primaryIndication' : 'indicationApproved';
        whereClause.OR = selectedDiseases.map(d => ({
          [targetIndicationField]: { contains: d, mode: 'insensitive' }
        }));
      }
    }

    if (query && query.toString().trim() !== '') {
      const searchStr = query.toString().trim();
      if (isPipelineDataset) {
        if (field === 'drugName') {
          whereClause.leadDrug = { contains: searchStr, mode: 'insensitive' };
        } else if (field === 'indication') {
          whereClause.primaryIndication = { contains: searchStr, mode: 'insensitive' };
        } else if (field === 'moa') {
          whereClause.mechanismOfAction = { contains: searchStr, mode: 'insensitive' };
        } else {
          whereClause.OR = [
            { leadDrug: { contains: searchStr, mode: 'insensitive' } },
            { primaryIndication: { contains: searchStr, mode: 'insensitive' } },
            { mechanismOfAction: { contains: searchStr, mode: 'insensitive' } },
          ];
        }
      } else {
        if (field === 'drugName') {
          whereClause.OR = [
            { activeIngredient: { contains: searchStr, mode: 'insensitive' } },
            { brandName: { contains: searchStr, mode: 'insensitive' } },
          ];
        } else if (field === 'indication') {
          whereClause.OR = [
            { indicationApproved: { contains: searchStr, mode: 'insensitive' } },
            { indicationUnderEvaluation: { contains: searchStr, mode: 'insensitive' } },
          ];
        } else if (field === 'moa') {
          whereClause.moa = { contains: searchStr, mode: 'insensitive' };
        } else {
          whereClause.OR = [
            { activeIngredient: { contains: searchStr, mode: 'insensitive' } },
            { brandName: { contains: searchStr, mode: 'insensitive' } },
            { indicationApproved: { contains: searchStr, mode: 'insensitive' } },
            { moa: { contains: searchStr, mode: 'insensitive' } },
          ];
        }
      }
    }

    let medicines: any[] = [];
    if (isPipelineDataset) {
      medicines = await prisma.pipelineProspector.findMany({ where: whereClause });
    } else {
      medicines = await prisma.patentSalesForecasting.findMany({ where: whereClause });
    }

    const exportSize = medicines.length;
    if (exportSize === 0) {
      return res.status(400).json({ message: 'No records matched your search query. Nothing to export.' });
    }

    const updateResult = await prisma.user.updateMany({
      where: {
        id: user.id,
        downloadCount: {
          lte: limit - exportSize,
        },
      },
      data: {
        downloadCount: {
          increment: exportSize,
        },
      },
    });

    if (updateResult.count === 0) {
      const freshUser = await prisma.user.findUnique({ where: { id: user.id } });
      const currentCount = freshUser ? freshUser.downloadCount : user.downloadCount;
      return res.status(429).json({
        message: `This download contains ${exportSize} records, which would exceed your remaining quota of ${Math.max(0, limit - currentCount)} records.`,
      });
    }

    let csvContent = '';
    
    if (isPipelineDataset) {
      const headers = [
        'SR NO', 'Company Name', 'Head Quarter', 'NCT Number', 'Lead Drug', 
        'Secondary Drug/Combination Drug', 'Primary Indication', 'Therapeutic Area', 'Phases', 
        'Development phase', 'Starting Date', 'Completion Date', 'Prediction Of Launching', 
        'Trial Status', 'Terminated Reason', 'Molecule Type', 'Molecule Class', 
        'Research code/Brand/Synonyms', 'Mechanism Of Action', 'Target/Biomarker', 
        'Orphan Drug Status', 'Fast Track Approval', 'Line Of Therapy', 'Title', 
        'Licensee', 'Country', 'Lecensor', 'Country (second occurrence)', 'Upfront Payment', 
        'Deal Size (million)', 'Payment Mode', 'Year', 'Deals', 'Deals Type', 
        'Link', 'Licensing Availiabilty', 'Contact Person name', 'Designation', 
        'Contact NO', 'Email Id/link', 'Locations', 'Country.1', 'Clinical Investigator name', 
        'Contact_Email', 'Contact_Tel', 'Gender', 'Age', 'Enrollment', 
        'Funded By', 'Study Type', 'Indication Market Size (2023)', 'Epidemiology', 
        'sponsor', 'Collaboration', 'Study Results', 'Outcome Measures', 'Originator', 
        'Developer', 'Technology', 'Route of Administration', 'Strength', 'Dosage Form', 
        'Patent Info', 'Last Updated'
      ];
      csvContent += headers.join(',') + '\n';
      
      medicines.forEach((med) => {
        const row = [
          `"${(med.srNo || '').replace(/"/g, '""')}"`,
          `"${(med.companyName || '').replace(/"/g, '""')}"`,
          `"${(med.headQuarter || '').replace(/"/g, '""')}"`,
          `"${(med.nctNumber || '').replace(/"/g, '""')}"`,
          `"${(med.leadDrug || '').replace(/"/g, '""')}"`,
          `"${(med.secondaryDrug || '').replace(/"/g, '""')}"`,
          `"${(med.primaryIndication || '').replace(/"/g, '""')}"`,
          `"${(med.therapeuticArea || '').replace(/"/g, '""')}"`,
          `"${(med.phases || '').replace(/"/g, '""')}"`,
          `"${(med.developmentPhase || '').replace(/"/g, '""')}"`,
          `"${(med.startingDate || '').replace(/"/g, '""')}"`,
          `"${(med.completionDate || '').replace(/"/g, '""')}"`,
          `"${(med.predictionOfLaunching || '').replace(/"/g, '""')}"`,
          `"${(med.trialStatus || '').replace(/"/g, '""')}"`,
          `"${(med.terminatedReason || '').replace(/"/g, '""')}"`,
          `"${(med.moleculeType || '').replace(/"/g, '""')}"`,
          `"${(med.moleculeClass || '').replace(/"/g, '""')}"`,
          `"${(med.researchCode || '').replace(/"/g, '""')}"`,
          `"${(med.mechanismOfAction || '').replace(/"/g, '""')}"`,
          `"${(med.targetBiomarker || '').replace(/"/g, '""')}"`,
          `"${(med.orphanDrugStatus || '').replace(/"/g, '""')}"`,
          `"${(med.fastTrackApproval || '').replace(/"/g, '""')}"`,
          `"${(med.lineOfTherapy || '').replace(/"/g, '""')}"`,
          `"${(med.title || '').replace(/"/g, '""')}"`,
          `"${(med.licensee || '').replace(/"/g, '""')}"`,
          `"${(med.country || '').replace(/"/g, '""')}"`,
          `"${(med.licensor || '').replace(/"/g, '""')}"`,
          `"${(med.licensorCountry || '').replace(/"/g, '""')}"`,
          `"${(med.upfrontPayment || '').replace(/"/g, '""')}"`,
          `"${(med.dealSizeMillion || '').replace(/"/g, '""')}"`,
          `"${(med.paymentMode || '').replace(/"/g, '""')}"`,
          `"${(med.year || '').replace(/"/g, '""')}"`,
          `"${(med.deals || '').replace(/"/g, '""')}"`,
          `"${(med.dealsType || '').replace(/"/g, '""')}"`,
          `"${(med.link || '').replace(/"/g, '""')}"`,
          `"${(med.licensingAvailability || '').replace(/"/g, '""')}"`,
          `"${(med.contactPersonName || '').replace(/"/g, '""')}"`,
          `"${(med.designation || '').replace(/"/g, '""')}"`,
          `"${(med.contactNo || '').replace(/"/g, '""')}"`,
          `"${(med.emailIdLink || '').replace(/"/g, '""')}"`,
          `"${(med.locations || '').replace(/"/g, '""')}"`,
          `"${(med.country1 || '').replace(/"/g, '""')}"`,
          `"${(med.clinicalInvestigatorName || '').replace(/"/g, '""')}"`,
          `"${(med.contactEmail || '').replace(/"/g, '""')}"`,
          `"${(med.contactTel || '').replace(/"/g, '""')}"`,
          `"${(med.gender || '').replace(/"/g, '""')}"`,
          `"${(med.age || '').replace(/"/g, '""')}"`,
          `"${(med.enrollment || '').replace(/"/g, '""')}"`,
          `"${(med.fundedBy || '').replace(/"/g, '""')}"`,
          `"${(med.studyType || '').replace(/"/g, '""')}"`,
          `"${(med.indicationMarketSize2023 || '').replace(/"/g, '""')}"`,
          `"${(med.epidemiology || '').replace(/"/g, '""')}"`,
          `"${(med.sponsor || '').replace(/"/g, '""')}"`,
          `"${(med.collaboration || '').replace(/"/g, '""')}"`,
          `"${(med.studyResults || '').replace(/"/g, '""')}"`,
          `"${(med.outcomeMeasures || '').replace(/"/g, '""')}"`,
          `"${(med.originator || '').replace(/"/g, '""')}"`,
          `"${(med.developer || '').replace(/"/g, '""')}"`,
          `"${(med.technology || '').replace(/"/g, '""')}"`,
          `"${(med.routeOfAdministration || '').replace(/"/g, '""')}"`,
          `"${(med.strength || '').replace(/"/g, '""')}"`,
          `"${(med.dosageForm || '').replace(/"/g, '""')}"`,
          `"${(med.patentInfo || '').replace(/"/g, '""')}"`,
          `"${(med.lastUpdated || '').replace(/"/g, '""')}"`,
        ];
        csvContent += row.join(',') + '\n';
      });
    } else {
      const headers = [
        'Application number', 'Patent number', 'Applicant', 'Approval Daate', 'Patent expiry date', 
        'Brand Name', 'Active ingredient', 'MoA', 'Biomarker', 'Line Of Therapy', 
        'RoA', 'Dose', 'Indication Approved', 'Therapeutic Area', 'Indication under evaluation', 
        'RLD', 'RS', 'Country', '2018 (Sales in Million $)', '2019 Sales Million $', 
        '2020 (Sales Million $', '2021 Sales Million $', '2022 Sales Million $', 
        '2023 Sales Million $ Forcasting', '2024 Sales Million $ Forcasting', 
        '2025 Sales Million $ Forcasting', '2026 Sales Million $ Forcasting', 
        '2027 Sales Million $ Forcasting', 'No. of competitiors', 'Sources'
      ];
      csvContent += headers.join(',') + '\n';
      
      medicines.forEach((med) => {
        const row = [
          `"${(med.applicationNumber || '').replace(/"/g, '""')}"`,
          `"${(med.patentNumber || '').replace(/"/g, '""')}"`,
          `"${(med.applicant || '').replace(/"/g, '""')}"`,
          `"${(med.approvalDate || '').replace(/"/g, '""')}"`,
          `"${(med.patentExpiryDate || '').replace(/"/g, '""')}"`,
          `"${(med.brandName || '').replace(/"/g, '""')}"`,
          `"${(med.activeIngredient || '').replace(/"/g, '""')}"`,
          `"${(med.moa || '').replace(/"/g, '""')}"`,
          `"${(med.biomarker || '').replace(/"/g, '""')}"`,
          `"${(med.lineOfTherapy || '').replace(/"/g, '""')}"`,
          `"${(med.roa || '').replace(/"/g, '""')}"`,
          `"${(med.dose || '').replace(/"/g, '""')}"`,
          `"${(med.indicationApproved || '').replace(/"/g, '""')}"`,
          `"${(med.therapeuticArea || '').replace(/"/g, '""')}"`,
          `"${(med.indicationUnderEvaluation || '').replace(/"/g, '""')}"`,
          `"${(med.rld || '').replace(/"/g, '""')}"`,
          `"${(med.rs || '').replace(/"/g, '""')}"`,
          `"${(med.country || '').replace(/"/g, '""')}"`,
          `"${(med.sales2018 || '').replace(/"/g, '""')}"`,
          `"${(med.sales2019 || '').replace(/"/g, '""')}"`,
          `"${(med.sales2020 || '').replace(/"/g, '""')}"`,
          `"${(med.sales2021 || '').replace(/"/g, '""')}"`,
          `"${(med.sales2022 || '').replace(/"/g, '""')}"`,
          `"${(med.forecastingSales2023 || '').replace(/"/g, '""')}"`,
          `"${(med.forecastingSales2024 || '').replace(/"/g, '""')}"`,
          `"${(med.forecastingSales2025 || '').replace(/"/g, '""')}"`,
          `"${(med.forecastingSales2026 || '').replace(/"/g, '""')}"`,
          `"${(med.forecastingSales2027 || '').replace(/"/g, '""')}"`,
          `"${(med.noOfCompetitors || '').replace(/"/g, '""')}"`,
          `"${(med.sources || '').replace(/"/g, '""')}"`,
        ];
        csvContent += row.join(',') + '\n';
      });
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=medtrack_export_${Date.now()}.csv`);
    return res.status(200).send(csvContent);
  } catch (error) {
    logger.error('Download error:', { error });
    return res.status(500).json({ message: 'Error compiling CSV file' });
  }
};
const suggestionCache = new Map<string, { timestamp: number; data: any[] }>();
suggestionCache.clear();
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes cache TTL

export const getSuggestions = async (req: Request, res: Response) => {
  try {
    res.setHeader('Cache-Control', 'public, max-age=300'); // 5 minutes browser cache
    const { query, category } = req.query;
    const cat = category ? category.toString().trim().toLowerCase() : '';
    const rawQuery = query ? query.toString().trim() : '';

    // Parse comma-separated query: extract last segment as active search term
    const isTrailingComma = rawQuery.endsWith(',');
    const queryParts = rawQuery.split(',').map((s: string) => s.trim()).filter(Boolean);
    const lastPart = (queryParts[queryParts.length - 1] || '').trim();
    
    let searchStr = lastPart;
    // Clear searchStr ONLY if trailing comma or if lastPart is an already-completed term in a multi-term query
    const isCompletedPrevTerm = queryParts.length > 1 && queryParts.slice(0, -1).includes(lastPart);
    if (isTrailingComma || isCompletedPrevTerm) {
      searchStr = '';
    }
    const searchStrLower = searchStr.toLowerCase();

    // Check server-side in-memory cache
    const cacheKey = `${cat}:${searchStrLower}`;
    const cached = suggestionCache.get(cacheKey);
    if (process.env.NODE_ENV === 'production' && cached && (Date.now() - cached.timestamp < CACHE_TTL_MS)) {
      return res.status(200).json({ suggestions: cached.data });
    }

    let suggestions: Array<{ type: string, text: string }> = [];

    const todayStr = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    if (!cat) {
      const ALL_COUNTRIES = ['US', 'EU', 'Japan', 'Canada', 'Korea', 'India', 'Aus/NZ'];
      const DISEASES = ['Fever', 'Cold/Cough', 'Asthma'];

      if (!searchStrLower) {
        // When no search letter is typed yet, show Diseases first, then Countries
        DISEASES.forEach(d => suggestions.push({ type: 'disease', text: d }));
        ALL_COUNTRIES.forEach(c => suggestions.push({ type: 'country', text: c }));
      } else {
        // When user starts typing letters (e.g. 'fever', 'cou', 'ast'):
        // 1. Prioritize matching Diseases first
        DISEASES.forEach(d => {
          if (d.toLowerCase().includes(searchStrLower)) {
            suggestions.push({ type: 'disease', text: d });
          }
        });

        // 2. Query database for drugs and indications matching typed letters
        const matchedPipeline = await prisma.pipelineProspector.findMany({
          where: {
            OR: [
              { leadDrug: { contains: searchStr, mode: 'insensitive' } },
              { primaryIndication: { contains: searchStr, mode: 'insensitive' } },
              { therapeuticArea: { contains: searchStr, mode: 'insensitive' } }
            ]
          },
          take: 15
        });

        const matchedForecasting = await prisma.patentSalesForecasting.findMany({
          where: {
            OR: [
              { activeIngredient: { contains: searchStr, mode: 'insensitive' } },
              { brandName: { contains: searchStr, mode: 'insensitive' } },
              { indicationApproved: { contains: searchStr, mode: 'insensitive' } },
              { therapeuticArea: { contains: searchStr, mode: 'insensitive' } }
            ]
          },
          take: 15
        });
        
        const drugNames = new Set<string>();
        const otherDiseases = new Set<string>();
        
        matchedPipeline.forEach(m => {
          if (m.leadDrug && m.leadDrug.toLowerCase().includes(searchStrLower)) {
            drugNames.add(m.leadDrug);
          }
          if (m.primaryIndication && m.primaryIndication.toLowerCase().includes(searchStrLower)) {
            otherDiseases.add(m.primaryIndication);
          }
        });

        matchedForecasting.forEach(m => {
          const name = m.brandName || m.activeIngredient;
          if (name && name.toLowerCase().includes(searchStrLower)) {
            drugNames.add(name);
          }
          if (m.indicationApproved && m.indicationApproved.toLowerCase().includes(searchStrLower)) {
            otherDiseases.add(m.indicationApproved);
          }
        });
        
        drugNames.forEach(name => {
          suggestions.push({ type: 'medicine', text: name });
        });
        
        otherDiseases.forEach(ind => {
          if (!DISEASES.some(d => d.toLowerCase() === ind.toLowerCase())) {
            suggestions.push({ type: 'disease', text: ind });
          }
        });

        // 3. Only add Countries matching searchStrLower if any match
        ALL_COUNTRIES.forEach(c => {
          if (c.toLowerCase().includes(searchStrLower)) {
            suggestions.push({ type: 'country', text: c });
          }
        });
      }
    } else {
      // Category specific autocomplete
      if (cat === 'disease') {
        const matchedPipeline = await prisma.pipelineProspector.findMany({
          where: searchStr ? { primaryIndication: { contains: searchStr, mode: 'insensitive' } } : {},
          select: { primaryIndication: true },
          distinct: ['primaryIndication'],
          take: 25
        });
        const matchedForecasting = await prisma.patentSalesForecasting.findMany({
          where: searchStr ? { indicationApproved: { contains: searchStr, mode: 'insensitive' } } : {},
          select: { indicationApproved: true },
          distinct: ['indicationApproved'],
          take: 25
        });
        const results = new Set<string>();
        matchedPipeline.forEach(p => p.primaryIndication && results.add(p.primaryIndication));
        matchedForecasting.forEach(f => f.indicationApproved && results.add(f.indicationApproved));
        results.forEach(text => suggestions.push({ type: 'disease', text }));
      } else if (cat === 'therapy area' || cat === 'therapyarea' || cat === 'therapeuticarea') {
        const matchedPipeline = await prisma.pipelineProspector.findMany({
          where: searchStr ? { therapeuticArea: { contains: searchStr, mode: 'insensitive' } } : {},
          select: { therapeuticArea: true },
          distinct: ['therapeuticArea'],
          take: 25
        });
        const matchedForecasting = await prisma.patentSalesForecasting.findMany({
          where: searchStr ? { therapeuticArea: { contains: searchStr, mode: 'insensitive' } } : {},
          select: { therapeuticArea: true },
          distinct: ['therapeuticArea'],
          take: 25
        });
        const results = new Set<string>();
        matchedPipeline.forEach(p => p.therapeuticArea && results.add(p.therapeuticArea));
        matchedForecasting.forEach(f => f.therapeuticArea && results.add(f.therapeuticArea));
        results.forEach(text => suggestions.push({ type: 'therapyArea', text }));
      } else if (cat === 'current development phase' || cat === 'developmentphase' || cat === 'phase') {
        const matchedPipeline = await prisma.pipelineProspector.findMany({
          where: searchStr ? { developmentPhase: { contains: searchStr, mode: 'insensitive' } } : {},
          select: { developmentPhase: true },
          distinct: ['developmentPhase'],
          take: 25
        });
        const results = new Set<string>();
        matchedPipeline.forEach(p => p.developmentPhase && results.add(p.developmentPhase));
        results.forEach(text => suggestions.push({ type: 'developmentPhase', text }));
      } else if (cat === 'company/ sponsor' || cat === 'company' || cat === 'sponsor') {
        const matchedPipeline = await prisma.pipelineProspector.findMany({
          where: searchStr ? {
            OR: [
              { companyName: { contains: searchStr, mode: 'insensitive' } },
              { sponsor: { contains: searchStr, mode: 'insensitive' } }
            ]
          } : {},
          select: { companyName: true, sponsor: true },
          take: 25
        });
        const matchedForecasting = await prisma.patentSalesForecasting.findMany({
          where: searchStr ? { applicant: { contains: searchStr, mode: 'insensitive' } } : {},
          select: { applicant: true },
          distinct: ['applicant'],
          take: 25
        });
        const results = new Set<string>();
        matchedPipeline.forEach(p => {
          if (p.companyName) results.add(p.companyName);
          if (p.sponsor) results.add(p.sponsor);
        });
        matchedForecasting.forEach(f => f.applicant && results.add(f.applicant));
        results.forEach(text => suggestions.push({ type: 'sponsor', text }));
      } else if (cat === 'biomarker/ moa' || cat === 'moa' || cat === 'biomarker') {
        const matchedPipeline = await prisma.pipelineProspector.findMany({
          where: searchStr ? {
            OR: [
              { mechanismOfAction: { contains: searchStr, mode: 'insensitive' } },
              { targetBiomarker: { contains: searchStr, mode: 'insensitive' } }
            ]
          } : {},
          select: { mechanismOfAction: true, targetBiomarker: true },
          take: 25
        });
        const matchedForecasting = await prisma.patentSalesForecasting.findMany({
          where: searchStr ? {
            OR: [
              { moa: { contains: searchStr, mode: 'insensitive' } },
              { biomarker: { contains: searchStr, mode: 'insensitive' } }
            ]
          } : {},
          select: { moa: true, biomarker: true },
          take: 25
        });
        const results = new Set<string>();
        matchedPipeline.forEach(p => {
          if (p.mechanismOfAction) results.add(p.mechanismOfAction);
          if (p.targetBiomarker) results.add(p.targetBiomarker);
        });
        matchedForecasting.forEach(f => {
          if (f.moa) results.add(f.moa);
          if (f.biomarker) results.add(f.biomarker);
        });
        results.forEach(text => suggestions.push({ type: 'biomarker/moa', text }));
      } else if (cat === 'product/ candidate' || cat === 'product' || cat === 'candidate') {
        const matchedPipeline = await prisma.pipelineProspector.findMany({
          where: searchStr ? { leadDrug: { contains: searchStr, mode: 'insensitive' } } : {},
          select: { leadDrug: true },
          distinct: ['leadDrug'],
          take: 25
        });
        const matchedForecasting = await prisma.patentSalesForecasting.findMany({
          where: searchStr ? {
            OR: [
              { brandName: { contains: searchStr, mode: 'insensitive' } },
              { activeIngredient: { contains: searchStr, mode: 'insensitive' } }
            ]
          } : {},
          select: { brandName: true, activeIngredient: true },
          take: 25
        });
        const results = new Set<string>();
        matchedPipeline.forEach(p => p.leadDrug && results.add(p.leadDrug));
        matchedForecasting.forEach(f => {
          if (f.brandName) results.add(f.brandName);
          if (f.activeIngredient) results.add(f.activeIngredient);
        });
        results.forEach(text => suggestions.push({ type: 'product', text }));
      } else if (cat === 'type of molecule' || cat === 'moleculetype') {
        const matchedPipeline = await prisma.pipelineProspector.findMany({
          where: searchStr ? { moleculeType: { contains: searchStr, mode: 'insensitive' } } : {},
          select: { moleculeType: true },
          distinct: ['moleculeType'],
          take: 25
        });
        const results = new Set<string>();
        matchedPipeline.forEach(p => p.moleculeType && results.add(p.moleculeType));
        results.forEach(text => suggestions.push({ type: 'moleculeType', text }));
      } else if (cat === 'biological class' || cat === 'moleculeclass') {
        const matchedPipeline = await prisma.pipelineProspector.findMany({
          where: searchStr ? { moleculeClass: { contains: searchStr, mode: 'insensitive' } } : {},
          select: { moleculeClass: true },
          distinct: ['moleculeClass'],
          take: 25
        });
        const results = new Set<string>();
        matchedPipeline.forEach(p => p.moleculeClass && results.add(p.moleculeClass));
        results.forEach(text => suggestions.push({ type: 'moleculeClass', text }));
      } else if (cat === 'marketed drugs' || cat === 'marketed') {
        const matchedForecasting = await prisma.patentSalesForecasting.findMany({
          where: searchStr ? {
            OR: [
              { brandName: { contains: searchStr, mode: 'insensitive' } },
              { activeIngredient: { contains: searchStr, mode: 'insensitive' } }
            ]
          } : {},
          select: { brandName: true, activeIngredient: true },
          take: 25
        });
        const results = new Set<string>();
        matchedForecasting.forEach(f => {
          if (f.brandName) results.add(f.brandName);
          if (f.activeIngredient) results.add(f.activeIngredient);
        });
        results.forEach(text => suggestions.push({ type: 'marketed', text }));
      } else if (cat === 'off patent drugs' || cat === 'offpatent') {
        const matchedForecasting = await prisma.patentSalesForecasting.findMany({
          where: searchStr ? {
            AND: [
              {
                OR: [
                  { brandName: { contains: searchStr, mode: 'insensitive' } },
                  { activeIngredient: { contains: searchStr, mode: 'insensitive' } }
                ]
              },
              { patentExpiryDate: { lt: todayStr } }
            ]
          } : { patentExpiryDate: { lt: todayStr } },
          select: { brandName: true, activeIngredient: true },
          take: 25
        });
        const results = new Set<string>();
        matchedForecasting.forEach(f => {
          if (f.brandName) results.add(f.brandName);
          if (f.activeIngredient) results.add(f.activeIngredient);
        });
        results.forEach(text => suggestions.push({ type: 'offPatent', text }));
      }
    }

    // Deduplicate suggestions and cap at 25 items
    const seen = new Set();
    const uniqueSuggestions = suggestions.filter(s => {
      const key = `${s.type}:${s.text.toLowerCase()}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }).slice(0, 25);

    // Store in server-side memory cache
    suggestionCache.set(cacheKey, { timestamp: Date.now(), data: uniqueSuggestions });

    return res.status(200).json({ suggestions: uniqueSuggestions });
  } catch (error) {
    logger.error('Suggestions error:', { error });
    return res.status(500).json({ message: 'Error fetching suggestions' });
  }
};

export const getMedicineAnalysis = async (req: Request, res: Response) => {
  try {
    res.setHeader('Cache-Control', 'public, max-age=300'); // 5 minutes browser cache for clinical search summaries
    const { query, field, countries, diseases } = req.query;

    // Parse filters
    let selectedCountries: string[] = [];
    let hasCountryFilter = false;
    if (countries !== undefined) {
      if (typeof countries === 'string') {
        selectedCountries = countries.split(',').map(c => c.trim()).filter(Boolean);
      } else if (Array.isArray(countries)) {
        selectedCountries = countries.map(c => String(c).trim()).filter(Boolean);
      }
      hasCountryFilter = selectedCountries.length > 0;
    }

    let selectedDiseases: string[] = [];
    let hasDiseaseFilter = false;
    if (diseases !== undefined) {
      if (typeof diseases === 'string') {
        selectedDiseases = diseases.split(',').map(d => d.trim()).filter(Boolean);
      } else if (Array.isArray(diseases)) {
        selectedDiseases = diseases.map(d => String(d).trim()).filter(Boolean);
      }
      hasDiseaseFilter = selectedDiseases.length > 0;
    }

    // Build Pipeline filters
    const andPipeline: any[] = [];
    if (query && query.toString().trim() !== '') {
      const fullSearchStr = query.toString().trim();
      const searchTerms = fullSearchStr.split(',').map((s: string) => s.trim()).filter(Boolean);
      const pipelineOrBranches: any[] = [];

      searchTerms.forEach(searchStr => {
        if (field === 'drugName') {
          pipelineOrBranches.push({ leadDrug: { contains: searchStr, mode: 'insensitive' } });
        } else if (field === 'indication') {
          pipelineOrBranches.push({ primaryIndication: { contains: searchStr, mode: 'insensitive' } });
        } else if (field === 'moa') {
          pipelineOrBranches.push({ mechanismOfAction: { contains: searchStr, mode: 'insensitive' } });
        } else {
          pipelineOrBranches.push(
            { leadDrug: { contains: searchStr, mode: 'insensitive' } },
            { primaryIndication: { contains: searchStr, mode: 'insensitive' } },
            { mechanismOfAction: { contains: searchStr, mode: 'insensitive' } },
            { therapeuticArea: { contains: searchStr, mode: 'insensitive' } },
            { developmentPhase: { contains: searchStr, mode: 'insensitive' } },
            { sponsor: { contains: searchStr, mode: 'insensitive' } },
            { companyName: { contains: searchStr, mode: 'insensitive' } },
          );
        }
      });

      if (pipelineOrBranches.length > 0) {
        andPipeline.push({ OR: pipelineOrBranches });
      }
    }
    if (hasCountryFilter) {
      andPipeline.push({ country: { in: selectedCountries } });
    }
    if (hasDiseaseFilter) {
      andPipeline.push({
        OR: selectedDiseases.map(d => ({
          primaryIndication: { contains: d, mode: 'insensitive' }
        }))
      });
    }
    const wherePipeline: any = andPipeline.length > 0 ? { AND: andPipeline } : {};

    // Build Forecasting filters
    const andForecasting: any[] = [];
    if (query && query.toString().trim() !== '') {
      const fullSearchStr = query.toString().trim();
      const searchTerms = fullSearchStr.split(',').map((s: string) => s.trim()).filter(Boolean);
      const forecastingOrBranches: any[] = [];

      searchTerms.forEach(searchStr => {
        if (field === 'drugName') {
          forecastingOrBranches.push(
            { activeIngredient: { contains: searchStr, mode: 'insensitive' } },
            { brandName: { contains: searchStr, mode: 'insensitive' } },
          );
        } else if (field === 'indication') {
          forecastingOrBranches.push(
            { indicationApproved: { contains: searchStr, mode: 'insensitive' } },
            { indicationUnderEvaluation: { contains: searchStr, mode: 'insensitive' } },
          );
        } else if (field === 'moa') {
          forecastingOrBranches.push({ moa: { contains: searchStr, mode: 'insensitive' } });
        } else {
          forecastingOrBranches.push(
            { activeIngredient: { contains: searchStr, mode: 'insensitive' } },
            { brandName: { contains: searchStr, mode: 'insensitive' } },
            { indicationApproved: { contains: searchStr, mode: 'insensitive' } },
            { moa: { contains: searchStr, mode: 'insensitive' } },
            { therapeuticArea: { contains: searchStr, mode: 'insensitive' } },
            { applicant: { contains: searchStr, mode: 'insensitive' } },
          );
        }
      });

      if (forecastingOrBranches.length > 0) {
        andForecasting.push({ OR: forecastingOrBranches });
      }
    }
    if (hasCountryFilter) {
      andForecasting.push({ country: { in: selectedCountries } });
    }
    if (hasDiseaseFilter) {
      andForecasting.push({
        OR: selectedDiseases.map(d => ({
          indicationApproved: { contains: d, mode: 'insensitive' }
        }))
      });
    }
    const whereForecasting: any = andForecasting.length > 0 ? { AND: andForecasting } : {};

    const pipelines = await prisma.pipelineProspector.findMany({ where: wherePipeline });
    const forecastings = await prisma.patentSalesForecasting.findMany({ where: whereForecasting });

    // 12 Stats counters
    const productTrial = pipelines.length;
    
    const productTypeSet = new Set(pipelines.map(p => p.moleculeType).filter(Boolean));
    const productType = productTypeSet.size;

    const biomarkerMoaSet = new Set([
      ...pipelines.map(p => p.mechanismOfAction).filter(Boolean),
      ...pipelines.map(p => p.targetBiomarker).filter(Boolean),
      ...forecastings.map(f => f.moa).filter(Boolean),
      ...forecastings.map(f => f.biomarker).filter(Boolean)
    ]);
    const biomarkerMoa = biomarkerMoaSet.size;

    const therapeuticAreaSet = new Set([
      ...pipelines.map(p => p.therapeuticArea).filter(Boolean),
      ...forecastings.map(f => f.therapeuticArea).filter(Boolean)
    ]);
    const therapeuticArea = therapeuticAreaSet.size;

    const sponsorSet = new Set([
      ...pipelines.map(p => p.sponsor || p.companyName).filter(Boolean),
      ...forecastings.map(f => f.applicant).filter(Boolean)
    ]);
    const sponsor = sponsorSet.size;

    const pipelineCandidatesSet = new Set(pipelines.map(p => p.leadDrug).filter(Boolean));
    const pipelineCandidates = pipelineCandidatesSet.size;

    const marketedDrug = forecastings.length;

    const licensingCount = pipelines.filter(p => p.licensingAvailability && p.licensingAvailability.toLowerCase().includes('yes')).length;
    const availableForLicensing = licensingCount;

    const biologicalClassSet = new Set(pipelines.map(p => p.moleculeClass).filter(Boolean));
    const biologicalClass = biologicalClassSet.size;

    const todayStr = new Date().toISOString().split('T')[0];
    const patentExpiry = forecastings.filter(f => f.patentExpiryDate && f.patentExpiryDate < todayStr).length;

    // Sales Data Total Sum
    let totalSalesMillions = 0;
    forecastings.forEach(f => {
      const val18 = parseFloat(f.sales2018 || '0') || 0;
      const val19 = parseFloat(f.sales2019 || '0') || 0;
      const val20 = parseFloat(f.sales2020 || '0') || 0;
      const val21 = parseFloat(f.sales2021 || '0') || 0;
      const val22 = parseFloat(f.sales2022 || '0') || 0;
      totalSalesMillions += (val18 + val19 + val20 + val21 + val22);
    });

    // Clinical Trial Result statuses
    const trialStatusMap: Record<string, number> = {};
    pipelines.forEach(p => {
      const status = p.trialStatus || 'Active';
      trialStatusMap[status] = (trialStatusMap[status] || 0) + 1;
    });

    // Pipeline Candidates (by phase count)
    const phaseMap: Record<string, number> = {};
    pipelines.forEach(p => {
      const ph = p.developmentPhase || p.phases || 'N/A';
      phaseMap[ph] = (phaseMap[ph] || 0) + 1;
    });
    const pipelineByPhase = Object.entries(phaseMap).map(([phase, count]) => ({ phase, count }));

    // Sponsor Analysis (Top 8 Sponsors)
    const sponsorCountMap: Record<string, number> = {};
    pipelines.forEach(p => {
      const sp = p.sponsor || p.companyName || 'N/A';
      sponsorCountMap[sp] = (sponsorCountMap[sp] || 0) + 1;
    });
    forecastings.forEach(f => {
      const sp = f.applicant || 'N/A';
      sponsorCountMap[sp] = (sponsorCountMap[sp] || 0) + 1;
    });
    const topSponsors = Object.entries(sponsorCountMap)
      .map(([sponsor, count]) => ({ sponsor, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    // Prediction of Launch (line chart over years)
    const predictionMap: Record<string, number> = {};
    pipelines.forEach(p => {
      const yr = p.predictionOfLaunching || p.year;
      if (yr && /^\d{4}$/.test(yr)) {
        predictionMap[yr] = (predictionMap[yr] || 0) + 1;
      }
    });
    const predictionOfLaunch = Object.entries(predictionMap)
      .map(([year, count]) => ({ year, count }))
      .sort((a, b) => a.year.localeCompare(b.year));

    // Product Level Competition (unique count of products by phase)
    const productPhaseMap: Record<string, Set<string>> = {};
    pipelines.forEach(p => {
      const ph = p.developmentPhase || p.phases || 'N/A';
      const drug = p.leadDrug;
      if (drug) {
        if (!productPhaseMap[ph]) productPhaseMap[ph] = new Set();
        productPhaseMap[ph].add(drug);
      }
    });
    const productLevelCompetition = Object.entries(productPhaseMap).map(([phase, set]) => ({
      phase,
      count: set.size
    }));

    // Country Wise Analysis
    const countryMap: Record<string, number> = {};
    pipelines.forEach(p => {
      const c = p.country || 'US';
      countryMap[c] = (countryMap[c] || 0) + 1;
    });
    forecastings.forEach(f => {
      const c = f.country || 'US';
      countryMap[c] = (countryMap[c] || 0) + 1;
    });
    const countryWiseAnalysis = Object.entries(countryMap).map(([country, count]) => ({ country, count }));

    // Therapeutic Area Breakdown
    const taMap: Record<string, number> = {};
    pipelines.forEach(p => {
      const ta = p.therapeuticArea || 'N/A';
      taMap[ta] = (taMap[ta] || 0) + 1;
    });
    forecastings.forEach(f => {
      const ta = f.therapeuticArea || 'N/A';
      taMap[ta] = (taMap[ta] || 0) + 1;
    });
    const therapeuticAreaBreakdown = Object.entries(taMap)
      .map(([therapeuticArea, count]) => ({ therapeuticArea, count }))
      .sort((a, b) => b.count - a.count);

    // Extract contacts list from clinical pipeline records
    const contactsList: Array<{ name: string; email: string; phone: string; role: string; trial: string }> = [];
    pipelines.forEach(p => {
      const name = p.contactPersonName || p.clinicalInvestigatorName;
      const email = p.contactEmail || p.emailIdLink;
      const phone = p.contactTel || p.contactNo;
      if (name || email || phone) {
        contactsList.push({
          name: name || 'N/A',
          email: email || 'N/A',
          phone: phone || 'N/A',
          role: p.designation || (p.clinicalInvestigatorName ? 'Investigator' : 'Contact Person'),
          trial: p.leadDrug ? `${p.leadDrug} (${p.nctNumber || 'N/A'})` : (p.nctNumber || 'N/A')
        });
      }
    });

    return res.status(200).json({
      metrics: {
        productTrial,
        productType,
        biomarkerMoa,
        therapeuticArea,
        sponsor,
        pipelineCandidates,
        marketedDrug,
        availableForLicensing,
        biologicalClass,
        patentExpiry,
        totalSalesMillions,
        trialStatusMap,
        contacts: contactsList.slice(0, 30)
      },
      charts: {
        pipelineByPhase,
        topSponsors,
        predictionOfLaunch,
        productLevelCompetition,
        countryWiseAnalysis,
        therapeuticAreaBreakdown
      }
    });
  } catch (error) {
    logger.error('Analysis error:', { error });
    return res.status(500).json({ message: 'Error retrieving analysis statistics' });
  }
};
