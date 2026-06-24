import { Router } from 'express';
import { searchMedicines, getMedicineById, downloadMedicines, getSuggestions, getMedicineAnalysis } from '../controllers/medicine.controller';
import { authenticateJWT } from '../middleware/auth.middleware';

const router = Router();

// Search autocomplete suggestions
router.get('/suggestions', getSuggestions);

// Analysis aggregation endpoints
router.get('/analysis', getMedicineAnalysis);

// Medicine listing and search - Public access with dynamic subscription columns masking
router.get('/search', searchMedicines);

// Retrieve details for a single molecule profile
router.get('/detail/:id', getMedicineById);

// Export/Download search results - requires authentication and quota verification
router.get('/download', authenticateJWT, downloadMedicines);

export default router;
export { router as medicineRoutes };
