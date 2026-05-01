const { validationResult } = require('express-validator');
const mongoose = require('mongoose');
const Project = require('../models/Project');
const Task = require('../models/Task');
const User = require('../models/User');

// GET /api/projects  (returns projects user has access to)
async function listProjects(req, res, next) {
  try {
    const filter =
      req.user.role === 'admin'
        ? {}
        : { $or: [{ owner: req.user._id }, { members: req.user._id }] };

    const projects = await Project.find(filter)
      .populate('owner', 'name email')
      .populate('members', 'name email role')
      .sort({ updatedAt: -1 });

    res.json({ projects });
  } catch (err) {
    next(err);
  }
}

// POST /api/projects
async function createProject(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, description, members = [] } = req.body;
    const project = await Project.create({
      name,
      description,
      owner: req.user._id,
      members: [...new Set([req.user._id.toString(), ...members])],
    });
    await project.populate('owner', 'name email');
    await project.populate('members', 'name email role');

    res.status(201).json({ project });
  } catch (err) {
    next(err);
  }
}

// GET /api/projects/:id
async function getProject(req, res, next) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ error: 'Invalid project id' });
    }
    const project = await Project.findById(req.params.id)
      .populate('owner', 'name email')
      .populate('members', 'name email role');
    if (!project) return res.status(404).json({ error: 'Project not found' });

    if (!project.hasAccess(req.user._id, req.user.role)) {
      return res.status(403).json({ error: 'No access to this project' });
    }

    res.json({ project });
  } catch (err) {
    next(err);
  }
}

// PUT /api/projects/:id
async function updateProject(req, res, next) {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const isOwner = project.owner.toString() === req.user._id.toString();
    if (!isOwner && req.user.role !== 'admin') {
      return res
        .status(403)
        .json({ error: 'Only project owner or admin can update' });
    }

    const { name, description, members, status } = req.body;
    if (name !== undefined) project.name = name;
    if (description !== undefined) project.description = description;
    if (status !== undefined) project.status = status;
    if (Array.isArray(members)) {
      // Always keep owner in members
      project.members = [
        ...new Set([project.owner.toString(), ...members]),
      ];
    }
    await project.save();
    await project.populate('owner', 'name email');
    await project.populate('members', 'name email role');

    res.json({ project });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/projects/:id
async function deleteProject(req, res, next) {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const isOwner = project.owner.toString() === req.user._id.toString();
    if (!isOwner && req.user.role !== 'admin') {
      return res
        .status(403)
        .json({ error: 'Only project owner or admin can delete' });
    }

    await Task.deleteMany({ project: project._id });
    await project.deleteOne();
    res.json({ message: 'Project deleted' });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listProjects,
  createProject,
  getProject,
  updateProject,
  deleteProject,
};
