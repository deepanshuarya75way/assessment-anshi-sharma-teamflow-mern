const Project = require('../models/Project');
const Task = require('../models/Task');
const Activity = require('../models/Activity');
const { getIO } = require('../socket/socketHandler');

// @desc    Get all accessible projects
// @route   GET /api/projects
// @access  Private
const getProjects = async (req, res, next) => {
  try {
    let query = {};

    // Non-admin users only see projects they own or are members of
    if (req.user.role !== 'admin') {
      query = {
        $or: [{ owner: req.user._id }, { members: req.user._id }],
      };
    }

    const projects = await Project.find(query)
      .populate('owner', 'name email role department')
      .populate('members', 'name email role department')
      .sort({ updatedAt: -1 });

    // Attach task metrics to each project for rich dashboard overview
    const projectsWithMetrics = await Promise.all(
      projects.map(async (project) => {
        const totalTasks = await Task.countDocuments({ project: project._id });
        const doneTasks = await Task.countDocuments({
          project: project._id,
          status: 'done',
        });
        const inProgressTasks = await Task.countDocuments({
          project: project._id,
          status: 'in-progress',
        });
        const overdueTasks = await Task.countDocuments({
          project: project._id,
          status: { $ne: 'done' },
          dueDate: { $lt: new Date() },
        });

        const projectObj = project.toObject();
        projectObj.taskMetrics = {
          total: totalTasks,
          done: doneTasks,
          inProgress: inProgressTasks,
          overdue: overdueTasks,
          completionRate: totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0,
        };
        return projectObj;
      })
    );

    res.status(200).json({
      success: true,
      count: projectsWithMetrics.length,
      data: projectsWithMetrics,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single project by ID
// @route   GET /api/projects/:id
// @access  Private
const getProjectById = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('owner', 'name email role department')
      .populate('members', 'name email role department');

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found with provided ID',
      });
    }

    // Check authorization: must be admin or associated with project
    const isMemberOrOwner =
      project.owner._id.toString() === req.user._id.toString() ||
      project.members.some((m) => m._id.toString() === req.user._id.toString());

    if (req.user.role !== 'admin' && !isMemberOrOwner) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You do not have access to view this project',
      });
    }

    // Metrics
    const totalTasks = await Task.countDocuments({ project: project._id });
    const doneTasks = await Task.countDocuments({ project: project._id, status: 'done' });
    const projectObj = project.toObject();
    projectObj.taskMetrics = {
      total: totalTasks,
      done: doneTasks,
      completionRate: totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0,
    };

    res.status(200).json({
      success: true,
      data: projectObj,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new project
// @route   POST /api/projects
// @access  Private (Admin / Manager)
const createProject = async (req, res, next) => {
  try {
    const { name, description, key, priority, deadline, color, members } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Project name is required',
      });
    }

    // Ensure owner is included in members
    let memberList = members || [];
    if (!memberList.includes(req.user._id.toString())) {
      memberList.push(req.user._id);
    }

    const project = await Project.create({
      name,
      description: description || '',
      key: (key || name.substring(0, 4)).toUpperCase(),
      priority: priority || 'medium',
      deadline: deadline || null,
      color: color || '#6366f1',
      owner: req.user._id,
      members: memberList,
    });

    await Activity.create({
      project: project._id,
      user: req.user._id,
      action: 'created_project',
      details: `${req.user.name} created project "${project.name}"`,
    });

    const populatedProject = await Project.findById(project._id)
      .populate('owner', 'name email role department')
      .populate('members', 'name email role department');

    // Real-time broadcast
    try {
      getIO().emit('project:created', populatedProject);
    } catch (e) {}

    res.status(201).json({
      success: true,
      data: populatedProject,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update project
// @route   PUT /api/projects/:id
// @access  Private (Admin / Manager)
const updateProject = async (req, res, next) => {
  try {
    let project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }

    // Check ownership or admin
    if (
      req.user.role !== 'admin' &&
      project.owner.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: 'Only the project owner or an admin can update this project',
      });
    }

    project = await Project.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    })
      .populate('owner', 'name email role department')
      .populate('members', 'name email role department');

    await Activity.create({
      project: project._id,
      user: req.user._id,
      action: 'updated_project',
      details: `${req.user.name} updated project details`,
    });

    try {
      getIO().emit('project:updated', project);
    } catch (e) {}

    res.status(200).json({
      success: true,
      data: project,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete project
// @route   DELETE /api/projects/:id
// @access  Private (Admin only)
const deleteProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }

    await Task.deleteMany({ project: project._id });
    await Activity.deleteMany({ project: project._id });
    await Project.findByIdAndDelete(req.params.id);

    try {
      getIO().emit('project:deleted', { projectId: req.params.id });
    } catch (e) {}

    res.status(200).json({
      success: true,
      message: 'Project and all associated tasks removed successfully',
      data: { id: req.params.id },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
};
