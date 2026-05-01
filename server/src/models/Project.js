const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Project name is required'],
      trim: true,
      maxlength: 120,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: '',
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    status: {
      type: String,
      enum: ['active', 'archived'],
      default: 'active',
    },
  },
  { timestamps: true }
);

// Helper: check if a user has access to this project
projectSchema.methods.hasAccess = function (userId, userRole) {
  if (userRole === 'admin') return true;
  if (this.owner.toString() === userId.toString()) return true;
  return this.members.some((m) => m.toString() === userId.toString());
};

module.exports = mongoose.model('Project', projectSchema);
