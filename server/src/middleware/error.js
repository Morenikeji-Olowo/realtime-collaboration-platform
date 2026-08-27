export class AppError extends Error {
  constructor(message, statusCode = 500, options) {
    super(message, options);
    this.statusCode = statusCode;
    this.isOperational = true;
  }
}

export function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || 500;
  const message = err.isOperational ? err.message : 'Internal server error';

  req.log?.error({ err }, message);

  res.status(statusCode).json({ success: false, error: message });
}