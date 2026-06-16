import { Request, Response } from 'express';
import { prisma } from '../config/prisma';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { verifyAccessToken } from '../utils/jwt';

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
    const { query, field, dataset, page = '1', limit = '10' } = req.query;
    const isSubscribed = await checkSubscriptionStatus(req);

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    // Build Prisma filtering logic
    const whereClause: any = {};

    // Search query: Drug name, Indication, or MOA
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

    // Fetch all matched rows
    let medicines = await prisma.medicine.findMany({
      where: whereClause,
      orderBy: { drugName: 'asc' },
    });

    // In-memory dataset filter (compatible with SQLite JSON strings)
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

    // In-memory pagination slicing
    const total = medicines.length;
    const paginatedMedicines = medicines.slice(skip, skip + limitNum);

    // Scrub details columns from result list if user is a guest/non-subscriber
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

    const { query, field, dataset } = req.query;
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

    let medicines = await prisma.medicine.findMany({ where: whereClause });

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
