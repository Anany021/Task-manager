const express = require('express');
const { listUsers, updateRole } = require('../controllers/userController');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/role');

const router = express.Router();

router.use(authenticate);

router.get('/', listUsers);
router.put('/:id/role', requireRole('admin'), updateRole);

module.exports = router;
