import { Request, Response } from 'express';
import xlsx from 'xlsx';
import { prisma } from '../config/prisma';

export const uploadMedicineSheet = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No spreadsheet file uploaded.' });
    }

    const { mode = 'append' } = req.body; // Modes: 'clear' (overwrite), 'append', 'upsert' (update existing)

    // Read upload buffer
    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Parse to JSON array
    const rawRows = xlsx.utils.sheet_to_json<any>(worksheet);

    if (rawRows.length === 0) {
      return res.status(400).json({ message: 'Spreadsheet contains no rows.' });
    }

    // 1. Overwrite Mode: Delete all data before upload
    if (mode === 'clear') {
      await prisma.medicine.deleteMany({});
      console.log('Database catalog cleared before overwrite batch.');
    }

    let createdCount = 0;
    let updatedCount = 0;

    if (mode === 'upsert') {
      // 2. Upsert Mode: Iterate and update existing matching records or insert new ones
      for (const row of rawRows) {
        const drugName = String(row['drugName'] || row['Drug Name'] || row['Drug'] || '').trim();
        const indication = String(row['indication'] || row['Indication'] || 'Not Specified').trim();
        const moa = String(row['moa'] || row['Mechanism of Action'] || row['MOA'] || 'Not Specified').trim();

        if (!drugName) continue;

        const additionalData = {
          ...row,
          drugName,
          indication,
          moa,
          phase: row['phase'] || row['Phase'] || row['Development Phase'] || 'Phase I',
          dataset: row['dataset'] || row['Dataset'] || row['Source File'] || 'Global FDA Register',
        };

        // Check if a molecule with the same name already exists in the database
        const existingMedicine = await prisma.medicine.findFirst({
          where: { drugName: { equals: drugName } },
        });

        if (existingMedicine) {
          // Update details in-place
          await prisma.medicine.update({
            where: { id: existingMedicine.id },
            data: {
              indication,
              moa,
              additionalData: JSON.stringify(additionalData),
            },
          });
          updatedCount++;
        } else {
          // Insert new record
          await prisma.medicine.create({
            data: {
              drugName,
              indication,
              moa,
              additionalData: JSON.stringify(additionalData),
            },
          });
          createdCount++;
        }
      }
    } else {
      // 3. Append / Overwrite Mode: Insert everything in bulk
      const recordsToInsert = rawRows.map((row) => {
        const drugName = String(row['drugName'] || row['Drug Name'] || row['Drug'] || 'Unnamed Drug').trim();
        const indication = String(row['indication'] || row['Indication'] || 'Not Specified').trim();
        const moa = String(row['moa'] || row['Mechanism of Action'] || row['MOA'] || 'Not Specified').trim();

        const additionalData = {
          ...row,
          drugName,
          indication,
          moa,
          phase: row['phase'] || row['Phase'] || row['Development Phase'] || 'Phase I',
          dataset: row['dataset'] || row['Dataset'] || row['Source File'] || 'Global FDA Register',
        };

        return {
          drugName,
          indication,
          moa,
          additionalData: JSON.stringify(additionalData),
        };
      });

      const created = await prisma.medicine.createMany({
        data: recordsToInsert,
      });
      createdCount = created.count;
    }

    let completionMessage = '';
    if (mode === 'upsert') {
      completionMessage = `Upsert complete. Updated ${updatedCount} existing records and inserted ${createdCount} new rows.`;
    } else if (mode === 'clear') {
      completionMessage = `Overwrite complete. Wiped database and inserted ${createdCount} records.`;
    } else {
      completionMessage = `Append complete. Appended ${createdCount} new records to database.`;
    }

    return res.status(200).json({
      message: completionMessage,
      recordsCount: createdCount + updatedCount,
    });
  } catch (error) {
    console.error('File import error:', error);
    return res.status(500).json({ message: 'Error processing database update sheet.' });
  }
};

// Selective Deletion API
export const deleteMedicine = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Verify record exists before deletion
    const existing = await prisma.medicine.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ message: 'Record not found' });
    }

    await prisma.medicine.delete({
      where: { id },
    });

    return res.status(200).json({ message: `Successfully deleted molecule: ${existing.drugName}` });
  } catch (error) {
    console.error('Delete medicine error:', error);
    return res.status(500).json({ message: 'Error deleting database record' });
  }
};

// Clear All Data API (Separate endpoint for absolute catalog reset)
export const clearAllMedicines = async (req: Request, res: Response) => {
  try {
    const deleted = await prisma.medicine.deleteMany({});
    return res.status(200).json({ message: `Successfully cleared all data. ${deleted.count} records removed.` });
  } catch (error) {
    console.error('Clear catalog error:', error);
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

    return res.status(201).json({ message: 'Your demo request has been successfully registered.' });
  } catch (error) {
    console.error('Demo request submission error:', error);
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

    return res.status(201).json({ message: 'Message recorded successfully.' });
  } catch (error) {
    console.error('Contact message error:', error);
    return res.status(500).json({ message: 'Error registering message.' });
  }
};

export const getStats = async (req: Request, res: Response) => {
  try {
    const totalMedicines = await prisma.medicine.count();
    const totalUsers = await prisma.user.count();
    const totalDemos = await prisma.demoRequest.count();
    return res.status(200).json({
      totalMedicines,
      totalUsers,
      totalDemos,
    });
  } catch (err) {
    return res.status(500).json({ message: 'Error fetching stats' });
  }
};
