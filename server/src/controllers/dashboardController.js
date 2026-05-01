const Project = require('../models/Project');
const Task = require('../models/Task');

// GET /api/dashboard
async function getDashboard(req, res, next) {
  try {
    // Projects user can access
    const projectFilter =
      req.user.role === 'admin'
        ? {}
        : { $or: [{ owner: req.user._id }, { members: req.user._id }] };

    const projects = await Project.find(projectFilter, '_id');
    const projectIds = projects.map((p) => p._id);

    const baseTaskFilter = { project: { $in: projectIds } };

    const [
      totalTasks,
      todoCount,
      inProgressCount,
      doneCount,
      myTasks,
      overdueTasks,
      recentTasks,
    ] = await Promise.all([
      Task.countDocuments(baseTaskFilter),
      Task.countDocuments({ ...baseTaskFilter, status: 'todo' }),
      Task.countDocuments({ ...baseTaskFilter, status: 'in_progress' }),
      Task.countDocuments({ ...baseTaskFilter, status: 'done' }),
      Task.find({ ...baseTaskFilter, assignedTo: req.user._id })
        .populate('project', 'name')
        .sort({ dueDate: 1 })
        .limit(10),
      Task.find({
        ...baseTaskFilter,
        status: { $ne: 'done' },
        dueDate: { $ne: null, $lt: new Date() },
      })
        .populate('project', 'name')
        .populate('assignedTo', 'name email')
        .sort({ dueDate: 1 })
        .limit(20),
      Task.find(baseTaskFilter)
        .populate('project', 'name')
        .populate('assignedTo', 'name email')
        .sort({ updatedAt: -1 })
        .limit(10),
    ]);

    res.json({
      stats: {
        totalProjects: projectIds.length,
        totalTasks,
        todo: todoCount,
        inProgress: inProgressCount,
        done: doneCount,
        overdue: overdueTasks.length,
      },
      myTasks,
      overdueTasks,
      recentTasks,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { getDashboard };
