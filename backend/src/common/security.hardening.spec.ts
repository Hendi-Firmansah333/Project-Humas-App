import { ForbiddenException } from '@nestjs/common';
import { validate } from 'class-validator';
import { ContentStatus, Role } from '@prisma/client';
import { getJwtSecret } from '../auth/jwt-secret.util';
import { ContentPlansService } from '../content-plans/content-plans.service';
import { SubmitProofDto } from '../content-plans/dto/submit-proof.dto';
import { AuditLoggerMiddleware } from './middleware/audit-logger.middleware';

describe('Security Hardening Regression Tests', () => {
  describe('JWT Secret Fail-Fast in Production', () => {
    const origNodeEnv = process.env['NODE_ENV'];
    const origVercel = process.env['VERCEL'];
    const origJwtSecret = process.env['JWT_SECRET'];

    afterEach(() => {
      process.env['NODE_ENV'] = origNodeEnv;
      process.env['VERCEL'] = origVercel;
      process.env['JWT_SECRET'] = origJwtSecret;
    });

    it('throws in production when JWT_SECRET is missing or uses weak placeholder', () => {
      process.env['NODE_ENV'] = 'production';
      delete process.env['JWT_SECRET'];
      expect(() => getJwtSecret()).toThrow();

      process.env['JWT_SECRET'] = 'humass_secret_key_2026';
      expect(() => getJwtSecret()).toThrow();
    });

    it('accepts strong secret in production', () => {
      process.env['NODE_ENV'] = 'production';
      process.env['JWT_SECRET'] = 'super_strong_random_production_secret_2026_xyz';
      expect(getJwtSecret()).toBe('super_strong_random_production_secret_2026_xyz');
    });
  });

  describe('IsSafeHttpUrl Validator (Anti-XSS URL Scheme)', () => {
    it('rejects javascript: and data: URLs while allowing https://', async () => {
      const badDto = new SubmitProofDto();
      badDto.videoLink = 'javascript:alert(document.cookie)';
      badDto.posterPath = 'data:text/html,<script>alert(1)</script>';
      const badErrors = await validate(badDto);
      expect(badErrors.length).toBeGreaterThanOrEqual(2);

      const goodDto = new SubmitProofDto();
      goodDto.videoLink = 'https://drive.google.com/file/d/abc123/view';
      goodDto.posterPath = 'https://res.cloudinary.com/demo/image/upload/sample.jpg';
      const goodErrors = await validate(goodDto);
      expect(goodErrors.length).toBe(0);
    });
  });

  describe('ContentPlansService IDOR & Approval Bypass Protection', () => {
    const mockPlan = {
      id: 99,
      title: 'Reels Wisuda',
      picId: 10,
      status: ContentStatus.DALAM_PENGERJAAN,
      deletedAt: null,
      platform: 'INSTAGRAM',
    };

    const prismaMock = {
      contentPlan: {
        findFirst: jest.fn().mockResolvedValue(mockPlan),
        update: jest.fn(),
      },
    };
    const eventsMock = { emit: jest.fn(), emitMultiple: jest.fn() };
    const pushMock = { sendForNotifications: jest.fn() };

    const service = new ContentPlansService(
      prismaMock as any,
      eventsMock as any,
      pushMock as any,
    );

    it('blocks USER from viewing or submitting proof for another PIC content plan (IDOR)', async () => {
      await expect(service.findOne(99, false, 20, Role.USER)).rejects.toThrow(
        ForbiddenException,
      );
      await expect(
        service.submitProof(99, { videoLink: 'https://drive.google.com/x' }, 20, Role.USER),
      ).rejects.toThrow(ForbiddenException);
    });

    it('blocks USER from self-approving/publishing via PATCH /content-plans/:id', async () => {
      await expect(
        service.update(99, { status: ContentStatus.PUBLISHED }, 10, Role.USER),
      ).rejects.toThrow(ForbiddenException);
      expect(prismaMock.contentPlan.update).not.toHaveBeenCalled();
    });
  });

  describe('AuditLoggerMiddleware Query Token Redaction', () => {
    it('redacts token query parameter before logging', () => {
      const middleware = new AuditLoggerMiddleware();
      const logSpy = jest
        .spyOn((middleware as any).logger, 'log')
        .mockImplementation(() => undefined);

      let finishCb: (() => void) | undefined;
      const req: any = {
        method: 'GET',
        originalUrl: '/api/events/stream?token=eyJhbGciOiJIUzI1NiJ9.secret&foo=bar',
        ip: '127.0.0.1',
        get: () => 'JestTestAgent',
      };
      const res: any = {
        statusCode: 200,
        on: (ev: string, cb: () => void) => {
          if (ev === 'finish') finishCb = cb;
        },
      };

      middleware.use(req, res, jest.fn());
      finishCb?.();

      expect(logSpy).toHaveBeenCalled();
      const loggedLine = logSpy.mock.calls[0][0] as string;
      expect(loggedLine).toContain('token=[REDACTED]');
      expect(loggedLine).not.toContain('eyJhbGciOiJIUzI1NiJ9');
    });
  });
});
