import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class AuditLoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP_AUDIT');

  private sanitizeUrl(url: string): string {
    return url.replace(
      /([?&](?:token|access_token|password|secret|key)=)[^&]*/gi,
      '$1[REDACTED]',
    );
  }

  use(req: Request, res: Response, next: NextFunction) {
    const { method, originalUrl, ip } = req;
    const safeUrl = this.sanitizeUrl(originalUrl);
    const userAgent = req.get('user-agent') || '';
    const startTime = Date.now();

    res.on('finish', () => {
      const { statusCode } = res;
      const responseTime = Date.now() - startTime;

      this.logger.log(
        `[${method}] ${safeUrl} -> ${statusCode} (${responseTime}ms) - IP: ${ip} - UA: ${userAgent.slice(0, 40)}`,
      );
    });

    next();
  }
}
