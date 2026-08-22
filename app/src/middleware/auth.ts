import { NextFunction, Request, Response } from 'express';

const API_TOKEN = process.env.API_TOKEN ?? 'dev-token';

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  // 1) Read the Authorization header from the incoming request.
  const authorization = req.header('Authorization');

  // 2) If header is missing, reject with 401.
  if (!authorization) {
    res.status(401).json({ message: 'Unauthorized: missing Authorization header' });
    return;
  }

  // 3) Require exact format: "Bearer <token>".
  const [scheme, token] = authorization.split(' ');

  // 4) If format/token is invalid, reject with 401.
  if (scheme !== 'Bearer' || !token || token !== API_TOKEN) {
    res.status(401).json({ message: 'Unauthorized: invalid Bearer token' });
    return;
  }

  // 5) Token is valid, continue to the route handler.
  next();
}