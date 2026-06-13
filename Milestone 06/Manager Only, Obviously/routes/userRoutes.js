import express from 'express';
import { getAllUsers, updateUserRole, getUserProfile } from '../controllers/userController.js';
import { protect } from '../middleware/authMiddleware.js';
import { requireRole } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.get('/', protect, requireRole('admin') ,  getAllUsers);          // ❌ should be admin-only
router.put('/:id/role', protect,requireRole('admin'), updateUserRole); // ❌ should be admin-only
router.get('/me', protect, getUserProfile);

export default router;
