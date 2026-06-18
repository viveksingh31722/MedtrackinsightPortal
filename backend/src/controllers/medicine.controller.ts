import { Request, Response } from 'express';
import { prisma } from '../config/prisma';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { verifyAccessToken } from '../utils/jwt';
import { esClient, checkEsHealth } from '../config/elasticsearch';
import { env } from '../config/env';

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

export const searchMedicines = async (req: Request, res: Response) => {
  try {
    const { query, field, dataset, page = '1', limit = '10', countries, diseases } = req.query;
    const isSubscribed = await checkSubscriptionStatus(req);

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    // Parse countries filter (either comma-separated string or array)
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

    // Parse diseases filter (either comma-separated string or array)
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

    let medicines: any[] = [];
    let isEsUsed = false;

    // Resilient search approach: Attempt Elasticsearch query if healthy, fallback to Postgres
    const isEsHealthy = await checkEsHealth();
    if (isEsHealthy && esClient && query && query.toString().trim() !== '') {
      try {
        const searchStr = query.toString().trim();
        const queryBody: any = {
          query: {
            bool: {
              must: []
            }
          },
          size: 10000 // Fetch matching doc IDs to slice/sort
        };

        if (field === 'drugName') {
          queryBody.query.bool.must.push({
            match: { drugName: { query: searchStr, fuzziness: 'AUTO' } }
          });
        } else if (field === 'indication') {
          queryBody.query.bool.must.push({
            match: { indication: { query: searchStr, fuzziness: 'AUTO' } }
          });
        } else if (field === 'moa') {
          queryBody.query.bool.must.push({
            match: { moa: { query: searchStr, fuzziness: 'AUTO' } }
          });
        } else {
          queryBody.query.bool.must.push({
            multi_match: {
              query: searchStr,
              fields: ['drugName^3', 'indication^2', 'moa'],
              fuzziness: 'AUTO'
            }
          });
        }

        if (dataset) {
          queryBody.query.bool.must.push({
            term: { dataset: dataset }
          });
        }

        if (hasCountryFilter) {
          queryBody.query.bool.filter = queryBody.query.bool.filter || [];
          queryBody.query.bool.filter.push({
            terms: { country: selectedCountries }
          });
        }

        if (hasDiseaseFilter) {
          queryBody.query.bool.filter = queryBody.query.bool.filter || [];
          const diseaseShouldQueries = selectedDiseases.map((d: string) => ({
            match_phrase: { indication: d }
          }));
          queryBody.query.bool.filter.push({
            bool: {
              should: diseaseShouldQueries,
              minimum_should_match: 1
            }
          });
        }

        console.log(`🔍 Querying Elasticsearch for search string: "${searchStr}"...`);
        const searchResponse = await esClient.search({
          index: env.ELASTICSEARCH_INDEX,
          body: queryBody
        });

        const hits = searchResponse.hits.hits;
        const docIds = hits.map((hit: any) => hit._id);

        if (docIds.length > 0) {
          const matchedMedicines = await prisma.medicine.findMany({
            where: { id: { in: docIds } }
          });

          const medicinesMap = new Map(matchedMedicines.map(m => [m.id, m]));
          medicines = docIds
            .map(id => medicinesMap.get(id))
            .filter(Boolean) as typeof matchedMedicines;
          isEsUsed = true;
          console.log(`✅ Elasticsearch search returned ${medicines.length} ordered records.`);
        }
      } catch (esError) {
        console.error('⚠️ Elasticsearch query failed, falling back to database search:', esError);
      }
    }

    // Fallback direct Prisma search
    if (!isEsUsed) {
      console.log('🔌 Running direct database search query fallback...');
      const whereClause: any = {};

      if (query && query.toString().trim() !== '') {
        const searchStr = query.toString().trim();
        if (field === 'drugName') {
          whereClause.drugName = { contains: searchStr };
        } else if (field === 'indication') {
          whereClause.indication = { contains: searchStr };
        } else if (field === 'moa') {
          whereClause.moa = { contains: searchStr };
        } else {
          whereClause.OR = [
            { drugName: { contains: searchStr } },
            { indication: { contains: searchStr } },
            { moa: { contains: searchStr } },
          ];
        }
      }

      medicines = await prisma.medicine.findMany({
        where: whereClause,
        orderBy: { drugName: 'asc' },
      });

      if (dataset) {
        medicines = medicines.filter((med) => {
          try {
            const additional = JSON.parse(med.additionalData || '{}');
            return additional.dataset === dataset;
          } catch {
            return false;
          }
        });
      }

      if (hasCountryFilter) {
        medicines = medicines.filter((med) => {
          try {
            const additional = JSON.parse(med.additionalData || '{}');
            const medCountry = additional.country || 'US';
            return selectedCountries.includes(medCountry);
          } catch {
            return false;
          }
        });
      }

      if (hasDiseaseFilter) {
        medicines = medicines.filter((med) => {
          return selectedDiseases.some(d => med.indication.toLowerCase().includes(d.toLowerCase()));
        });
      }
    }

    const total = medicines.length;
    const paginatedMedicines = medicines.slice(skip, skip + limitNum);

    const processedMedicines = paginatedMedicines.map((med) => {
      let additional: any = {};
      try {
        additional = JSON.parse(med.additionalData || '{}');
      } catch (err) {
        additional = {};
      }
      
      const basicData = {
        id: med.id,
        drugName: med.drugName,
        indication: med.indication,
        moa: med.moa,
        createdAt: med.createdAt,
        phase: additional.phase || 'N/A', 
        dataset: additional.dataset || 'FDA Register',
        country: additional.country || 'US',
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
            phase: additional.phase || 'N/A',
            dataset: additional.dataset || 'FDA Register',
            locked: true, 
          },
        };
      }
    });

    return res.status(200).json({
      medicines: processedMedicines,
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
    console.error('Medicine search error:', error);
    return res.status(500).json({ message: 'Internal server error while searching clinical data' });
  }
};

export const getMedicineById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const isSubscribed = await checkSubscriptionStatus(req);

    const medicine = await prisma.medicine.findUnique({ where: { id } });
    if (!medicine) {
      return res.status(404).json({ message: 'Medicine record not found' });
    }

    let additional: any = {};
    try {
      additional = JSON.parse(medicine.additionalData || '{}');
    } catch {
      additional = {};
    }

    const basicData = {
      id: medicine.id,
      drugName: medicine.drugName,
      indication: medicine.indication,
      moa: medicine.moa,
      phase: additional.phase || 'N/A',
      dataset: additional.dataset || 'FDA Register',
      country: additional.country || 'US',
    };

    if (isSubscribed) {
      return res.status(200).json({
        ...basicData,
        additionalData: additional,
      });
    } else {
      return res.status(200).json({
        ...basicData,
        additionalData: {
          phase: additional.phase || 'N/A',
          dataset: additional.dataset || 'FDA Register',
          locked: true,
        },
        message: 'Upgrade to PRO to unlock full 45-column specifications',
      });
    }
  } catch (error) {
    console.error('Get medicine error:', error);
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

    if (user.downloadCount >= 2000) {
      return res.status(429).json({
        message: 'Export limit exceeded. You have downloaded the maximum allowed rows (2,000) for this billing period.',
      });
    }

    const { query, field, dataset, countries, diseases } = req.query;
    let medicines: any[] = [];
    let isEsUsed = false;

    // Parse countries filter (either comma-separated string or array)
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

    // Parse diseases filter (either comma-separated string or array)
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

    // Resilient search approach: Attempt Elasticsearch query if healthy, fallback to Postgres
    const isEsHealthy = await checkEsHealth();
    if (isEsHealthy && esClient && query && query.toString().trim() !== '') {
      try {
        const searchStr = query.toString().trim();
        const queryBody: any = {
          query: {
            bool: {
              must: []
            }
          },
          size: 10000 // Get all matches for export
        };

        if (field === 'drugName') {
          queryBody.query.bool.must.push({
            match: { drugName: { query: searchStr, fuzziness: 'AUTO' } }
          });
        } else if (field === 'indication') {
          queryBody.query.bool.must.push({
            match: { indication: { query: searchStr, fuzziness: 'AUTO' } }
          });
        } else if (field === 'moa') {
          queryBody.query.bool.must.push({
            match: { moa: { query: searchStr, fuzziness: 'AUTO' } }
          });
        } else {
          queryBody.query.bool.must.push({
            multi_match: {
              query: searchStr,
              fields: ['drugName^3', 'indication^2', 'moa'],
              fuzziness: 'AUTO'
            }
          });
        }

        if (dataset) {
          queryBody.query.bool.must.push({
            term: { dataset: dataset }
          });
        }

        if (hasCountryFilter) {
          queryBody.query.bool.filter = queryBody.query.bool.filter || [];
          queryBody.query.bool.filter.push({
            terms: { country: selectedCountries }
          });
        }

        if (hasDiseaseFilter) {
          queryBody.query.bool.filter = queryBody.query.bool.filter || [];
          const diseaseShouldQueries = selectedDiseases.map((d: string) => ({
            match_phrase: { indication: d }
          }));
          queryBody.query.bool.filter.push({
            bool: {
              should: diseaseShouldQueries,
              minimum_should_match: 1
            }
          });
        }

        const searchResponse = await esClient.search({
          index: env.ELASTICSEARCH_INDEX,
          body: queryBody
        });

        const hits = searchResponse.hits.hits;
        const docIds = hits.map((hit: any) => hit._id);

        if (docIds.length > 0) {
          const matchedMedicines = await prisma.medicine.findMany({
            where: { id: { in: docIds } }
          });

          const medicinesMap = new Map(matchedMedicines.map(m => [m.id, m]));
          medicines = docIds
            .map(id => medicinesMap.get(id))
            .filter(Boolean) as typeof matchedMedicines;
          isEsUsed = true;
        }
      } catch (esError) {
        console.error('⚠️ Elasticsearch query failed in CSV export, falling back to database search:', esError);
      }
    }

    // Fallback direct Prisma search
    if (!isEsUsed) {
      const whereClause: any = {};
      if (query && query.toString().trim() !== '') {
        const searchStr = query.toString().trim();
        if (field === 'drugName') {
          whereClause.drugName = { contains: searchStr };
        } else if (field === 'indication') {
          whereClause.indication = { contains: searchStr };
        } else if (field === 'moa') {
          whereClause.moa = { contains: searchStr };
        } else {
          whereClause.OR = [
            { drugName: { contains: searchStr } },
            { indication: { contains: searchStr } },
            { moa: { contains: searchStr } },
          ];
        }
      }

      medicines = await prisma.medicine.findMany({ where: whereClause });

      if (dataset) {
        medicines = medicines.filter((med) => {
          try {
            const additional = JSON.parse(med.additionalData || '{}');
            return additional.dataset === dataset;
          } catch {
            return false;
          }
        });
      }

      if (hasCountryFilter) {
        medicines = medicines.filter((med) => {
          try {
            const additional = JSON.parse(med.additionalData || '{}');
            const medCountry = additional.country || 'US';
            return selectedCountries.includes(medCountry);
          } catch {
            return false;
          }
        });
      }

      if (hasDiseaseFilter) {
        medicines = medicines.filter((med) => {
          return selectedDiseases.some(d => med.indication.toLowerCase().includes(d.toLowerCase()));
        });
      }
    }
    
    const exportSize = medicines.length;
    if (user.downloadCount + exportSize > 2000) {
      return res.status(429).json({
        message: `This download contains ${exportSize} records, which would exceed your remaining quota of ${2000 - user.downloadCount} records.`,
      });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        downloadCount: {
          increment: exportSize,
        },
      },
    });

    let csvContent = 'Drug Name,Indication,Mechanism of Action,Development Phase,Sponsor,Country,Route,Target,Trial Status,Estimated Trial Completion\n';
    
    medicines.forEach((med) => {
      let additional: any = {};
      try {
        additional = JSON.parse(med.additionalData || '{}');
      } catch {
        additional = {};
      }
      const row = [
        `"${med.drugName.replace(/"/g, '""')}"`,
        `"${med.indication.replace(/"/g, '""')}"`,
        `"${med.moa.replace(/"/g, '""')}"`,
        `"${(additional.phase || 'N/A').replace(/"/g, '""')}"`,
        `"${(additional.sponsor || 'N/A').replace(/"/g, '""')}"`,
        `"${(additional.country || 'N/A').replace(/"/g, '""')}"`,
        `"${(additional.route || 'N/A').replace(/"/g, '""')}"`,
        `"${(additional.target || 'N/A').replace(/"/g, '""')}"`,
        `"${(additional.status || 'N/A').replace(/"/g, '""')}"`,
        `"${(additional.completionDate || 'N/A').replace(/"/g, '""')}"`,
      ];
      csvContent += row.join(',') + '\n';
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=medtrack_export_${Date.now()}.csv`);
    return res.status(200).send(csvContent);
  } catch (error) {
    console.error('Download error:', error);
    return res.status(500).json({ message: 'Error compiling CSV file' });
  }
};

export const getSuggestions = async (req: Request, res: Response) => {
  try {
    const { query } = req.query;
    if (!query || query.toString().trim() === '') {
      return res.status(200).json({ suggestions: [] });
    }
    const searchStr = query.toString().trim().toLowerCase();
    
    let suggestions: Array<{ type: 'medicine' | 'disease' | 'country', text: string }> = [];
    
    // 1. Predefined Country suggestions
    const ALL_COUNTRIES = ['US', 'EU', 'Japan', 'Canada', 'Korea', 'India', 'Aus/NZ'];
    ALL_COUNTRIES.forEach(c => {
      if (c.toLowerCase().includes(searchStr)) {
        suggestions.push({ type: 'country', text: c });
      }
    });
    
    // 2. Predefined Disease suggestions
    const DISEASES = ['Fever', 'Cold/Cough', 'Asthma'];
    DISEASES.forEach(d => {
      if (d.toLowerCase().includes(searchStr)) {
        suggestions.push({ type: 'disease', text: d });
      }
    });

    // 3. Database Medicine (name & other indications) suggestions
    const matchedMedicines = await prisma.medicine.findMany({
      where: {
        OR: [
          { drugName: { contains: searchStr, mode: 'insensitive' } },
          { indication: { contains: searchStr, mode: 'insensitive' } }
        ]
      },
      take: 20
    });
    
    const drugNames = new Set<string>();
    const otherDiseases = new Set<string>();
    
    matchedMedicines.forEach(m => {
      if (m.drugName.toLowerCase().includes(searchStr)) {
        drugNames.add(m.drugName);
      }
      if (m.indication.toLowerCase().includes(searchStr)) {
        otherDiseases.add(m.indication);
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
    
    // Deduplicate suggestions (by type & text combo) and cap at 10 items
    const seen = new Set();
    const uniqueSuggestions = suggestions.filter(s => {
      const key = `${s.type}:${s.text.toLowerCase()}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }).slice(0, 10);
    
    return res.status(200).json({ suggestions: uniqueSuggestions });
  } catch (error) {
    console.error('Suggestions error:', error);
    return res.status(500).json({ message: 'Error fetching suggestions' });
  }
};
