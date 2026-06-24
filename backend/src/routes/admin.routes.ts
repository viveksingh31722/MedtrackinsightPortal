import { Router } from 'express';
import multer from 'multer';
import { uploadMedicineSheet, postDemoRequest, postContactMessage, getStats, deleteMedicine, clearAllMedicines } from '../controllers/admin.controller';
import { authenticateJWT } from '../middleware/auth.middleware';
import { requireAdmin } from '../middleware/admin.middleware';

const router = Router();

// Multer memoryStorage holds the uploaded file in memory buffer so we can parse it on-the-fly
// rather than writing temporary files to local disk. This keeps backend filesystems clean.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

// Admin upload spreadsheet endpoint - PROTECTED
router.post('/upload', authenticateJWT, requireAdmin, upload.single('file'), uploadMedicineSheet);

// Clear whole catalog database tables - PROTECTED
router.post('/clear', authenticateJWT, requireAdmin, clearAllMedicines);

// Selective deletion endpoint - PROTECTED
router.delete('/medicine/:id', authenticateJWT, requireAdmin, deleteMedicine);

// Forms submission pipelines (PUBLIC)
router.post('/demo', postDemoRequest);
router.post('/contact', postContactMessage);

// Stats retrieval dashboard metrics API - PROTECTED
router.get('/stats', authenticateJWT, requireAdmin, getStats);

export default router;
export { router as adminRoutes };
