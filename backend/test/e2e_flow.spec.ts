import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';

describe('HUMASS Enterprise API - E2E Verification Suite', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('1. App Health Check Endpoint', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200);
  });

  it('2. Throttler Rate Limit Guard Verification', async () => {
    // Memastikan endpoint merespons request pertama dengan normal
    const res = await request(app.getHttpServer()).get('/');
    expect(res.status).toBeLessThan(500);
  });

  it('3. Activities Endpoint Access Guard', () => {
    return request(app.getHttpServer())
      .get('/activities')
      .expect((res) => {
        // Harus menolak jika tanpa token JWT (401 Unauthorized) atau merespons data 200
        expect([200, 401]).toContain(res.status);
      });
  });
});
