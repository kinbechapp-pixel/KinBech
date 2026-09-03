function notFound(_req, res) {
  res.status(404).json({ message: 'Route not found' });
}

function errorHandler(error, _req, res, _next) {
  console.error(error);
  const status = error.status || 500;
  res.status(status).json({
    message: error.message || 'Something went wrong',
  });
}

module.exports = { notFound, errorHandler };
