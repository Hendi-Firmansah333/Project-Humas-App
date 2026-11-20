import { Controller, Get, UseGuards, Request, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { AuthGuard } from '@nestjs/passport';

@ApiTags('Dashboard')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('api/dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('summary')
  @ApiOperation({ summary: 'Ringkasan statistik dan agenda utama dashboard' })
  getSummary(@Request() req: any) {
    return this.dashboardService.getDashboardSummary(req.user.id, req.user.role);
  }

  @Get('agenda-analytics')
  @ApiOperation({ summary: 'Analitik agenda kegiatan humas per periode' })
  @ApiQuery({ name: 'period', required: false, enum: ['3m', '6m', 'year', 'all'] })
  getAgendaAnalytics(@Query('period') period?: string) {
    return this.dashboardService.getAgendaAnalytics(period || '3m');
  }
}
