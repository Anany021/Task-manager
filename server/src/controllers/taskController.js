const { validationResult } = require('express-validator');
const mongoose = require('mongoose');
const Task = require('../models/Task');
const Project = require('../models/Project');

async function ensureProjectAccess(projectId, user) {
  const project = await Project.findById(projectId);
  if (!project) return { error: { status: 404, message: 'Project not found' } };
  if (!project.hasAccess(user._id, user.role)) {
    return { error: { status: 403, message: 'No access to this project' } };
  }
  return { project };
}

// GET /api/tasks?project=...&status=...&assignedTo=me
async function listTasks(req, res, next) {
  try {
    const filter = {};
    if (req.query.project) {
      if (!mongoose.isValidObjectId(req.query.project)) {
        return res.status(400).json({ error: 'Invalid project id' });
      }
      const { project, error } = await ensureProjectAccess(
        req.query.project,
        req.user
      );
      if (error) return res.status(error.status).json({ error: error.message });
      filter.project = project._id;
    } else {
      // Limit to projects user can access
      const accessible = await Project.find(
        req.user.role === 'admin'
          ? {}
          : { $or: [{ owner: req.user._id }, { members: req.user._id }] },
        '_id'
      );
      filter.project = { $in: accessible.map((p) => p._id) };
    }

    if (req.query.status) filter.status = req.query.status;
    if (req.query.assignedTo === 'me') filter.assignedTo = req.user._id;
    else if (req.query.assignedTo)
      filter.assignedTo = req.query.assignedTo;

    const tasks = await Task.find(filter)
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .populate('project', 'name')
      .sort({ dueDate: 1, createdAt: -1 });

    res.json({ tasks });
  } catch (err) {
    next(err);
  }
}

// POST /api/tasks
async function createTask(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      title,
      description,
      project: projectId,
      assignedTo,
      status,
      priority,
      dueDate,
    } = req.body;

    const { project, error } = await ensureProjectAccess(projectId, req.user);
    if (error) return res.status(error.status).json({ error: error.message });

    // assignedTo (if provided) must be a member of the project
    if (assignedTo) {
      const isMember =
        project.owner.toString() === assignedTo ||
        project.members.some((m) => m.toString() === assignedTo);
      if (!isMember) {
        return res
          .status(400)
          .json({ error: 'assignedTo user is not a member of this project' });
      }
    }

    const task = await Task.create({
      title,
      description,
      project: project._id,
      assignedTo: assignedTo || null,
      createdBy: req.user._id,
      status: status || 'todo',
      priority: priority || 'medium',
      dueDate: dueDate || null,
    });

    await task.populate('assignedTo', 'name email');
    await task.populate('createdBy', 'name email');
    res.status(201).json({ task });
  } catch (err) {
    next(err);
  }
}

// GET /api/tasks/:id
async function getTask(req, res, next) {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .populate('project', 'name owner members');
    if (!task) return res.status(404).json({ error: 'Task not found' });

    const project = await Project.findById(task.project._id);
    if (!project.hasAccess(req.user._id, req.user.role)) {
      return res.status(403).json({ error: 'No access to this task' });
    }
    res.json({ task });
  } catch (err) {
    next(err);
  }
}

// PUT /api/tasks/:id
async function updateTask(req, res, next) {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ error: 'Task not found' });

    const project = await Project.findById(task.project);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const isOwner = project.owner.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';
    const isAssignee =
      task.assignedTo && task.assignedTo.toString() === req.user._id.toString();

    // Members can only update tasks assigned to them; owners/admins can update anything in the project
    if (!isAdmin && !isOwner && !isAssignee) {
      return res
        .status(403)
        .json({ error: 'Only project owner, admin, or assignee can update' });
    }

    const allowedFields = [
      'title',
      'description',
      'status',
      'priority',
      'dueDate',
      'assignedTo',
    ];

    // Members can only change status — owners/admins can change everything
    const editable =
      isAdmin || isOwner ? allowedFields : ['status'];

    for (const field of editable) {
      if (req.body[field] !== undefined) task[field] = req.body[field];
    }

    if (req.body.assignedTo && (isAdmin || isOwner)) {
      const isMember =
        project.owner.toString() === req.body.assignedTo ||
        project.members.some((m) => m.toString() === req.body.assignedTo);
      if (!isMember) {
        return res
          .status(400)
          .json({ error: 'assignedTo user is not a member of this project' });
      }
    }

    await task.save();
    await task.populate('assignedTo', 'name email');
    await task.populate('createdBy', 'name email');
    res.json({ task });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/tasks/:id
async function deleteTask(req, res, next) {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ error: 'Task not found' });

    const project = await Project.findById(task.project);
    const isOwner = project.owner.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';
    if (!isAdmin && !isOwner) {
      return res
        .status(403)
        .json({ error: 'Only project owner or admin can delete tasks' });
    }
    await task.deleteOne();
    res.json({ message: 'Task deleted' });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listTasks,
  createTask,
  getTask,
  updateTask,
  deleteTask,
};
