import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { RealtimeEventsService } from './events/realtime-events.service';

const LOCAL_DEV_ORIGIN_REGEX = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i;

function getAllowedCorsOrigins(): string[] {
  const raw = [
    process.env['CORS_ORIGIN'],
    process.env['ALLOWED_ORIGINS'],
    process.env['FRONTEND_URL'],
  ]
    .filter(Boolean)
    .join(',');

  return raw
    .split(',')
    .map((origin) => origin.trim().replace(/\/+$/, ''))
    .filter(Boolean);
}

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  const allowedOrigins = getAllowedCorsOrigins();
  const isProd = process.env['NODE_ENV'] === 'production' || process.env['VERCEL'] === '1';

  if (isProd && allowedOrigins.length === 0) {
    logger.warn(
      'CORS_ORIGIN / FRONTEND_URL belum diset di production; semua origin sementara diizinkan. Set CORS_ORIGIN ke domain frontend Anda.',
    );
  }

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes('*')) {
        callback(null, true);
        return;
      }

      const normalized = origin.replace(/\/+$/, '');
      if (allowedOrigins.includes(normalized)) {
        callback(null, true);
        return;
      }

      if (!isProd && LOCAL_DEV_ORIGIN_REGEX.test(normalized)) {
        callback(null, true);
        return;
      }

      if (allowedOrigins.length === 0) {
        callback(null, true);
        return;
      }

      callback(new Error(`Origin ${origin} tidak diizinkan oleh kebijakan CORS.`), false);
    },
    credentials: true,
  });

  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );

  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
  app.useGlobalFilters(new HttpExceptionFilter());

  const eventsService = app.get(RealtimeEventsService, { strict: false });
  app.useGlobalInterceptors(new TransformInterceptor(eventsService));

  const isVercel = process.env['VERCEL'] === '1';
  const swaggerEnabled = !isProd || process.env['ENABLE_SWAGGER'] === 'true';

  if (swaggerEnabled) {
    const config = new DocumentBuilder()
      .setTitle('HUMASS API')
      .setDescription('Administration System for Public Relations Department Politeknik Negeri Lampung')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, config);

    SwaggerModule.setup(
      'api/docs',
      app,
      document,
      isVercel
        ? {
            customCssUrl: 'https://unpkg.com/swagger-ui-dist@5.32.8/swagger-ui.css',
            customJs: [
              'https://unpkg.com/swagger-ui-dist@5.32.8/swagger-ui-bundle.js',
              'https://unpkg.com/swagger-ui-dist@5.32.8/swagger-ui-standalone-preset.js',
            ],
          }
        : undefined,
    );
  }

  const port = process.env['PORT'] || 3001;
  if (isVercel) {
    await app.listen(port);
  } else {
    await app.listen(port, '0.0.0.0');
    console.log(`HUMASS API running on: http://localhost:${port}`);
    console.log(`Swagger docs available at: http://localhost:${port}/api/docs`);
  }
}
bootstrap();
