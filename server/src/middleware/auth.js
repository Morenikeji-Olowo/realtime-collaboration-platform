import { verifyToken } from '../utils/jwt.js';

export default async function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: 'You must be logged in to access this resource.',
      code: 'MISSING_TOKEN',
    });
  }

  const token = authHeader.slice(7);

  try {
    req.user = await verifyToken(token);
    next();
  } catch (err) {
    req.log?.error({ err }, 'Token verification failed');

    if (err.code === 'ERR_JWT_EXPIRED') {
      return res.status(401).json({
        success: false,
        error: 'Your session has expired. Please log in again.',
        code: 'TOKEN_EXPIRED',
      });
    }

    return res.status(401).json({
      success: false,
      error: 'Your session is invalid. Please log in again.',
      code: 'INVALID_TOKEN',
    });
  }
}