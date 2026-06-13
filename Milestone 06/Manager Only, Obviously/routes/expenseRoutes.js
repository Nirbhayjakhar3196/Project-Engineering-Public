import express from 'express';
import { 
  getAllExpenses, 
  getMyExpenses, 
  createExpense, 
  updateExpense, 
  approveExpense, 
  rejectExpense, 
  deleteExpense 
} from '../controllers/expenseController.js';
import { protect } from '../middleware/authMiddleware.js';
import { requireRole } from '../middleware/roleMiddleware.js';

const router = express.Router();
// const Role = require("../middleware/roleMiddleware.js")

router.get('/', protect, requireRole('manager' , 'admin') ,  getAllExpenses);           // ❌ should be manager+
router.get('/mine', protect, getMyExpenses);
router.post('/', protect, createExpense);
router.put('/:id', protect, updateExpense);
router.put('/:id/approve', protect, requireRole('manager' , 'admin') ,approveExpense); // ❌ should be manager+
router.put('/:id/reject', protect,requireRole('manager' , 'admin'), rejectExpense);   // ❌ should be manager+
router.delete('/:id', protect, requireRole('admin') , deleteExpense);      // ❌ should be admin-only

export default router;
