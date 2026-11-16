import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import { ROLES_KEY } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { RealtimeEventsService } from '../events/realtime-events.service';
import { PrismaService } from '../prisma/prisma.service';
import { ReportsController } from '../reports/reports.controller';
import { SchedulesController } from './schedules.controller';
import { SchedulesService } from './schedules.service';

function createMockContext(handler: Function, controller: Function, role: Role): ExecutionContext {
  return {
    getHandler: () => handler,
    getClass: () => controller,
    switchToHttp: () => ({
      getRequest: () => ({ user: { id: 10, role } }),
    }),
  } as unknown as ExecutionContext;
}

describe('Schedules & Reports RBAC Security', () => {
  const reflector = new Reflector();
  const rolesGuard = new RolesGuard(reflector);

  it('attaches RolesGuard to SchedulesController and ReportsController', () => {
    const scheduleGuards = Reflect.getMetadata(GUARDS_METADATA, SchedulesController) as unknown[];
    const reportGuards = Reflect.getMetadata(GUARDS_METADATA, ReportsController) as unknown[];

    expect(scheduleGuards).toContain(RolesGuard);
    expect(reportGuards).toContain(RolesGuard);
  });

  it('blocks Role.USER on ReportsController and SchedulesController mutation handlers', () => {
    const reportRoles = reflector.getAllAndOverride<Role[]>(ROLES_KEY, [ReportsController]);
    expect(reportRoles).toEqual([Role.ADMIN, Role.SUPER_ADMIN]);

    const mutations = [
      SchedulesController.prototype.create,
      SchedulesController.prototype.update,
      SchedulesController.prototype.remove,
    ];

    for (const handler of mutations) {
      expect(
        rolesGuard.canActivate(createMockContext(handler, SchedulesController, Role.USER)),
      ).toBe(false);
      expect(
        rolesGuard.canActivate(createMockContext(handler, SchedulesController, Role.ADMIN)),
      ).toBe(true);
      expect(
        rolesGuard.canActivate(createMockContext(handler, SchedulesController, Role.SUPER_ADMIN)),
      ).toBe(true);
    }

    expect(
      rolesGuard.canActivate(createMockContext(() => {}, ReportsController, Role.USER)),
    ).toBe(false);
    expect(
      rolesGuard.canActivate(createMockContext(() => {}, ReportsController, Role.ADMIN)),
    ).toBe(true);
  });

  it('forces Role.USER to only query their own schedules in SchedulesController.findAll', async () => {
    const schedulesServiceMock = {
      findAll: jest.fn().mockResolvedValue([]),
      findOne: jest.fn(),
    } as unknown as SchedulesService;

    const controller = new SchedulesController(schedulesServiceMock);

    await controller.findAll({ user: { id: 7, role: Role.USER } }, 999, 'piket');
    expect(schedulesServiceMock.findAll).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 7, search: 'piket' }),
    );

    await controller.findAll({ user: { id: 1, role: Role.ADMIN } }, 999);
    expect(schedulesServiceMock.findAll).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 999 }),
    );
  });

  it('throws ForbiddenException when Role.USER fetches another user schedule detail', async () => {
    const prismaMock = {
      dutySchedule: {
        findMany: jest.fn().mockResolvedValue([]),
        updateMany: jest.fn().mockResolvedValue({ count: 0 }),
        findUnique: jest.fn().mockResolvedValue({
          id: 55,
          userId: 9,
          title: 'Liputan Internal',
          user: { id: 9, fullName: 'Rina', username: 'rina', roleLabel: 'Reporter', avatar: null },
        }),
      },
    };
    const eventsMock = {
      emit: jest.fn(),
      emitMultiple: jest.fn(),
    } as unknown as RealtimeEventsService;

    const service = new SchedulesService(prismaMock as unknown as PrismaService, eventsMock);

    await expect(
      service.findOne(55, { id: 7, role: Role.USER }),
    ).rejects.toThrow(ForbiddenException);

    await expect(
      service.findOne(55, { id: 9, role: Role.USER }),
    ).resolves.toMatchObject({ id: 55, userId: 9 });

    await expect(
      service.findOne(55, { id: 1, role: Role.ADMIN }),
    ).resolves.toMatchObject({ id: 55, userId: 9 });
  });
});
