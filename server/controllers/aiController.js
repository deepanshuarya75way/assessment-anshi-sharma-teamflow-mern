const Project = require('../models/Project');
const Task = require('../models/Task');
const Activity = require('../models/Activity');

// @desc    Generate AI Project Progress Summary
// @route   POST /api/projects/:projectId/ai-summary
// @access  Private
const generateProjectSummary = async (req, res, next) => {
  try {
    const { projectId } = req.params;

    const project = await Project.findById(projectId)
      .populate('owner', 'name email role')
      .populate('members', 'name email role department');

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }

    const tasks = await Task.find({ project: projectId }).populate(
      'assignee',
      'name email department'
    );
    const activities = await Activity.find({ project: projectId })
      .sort({ createdAt: -1 })
      .limit(10);

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((t) => t.status === 'done');
    const inProgressTasks = tasks.filter((t) => t.status === 'in-progress');
    const inReviewTasks = tasks.filter((t) => t.status === 'in-review');
    const todoTasks = tasks.filter((t) => t.status === 'todo');

    const now = new Date();
    const overdueTasks = tasks.filter(
      (t) => t.status !== 'done' && t.dueDate && new Date(t.dueDate) < now
    );
    const urgentTasks = tasks.filter(
      (t) => t.priority === 'urgent' && t.status !== 'done'
    );
    const highTasks = tasks.filter(
      (t) => t.priority === 'high' && t.status !== 'done'
    );

    const completionRate =
      totalTasks > 0 ? Math.round((completedTasks.length / totalTasks) * 100) : 0;

    // Calculate Health Score (weighted calculation)
    let healthScore = 100;
    if (totalTasks === 0) {
      healthScore = 50;
    } else {
      const overduePenalty = Math.min(35, overdueTasks.length * 15);
      const urgentPendingPenalty = Math.min(25, urgentTasks.length * 10);
      const progressBonus = Math.round(completionRate * 0.3);
      healthScore = Math.max(
        15,
        Math.min(100, 70 - overduePenalty - urgentPendingPenalty + progressBonus)
      );
    }

    let healthStatus = 'On Track';
    let healthBadgeColor = '#10b981'; // green
    if (healthScore < 50) {
      healthStatus = 'At Critical Risk';
      healthBadgeColor = '#ef4444'; // red
    } else if (healthScore < 75) {
      healthStatus = 'Needs Attention';
      healthBadgeColor = '#f59e0b'; // amber
    }

    // Identify active contributors
    const contributorMap = {};
    tasks.forEach((t) => {
      if (t.assignee) {
        contributorMap[t.assignee.name] = (contributorMap[t.assignee.name] || 0) + 1;
      }
    });

    // Generate intelligent AI recommendations
    const recommendations = [];
    if (overdueTasks.length > 0) {
      recommendations.push(
        `Address ${overdueTasks.length} overdue task(s) immediately, focusing on "${overdueTasks[0].title}".`
      );
    }
    if (urgentTasks.length > 0) {
      recommendations.push(
        `Resolve high-priority blocker "${urgentTasks[0].title}" to unblock downstream milestones.`
      );
    }
    if (inReviewTasks.length >= 3) {
      recommendations.push(
        `Code Review bottleneck detected: ${inReviewTasks.length} items are pending peer approval.`
      );
    }
    if (todoTasks.length > inProgressTasks.length * 2 && inProgressTasks.length > 0) {
      recommendations.push(
        `Backlog is building up (${todoTasks.length} queued). Consider holding a sprint refinement session.`
      );
    }
    if (recommendations.length === 0) {
      recommendations.push(
        'Sprint momentum is healthy. Maintain velocity and prepare deployment checklists.'
      );
    }

    // AI Executive Narrative
    const executiveSummary = `Project "${project.name}" is currently ${healthStatus.toUpperCase()} with an overall completion rate of ${completionRate}% across ${totalTasks} tracked work items. ${completedTasks.length} tasks are finalized, while ${inProgressTasks.length} are actively being implemented. ${
      overdueTasks.length > 0
        ? `Attention is urgently required on ${overdueTasks.length} overdue item(s).`
        : 'Milestones are moving forward in alignment with the target schedule.'
    }`;

    // Sprint Velocity Assessment
    const velocityAssessment = {
      throughput: `${completedTasks.length} / ${totalTasks} deliverables done`,
      activeWIP: inProgressTasks.length,
      reviewQueue: inReviewTasks.length,
      riskLevel: overdueTasks.length > 0 || urgentTasks.length > 1 ? 'Elevated' : 'Low',
    };

    res.status(200).json({
      success: true,
      data: {
        projectName: project.name,
        healthScore,
        healthStatus,
        healthBadgeColor,
        completionRate,
        executiveSummary,
        velocityAssessment,
        stats: {
          total: totalTasks,
          todo: todoTasks.length,
          inProgress: inProgressTasks.length,
          inReview: inReviewTasks.length,
          done: completedTasks.length,
          overdue: overdueTasks.length,
          urgent: urgentTasks.length,
        },
        recommendations,
        topOverdueTasks: overdueTasks.slice(0, 3).map((t) => ({
          title: t.title,
          dueDate: t.dueDate,
          assignee: t.assignee ? t.assignee.name : 'Unassigned',
        })),
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  generateProjectSummary,
};
