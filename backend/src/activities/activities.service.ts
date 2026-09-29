import { Injectable } from '@nestjs/common';
import { CreateActivityDto } from './dto/create-activity.dto';
import { UpdateActivityDto } from './dto/update-activity.dto';
import { CheckInDto } from './dto/check-in.dto';
import { DocumentationDto } from './dto/documentation.dto';
import { ActivityStatus } from '@prisma/client';
import { ActivitiesCrudService } from './services/activities-crud.service';
import { ActivitiesTeamService } from './services/activities-team.service';
import { ActivitiesExecutionService } from './services/activities-execution.service';
import { ActivitiesWorkflowService } from './services/activities-workflow.service';

/**
 * ActivitiesService bertindak sebagai Facade / Orchestrator utama yang mendelegasikan
 * pekerjaan ke masing-masing sub-service (CRUD, Team Assignment, Execution/Presensi, & Workflow).
 * Pola ini menjamin kompatibilitas ke ActivitiesController dan API client tanpa mengubah interface.
 */
@Injectable()
export class ActivitiesService {
  constructor(
    private readonly crudService: ActivitiesCrudService,
    private readonly teamService: ActivitiesTeamService,
    private readonly executionService: ActivitiesExecutionService,
    private readonly workflowService: ActivitiesWorkflowService,
  ) {}

  // ── 1. CRUD & Query Operations ─────────────────────────────────────────────
  create(dto: CreateActivityDto, userId?: number) {
    return this.crudService.create(dto, userId);
  }

  findAllPaginated(query: {
    page?: number;
    pageSize?: number;
    status?: ActivityStatus;
    search?: string;
    startDate?: string;
    endDate?: string;
    month?: number;
    year?: number;
    history?: boolean;
    mobile?: boolean;
    userId?: number;
    role?: string;
  }) {
    return this.crudService.findAllPaginated(query);
  }

  findOne(id: number, mobile = false) {
    return this.crudService.findOne(id, mobile);
  }

  update(id: number, dto: UpdateActivityDto, userId?: number) {
    return this.crudService.update(id, dto, userId);
  }

  remove(id: number) {
    return this.crudService.remove(id);
  }

  restore(id: number) {
    return this.crudService.restore(id);
  }

  getCategories() {
    return this.crudService.getCategories();
  }

  // ── 2. Team & Equipment Assignment ─────────────────────────────────────────
  syncPicMember(activityId: number, picId: number) {
    return this.teamService.syncPicMember(activityId, picId);
  }

  assignTeam(
    id: number,
    picId: number,
    memberIds: number[],
    equipmentItems?: { equipmentId: number; quantity: number }[],
  ) {
    return this.teamService.assignTeam(id, picId, memberIds, equipmentItems);
  }

  // ── 3. Field Execution & Attendance ────────────────────────────────────────
  checkIn(activityId: number, userId: number, dto: CheckInDto) {
    return this.executionService.checkIn(activityId, userId, dto);
  }

  submitDocumentation(activityId: number, userId: number, dto: DocumentationDto) {
    return this.executionService.submitDocumentation(activityId, userId, dto);
  }

  // ── 4. Approvals & Workflow Lifecycle ──────────────────────────────────────
  approveExecution(id: number, userId: number) {
    return this.workflowService.approveExecution(id, userId);
  }

  rejectExecution(id: number, userId: number, notes: string) {
    return this.workflowService.rejectExecution(id, userId, notes);
  }

  submitVerification(id: number, userId: number, notes?: string) {
    return this.workflowService.submitVerification(id, userId, notes);
  }

  approveFinish(id: number, userId: number, notes?: string) {
    return this.workflowService.approveFinish(id, userId, notes);
  }

  returnRevision(id: number, userId: number, notes: string) {
    return this.workflowService.returnRevision(id, userId, notes);
  }
}