const express = require('express');
const router = express.Router();
const {
  getTaskById,
  updateTask,
  updateTaskStatus,
  deleteTask,
  addComment,
} = require('../controllers/taskController');
const { protect, authorize } = require('../middleware/authMiddleware');

router
  .route('/:id')
  .get(protect, getTaskById)
  .put(protect, updateTask)
  .delete(protect, authorize('admin', 'manager'), deleteTask);

router.patch('/:id/status', protect, updateTaskStatus);
router.post('/:id/comments', protect, addComment);

module.exports = router;
