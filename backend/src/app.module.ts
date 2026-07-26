import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ActivitiesModule } from './activities/activities.module';
import { SchedulesModule } from './schedules/schedules.module';
import { ContentPlansModule } from './content-plans/content-plans.module';
import { EquipmentLoansModule } from './equipment-loans/equipment-loans.module';
import { LiveLocationModule } from './live-location/live-location.module';
import { ReportsModule } from './reports/reports.module';
import { NotificationsModule } from './notifications/notifications.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { AuditLoggerMiddleware } from './common/middleware/audit-logger.middleware';

@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 60 detik
        limit: 100, // Maksimal 100 request per menit
      },
    ]),
    PrismaModule,
    AuthModule,
    UsersModule,
    ActivitiesModule,
    SchedulesModule,
    ContentPlansModule,
    EquipmentLoansModule,
    LiveLocationModule,
    ReportsModule,
    NotificationsModule,
    DashboardModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AuditLoggerMiddleware).forRoutes('*');
  }
}


