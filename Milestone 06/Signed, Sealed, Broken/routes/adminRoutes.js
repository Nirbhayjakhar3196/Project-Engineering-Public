const express = require('express');
const router = express.Router();
const { getAllUsers, deleteUser } = require('../controllers/adminController');
const authMidlleware = require("../middleware/authMiddleware")

// ❌ Bug 4: Admin routes are completely unprotected
router.get('/admin/users',  authMidlleware,getAllUsers);             // ❌ no authMiddleware at all
router.delete('/admin/users/:id',authMidlleware, deleteUser);       // ❌ no authMiddleware at all

module.exports = router;
