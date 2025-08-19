// Middleware de manejo centralizado de errores
export default function errorHandler(err, req, res, next) {
  console.error(err);
  if (res.headersSent) return next(err);
  res.status(err.status || 500).send(err.message || 'Internal server error');
}
