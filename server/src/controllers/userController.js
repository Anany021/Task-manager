const User = require('../models/User');

// GET /api/users  (admins see all; members see all users for assignment dropdowns but no sensitive info)
async function listUsers(req, res, next) {
  try {
    const users = await User.find({}, 'name email role').sort({ name: 1 });
    res.json({ users });
  } catch (err) {
    next(err);
  }
}

// PUT /api/users/:id/role  (admin only)
async function updateRole(req, res, next) {
  try {
    const { role } = req.body;
    if (!['admin', 'member'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    );
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user });
  } catch (err) {
    next(err);
  }
}

module.exports = { listUsers, updateRole };
