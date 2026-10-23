import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { TransformInterceptor } from '../src/common/interceptors/transform.interceptor';
import * as request from 'supertest';

describe('HUMAS API Integration (e2e)', () => {
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

  it('POST /api/auth/login — returns JWT', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ username: 'komang.ari', password: 'admin123' })
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.data.accessToken).toBeDefined();
    token = res.body.data.accessToken;
  });

  it('GET /api/auth/profile — authenticated user', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/auth/profile')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.data.username).toBe('komang.ari');
  });

  it('GET /api/dashboard/summary', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/dashboard/summary')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.data.statistics).toBeDefined();
    expect(res.body.data.recentCheckIns).toBeDefined();
  });

  it('GET /api/activities — paginated list', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/activities?page=1&pageSize=5')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.data.items).toBeDefined();
    expect(res.body.data.total).toBeGreaterThanOrEqual(0);
  });

  it('GET /api/content-plans — paginated list', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/content-plans?page=1&pageSize=5')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.data.items).toBeDefined();
  });

  it('GET /api/notifications', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/notifications?page=1&pageSize=5')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.data.items).toBeDefined();
  });

  it('GET /api/team-locations?mobile=1', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/team-locations?mobile=1')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.data.items).toBeDefined();
  });

  it('GET /api/locations — web alias', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/locations')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('GET /api/users', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/users')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('GET /api/equipment-loans', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/equipment-loans')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('GET /api/reports', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/reports')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('GET /api/schedules', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/schedules')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('POST /api/auth/login — rejects invalid credentials', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ username: 'komang.ari', password: 'wrong' })
      .expect(401);
  });

  it('GET /api/activities — rejects without token', async () => {
    await request(app.getHttpServer()).get('/api/activities').expect(401);
  });
});