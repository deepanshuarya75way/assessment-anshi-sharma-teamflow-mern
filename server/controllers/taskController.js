const Task = require('../models/Task');
const Project = require('../models/Project');
const Activity = require('../models/Activity');
const { getIO } = require('../socket/socketHandler');

// @desc    Get tasks for a project with search, filter, and pagination
// @route   GET /api/projects/:projectId/tasks
// @access  Private
const getTasks = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { search, status, priority, assignee, sortBy = 'order', sortOrder = 'asc', page, limit } = req.query;

    const query = { project: projectId };

    // Status filter
    if (status && status !== 'all') {
      query.status = status;
    }

    // Priority filter
    if (priority && priority !== 'all') {
      query.priority = priority;
    }

    // Assignee filter
    if (assignee && assignee !== 'all') {
      query.assignee = assignee;
    }

    // Search query on title and description
    if (search && search.trim() !== '') {
      query.$or = [
        { title: { $regex: search.trim(), $options: 'i' } },
        { description: { $regex: search.trim(), $options: 'i' } },
        { tags: { $in: [new RegExp(search.trim(), 'i')] } },
      ];
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    let tasksQuery = Task.find(query)
      .populate('assignee', 'name email role department avatar')
      .populate('creator', 'name email role department avatar')
      .populate('comments.user', 'name email role department avatar')
      .sort(sortOptions);

    // Optional Pagination (if page & limit provided)
    if (page && limit) {
      const pageNum = parseInt(page, 10) || 1;
      const limitNum = parseInt(limit, 10) || 10;
      const startIndex = (pageNum - 1) * limitNum;
      const total = await Task.countDocuments(query);

      tasksQuery = tasksQuery.skip(startIndex).limit(limitNum);
      const tasks = await tasksQuery;

      return res.status(200).json({
        success: true,
        count: tasks.length,
        total,
        totalPages: Math.ceil(total / limitNum),
        currentPage: pageNum,
        data: tasks,
      });
    }

    const tasks = await tasksQuery;

    res.status(200).json({
      success: true,
      count: tasks.length,
      data: tasks,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single task by ID
// @route   GET /api/tasks/:id
// @access  Private
const getTaskById = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('project', 'name key')
      .populate('assignee', 'name email role department avatar')
      .populate('creator', 'name email role department avatar')
      .populate('comments.user', 'name email role department avatar');

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }
    // conflict detection for offline sync
    if (req.body.lastKnownUpdatedAt && !req.body.force) {
      const clientTimestamp = new Date(req.body.lastKnownUpdatedAt).getTime();
      
    }

    res.status(200).json({
      success: true,
      data: task,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new task
// @route   POST /api/projects/:projectId/tasks
// @access  Private (Admin / Manager)
const createTask = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { title, description, status, priority, assignee, dueDate, tags } = req.body;

    if (!title) {
      return res.status(400).json({
        success: false,
        message: 'Task title is required',
      });
    }

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Target project not found',
      });
    }

    // Role check: Only admin and manager can create tasks
    if (req.user.role === 'member') {
      return res.status(403).json({
        success: false,
        message: 'Only managers and admins can create new tasks',
      });
    }

    // Determine current order for placement in column
    const highestOrderTask = await Task.findOne({
      project: projectId,
      status: status || 'todo',
    }).sort({ order: -1 });

    const nextOrder = highestOrderTask ? highestOrderTask.order + 1 : 0;

    const task = await Task.create({
      title,
      description: description || '',
      project: projectId,
      status: status || 'todo',
      priority: priority || 'medium',
      assignee: assignee || null,
      creator: req.user._id,
      dueDate: dueDate || null,
      tags: tags || [],
      order: nextOrder,
    });

    // Log Activity
    await Activity.create({
      project: projectId,
      task: task._id,
      user: req.user._id,
      action: 'created_task',
      details: `${req.user.name} created task "${task.title}"`,
    });

    const populatedTask = await Task.findById(task._id)
      .populate('assignee', 'name email role department avatar')
      .populate('creator', 'name email role department avatar')
      .populate('comments.user', 'name email role department avatar');

    try {
      getIO().to(`project:${projectId}`).emit('task:created', populatedTask);
    } catch (e) {}

    res.status(201).json({
      success: true,
      data: populatedTask,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update task details
// @route   PUT /api/tasks/:id
// @access  Private
const updateTask = async (req, res, next) => {
  try {
    let task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    // offline sync
    if(req.body.lastKnownUpdatedAt && !req.body.force) {
      const clientTimestamp = new Date(req.body.lastKnownUpdatedAt).getTime();
      const serverTimestamp = new Date(task.UpdatedAt).getTime();
      if (serverTimestamp - clientTimestamp > 1000) {
        const currentTask = await Task.findById(task._id)
          .populate('assignee','name email role department avatar')
          .populate('creator','name email role department avatar')
          .populate('comments.user','name email role department avatar');
        return res.status(409).json({
          success: false,
          conflict: true,
          message: 'Conflict detected: Task status was modified on the server since you went offline.',
          serverTask: currentTask,
        });
      }

    }

    // RBAC: Members can only update status and comments on tasks, not delete or edit title/assignee unless assigned
    if (req.user.role === 'member') {
      const isAssigned = task.assignee && task.assignee.toString() === req.user._id.toString();
      if (!isAssigned) {
        return res.status(403).json({
          success: false,
          message: 'Members can only modify tasks assigned to them',
        });
      }
    }

    const prevStatus = task.status;
    const newStatus = req.body.status;

    task = await Task.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    })
      .populate('assignee', 'name email role department avatar')
      .populate('creator', 'name email role department avatar')
      .populate('comments.user', 'name email role department avatar');

    // If status changed, log explicit move activity
    if (newStatus && prevStatus !== newStatus) {
      await Activity.create({
        project: task.project,
        task: task._id,
        user: req.user._id,
        action: 'moved_task',
        details: `${req.user.name} moved "${task.title}" from ${prevStatus.toUpperCase()} to ${newStatus.toUpperCase()}`,
      });
    } else {
      await Activity.create({
        project: task.project,
        task: task._id,
        user: req.user._id,
        action: 'updated_task',
        details: `${req.user.name} updated "${task.title}"`,
      });
    }

    try {
      getIO().to(`project:${task.project}`).emit('task:updated', task);
    } catch (e) {}

    res.status(200).json({
      success: true,
      data: task,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update task status (drag & drop handler)
// @route   PATCH /api/tasks/:id/status
// @access  Private
const updateTaskStatus = async (req, res, next) => {
  try {
    const { status, order } = req.body;

    if (!status || !['todo', 'in-progress', 'in-review', 'done'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Valid status is required (todo, in-progress, in-review, done)',
      });
    }

    let task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    const oldStatus = task.status;
    task.status = status;
    if (order !== undefined) task.order = order;
    await task.save();

    await Activity.create({
      project: task.project,
      task: task._id,
      user: req.user._id,
      action: 'moved_task',
      details: `${req.user.name} moved task to ${status.toUpperCase()}`,
    });

    const populatedTask = await Task.findById(task._id)
      .populate('assignee', 'name email role department avatar')
      .populate('creator', 'name email role department avatar')
      .populate('comments.user', 'name email role department avatar');

    try {
      getIO().to(`project:${task.project}`).emit('task:status_changed', {
        taskId: task._id,
        oldStatus,
        newStatus: status,
        task: populatedTask,
      });
    } catch (e) {}

    res.status(200).json({
      success: true,
      data: populatedTask,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete task
// @route   DELETE /api/tasks/:id
// @access  Private (Admin / Manager)
const deleteTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    if (req.user.role === 'member') {
      return res.status(403).json({
        success: false,
        message: 'Members are not authorized to delete tasks',
      });
    }

    const projectId = task.project;
    const taskTitle = task.title;

    await Activity.deleteMany({ task: task._id });
    await Task.findByIdAndDelete(req.params.id);

    await Activity.create({
      project: projectId,
      user: req.user._id,
      action: 'deleted_task',
      details: `${req.user.name} deleted task "${taskTitle}"`,
    });

    try {
      getIO().to(`project:${projectId}`).emit('task:deleted', {
        taskId: req.params.id,
        projectId,
      });
    } catch (e) {}

    res.status(200).json({
      success: true,
      message: 'Task removed successfully',
      data: { id: req.params.id, projectId },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add comment to task
// @route   POST /api/tasks/:id/comments
// @access  Private
const addComment = async (req, res, next) => {
  try {
    const { text } = req.body;

    if (!text || text.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Comment text cannot be empty',
      });
    }

    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    task.comments.push({
      user: req.user._id,
      text: text.trim(),
      createdAt: new Date(),
    });

    await task.save();

    await Activity.create({
      project: task.project,
      task: task._id,
      user: req.user._id,
      action: 'commented',
      details: `${req.user.name} commented on "${task.title}"`,
    });

    const populatedTask = await Task.findById(task._id)
      .populate('assignee', 'name email role department avatar')
      .populate('creator', 'name email role department avatar')
      .populate('comments.user', 'name email role department avatar');

    try {
      getIO().to(`project:${task.project}`).emit('task:comment_added', {
        taskId: task._id,
        comments: populatedTask.comments,
      });
    } catch (e) {}

    res.status(201).json({
      success: true,
      data: populatedTask.comments,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get project activity history
// @route   GET /api/projects/:projectId/activities
// @access  Private
const getProjectActivities = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const activities = await Activity.find({ project: projectId })
      .populate('user', 'name email role department avatar')
      .sort({ createdAt: -1 })
      .limit(50);

    res.status(200).json({
      success: true,
      count: activities.length,
      data: activities,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  updateTaskStatus,
  deleteTask,
  addComment,
  getProjectActivities,
};
