const express = require('express');
const { body } = require('express-validator');
const {
  listProjects,
  createProject,
  getProject,
  updateProject,
  deleteProject,
} = require('../controllers/projectController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

router.get('/', listProjects);
router.post(
  '/',
  [
    body('name').isString().trim().isLength({ min: 1, max: 120 }),
    body('description').optional().isString().isLength({ max: 1000 }),
    body('members').optional().isArray(),
  ],
  createProject
);
router.get('/:id', getProject);
router.put('/:id', updateProject);
router.delete('/:id', deleteProject);

module.exports = router;
