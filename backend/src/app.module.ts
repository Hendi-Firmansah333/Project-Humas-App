import { Module } from '@nestjs/common';
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

@Module({
  imports: [
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
  providers: [AppService],
})
export class AppModule {}
