import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { TransformInterceptor } from '../src/common/interceptors/transform.interceptor';
import * as request from 'supertest';

describe('API Integration (e2e)', () => {
  let app: INestApplication;
  let token: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
    app.useGlobalFilters(new HttpExceptionFilter());
    app.useGlobalInterceptors(new TransformInterceptor());
    await app.init();
  });

  afterAll(async () => {
    const prisma = app.get(PrismaService);
    await prisma.$disconnect();
    await app.close();
  });

  it('POST /api/auth/login', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ username: 'komang.ari', password: 'admin123' })
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.data.accessToken).toBeDefined();
    token = res.body.data.accessToken;
  });

  it('GET /api/activities (paginated)', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/activities?page=1&pageSize=5')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.data.items).toBeDefined();
    expect(res.body.data.total).toBeGreaterThanOrEqual(0);
  });

  it('GET /api/team-locations', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/team-locations?mobile=1')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.data.items).toBeDefined();
  });
});