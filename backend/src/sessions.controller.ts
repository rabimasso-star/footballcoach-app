import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import type { AutoPlanInput } from './rule-based-planner.service';
import { RuleBasedPlannerService } from './rule-based-planner.service';

@Controller('sessions')
export class SessionsController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly planner: RuleBasedPlannerService,
  ) {}

  @Get('team/:teamId')
  findByTeam(@Param('teamId') teamId: string) {
    return this.prisma.trainingSession.findMany({
      where: { teamId },
      include: {
        blocks: {
          include: {
            drills: {
              include: { drill: true },
            },
          },
        },
      },
      orderBy: { date: 'desc' },
    });
  }

  @Post()
  async create(
    @Body()
    body: {
      teamId: string;
      coachId: string;
      date: string;
      title: string;
      mainFocusTags?: string;
      durationMinutes: number;
      intensity: number;
      createdBy: string;
      blocks: {
        type: string;
        order: number;
        durationMinutes: number;
        focusTags?: string;
        description?: string;
        drills: {
          drillId: string;
          order: number;
          customNotes?: string;
        }[];
      }[];
    },
  ) {
    const { blocks, date, ...sessionData } = body;

    return this.prisma.trainingSession.create({
      data: {
        ...sessionData,
        date: new Date(date),
        blocks: {
          create: blocks.map((block) => ({
            type: block.type,
            order: block.order,
            durationMinutes: block.durationMinutes,
            focusTags: block.focusTags,
            description: block.description,
            drills: {
              create: block.drills.map((d) => ({
                drillId: d.drillId,
                order: d.order,
                customNotes: d.customNotes,
              })),
            },
          })),
        },
      },
      include: {
        blocks: {
          include: {
            drills: true,
          },
        },
      },
    });
  }

  @Post('auto-plan')
  async autoPlan(@Body() body: AutoPlanInput) {
    const draft = await this.planner.autoPlan(body);
    return draft;
  }
}

