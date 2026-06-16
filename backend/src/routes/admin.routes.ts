import { Router } from 'express';
import multer from 'multer';
import { uploadMedicineSheet, postDemoRequest, postContactMessage, getStats, deleteMedicine, clearAllMedicines } from '../controllers/admin.controller';

const router = Router();

// Multer memoryStorage holds the uploaded file in memory buffer so we can parse it on-the-fly
// rather than writing temporary files to local disk. This keeps backend filesystems clean.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

// Admin upload spreadsheet endpoint
router.post('/upload', upload.single('file'), uploadMedicineSheet);

// Clear whole catalog database tables
router.post('/clear', clearAllMedicines);

// Selective deletion endpoint
router.delete('/medicine/:id', deleteMedicine);

// Forms submission pipelines
router.post('/demo', postDemoRequest);
router.post('/contact', postContactMessage);

// Stats retrieval dashboard metrics API
router.get('/stats', getStats);

export default router;
export { router as adminRoutes };
