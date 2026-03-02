const express = require('express');
const {register, login, getMe, logout} = require('../controllers/auth');
const router = express.Router();

// Check Permission
const {protect} = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.get('/logout', protect, logout); // ควร require ว่าต้อง login ก่อนถึงจะ logout ได้

module.exports = router;