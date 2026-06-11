module.exports = (err, req, res, _next) => {
  console.error(err);
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || err.keyValue || {})[0] || 'number';
    return res.status(409).json({ message: `A record with this ${field} already exists` });
  }

  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map((item) => item.message);
    return res.status(400).json({ message: errors[0] || 'Validation failed', errors });
  }

  if (err.name === 'CastError') {
    return res.status(400).json({ message: `Invalid ${err.path}` });
  }

  const status = err.status || 500;
  res.status(status).json({ message: status === 500 ? 'Server error' : err.message });
};
