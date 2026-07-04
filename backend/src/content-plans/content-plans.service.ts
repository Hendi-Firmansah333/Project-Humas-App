import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateContentPlanDto } from './dto/create-content-plan.dto';
import { UpdateContentPlanDto } from './dto/update-content-plan.dto';
import { Platform, ContentStatus } from '@prisma/client';

@Injectable()
export class ContentPlansService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateContentPlanDto) {
    const { deadline, ...data } = dto;
    return this.prisma.contentPlan.create({
      data: {
        ...data,
        deadline: new Date(deadline),
      },
      include: {
        pic: { select: { id: true, fullName: true, username: true, roleLabel: true, avatar: true } },
      },
    });
  }

  async findAll(platform?: Platform, status?: ContentStatus, search?: string) {
    return this.prisma.contentPlan.findMany({
      where: {
        platform: platform || undefined,
        status: status || undefined,
        OR: search
          ? [
              { title: { contains: search } },
              { description: { contains: search } },
            ]
          : undefined,
      },
      include: {
        pic: { select: { id: true, fullName: true, username: true, roleLabel: true, avatar: true } },
      },
      orderBy: { deadline: 'asc' },
    });
  }

  async findOne(id: number) {
    const plan = await this.prisma.contentPlan.findUnique({
      where: { id },
      include: {
        pic: { select: { id: true, fullName: true, username: true, roleLabel: true, avatar: true } },
      },
    });

    if (!plan) {
      throw new NotFoundException(`Rencana konten dengan ID #${id} tidak ditemukan.`);
    }
    return plan;
  }

  async update(id: number, dto: UpdateContentPlanDto) {
    await this.findOne(id);
    const { deadline, ...data } = dto;
    return this.prisma.contentPlan.update({
      where: { id },
      data: {
        ...data,
        deadline: deadline ? new Date(deadline) : undefined,
      },
      include: {
        pic: { select: { id: true, fullName: true, username: true, roleLabel: true, avatar: true } },
      },
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.prisma.contentPlan.delete({ where: { id } });
    return { message: `Rencana konten ID #${id} berhasil dihapus.` };
  }
}
