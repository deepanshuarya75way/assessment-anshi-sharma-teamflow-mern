const express = require('express');
const router = express.Router();
const {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
} = require('../controllers/projectController');
const {
  getTasks,
  createTask,
  getProjectActivities,
} = require('../controllers/taskController');
const { generateProjectSummary } = require('../controllers/aiController');
const { protect, authorize } = require('../middleware/authMiddleware');

router
  .route('/')
  .get(protect, getProjects)
  .post(protect, authorize('admin', 'manager'), createProject);

router
  .route('/:id')
  .get(protect, getProjectById)
  .put(protect, authorize('admin', 'manager'), updateProject)
  .delete(protect, authorize('admin'), deleteProject);

// Nested routes for tasks under a project
router
  .route('/:projectId/tasks')
  .get(protect, getTasks)
  .post(protect, authorize('admin', 'manager'), createTask);

// Project activities
router.get('/:projectId/activities', protect, getProjectActivities);

// AI progress summary
router.post('/:projectId/ai-summary', protect, generateProjectSummary);

module.exports = router;
