export const notFound = (_req, res) => res.status(404).json({ message: 'Route not found' });
export default function errorHandler(err, _req, res, _next) {
  let status = err.status || 500, message = err.message;
  if (err.name === 'ValidationError') { status = 400; message = Object.values(err.errors).map(e => e.message).join(', '); }
  else if (err.name === 'CastError') { status = 400; message = 'Invalid identifier'; }
  else if (err.code === 11000) { status = 409; message = 'Duplicate entry'; }
  if (status >= 500) { console.error(err); message = 'Something went wrong on the server'; }
  res.status(status).json({ message });
}
