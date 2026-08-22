import { Request, Response, NextFunction } from 'express';

export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const startTime = Date.now();
  const { method, url, ip } = req;

  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const { statusCode } = res;

    console.log(`[${new Date().toISOString()}] ${method} ${url} - ${statusCode} (${duration}ms) - IP: ${ip}`);
  });

  next();
}
