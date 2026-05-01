// Allow only users whose role is in the given list
function requireRole(...allowed) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    if (!allowed.includes(req.user.role)) {
      return res
        .status(403)
        .json({ error: `Forbidden: requires role ${allowed.join(' or ')}` });
    }
    next();
  };
}

module.exports = { requireRole };
