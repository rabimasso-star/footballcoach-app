
import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { RuleBasedPlannerService } from './rule-based-planner.service';
import { AiSessionService } from './ai-session.service';

@Controller({
  path: 'sessions',
  version: '1',
})
export class SessionsController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly planner: RuleBasedPlannerService,
    private readonly ai: AiSessionService,
  ) {}

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.prisma.trainingSession.findUnique({
      where: { id },
      include: {
        blocks: {
          include: {
            drills: {
              include: {
                drill: true,
              },
              orderBy: {
                order: 'asc',
              },
            },
          },
          orderBy: {
            order: 'asc',
          },
        },
      },
    });
  }

  @Get('team/:teamId')
  findByTeam(@Param('teamId') teamId: string) {
    return this.prisma.trainingSession.findMany({
      where: { teamId },
      include: {
        blocks: {
          include: {
            drills: {
              include: {
                drill: true,
              },
              orderBy: {
                order: 'asc',
              },
            },
          },
          orderBy: {
            order: 'asc',
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
    });
  }

  @Post()
  async create(@Body() data: any) {
    const { blocks, date, coachId, ...sessionData } = data;

    let finalCoachId = coachId?.trim();

    if (!finalCoachId) {
      const demoCoach = await this.prisma.coach.upsert({
        where: { email: 'demo@footballcoach.local' },
        update: {},
        create: {
          email: 'demo@footballcoach.local',
          password: 'demo-password',
          name: 'Demo Coach',
          club: 'Demo Club',
        },
      });

      finalCoachId = demoCoach.id;
    }

    return this.prisma.trainingSession.create({
      data: {
        ...sessionData,
        coachId: finalCoachId,
        date: date ? new Date(date) : new Date(),
        blocks: blocks?.length
          ? {
              create: blocks.map((block: any) => ({
                type: block.type,
                order: block.order,
                durationMinutes: block.durationMinutes,
                focusTags: block.focusTags,
                description: block.description,
                drills: block.drills?.length
                  ? {
                      create: block.drills.map((drill: any) => ({
                        drillId: drill.drillId,
                        order: drill.order,
                        customNotes: drill.customNotes,
                      })),
                    }
                  : undefined,
              })),
            }
          : undefined,
      },
      include: {
        blocks: {
          include: {
            drills: {
              include: {
                drill: true,
              },
              orderBy: {
                order: 'asc',
              },
            },
          },
          orderBy: {
            order: 'asc',
          },
        },
      },
    });
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() data: any) {
    const { title, date, durationMinutes, intensity } = data;

    return this.prisma.trainingSession.update({
      where: { id },
      data: {
        title,
        date: date ? new Date(date) : undefined,
        durationMinutes:
          durationMinutes === null || durationMinutes === undefined
            ? undefined
            : Number(durationMinutes),
        intensity,
      },
      include: {
        blocks: {
          include: {
            drills: {
              include: {
                drill: true,
              },
              orderBy: {
                order: 'asc',
              },
            },
          },
          orderBy: {
            order: 'asc',
          },
        },
      },
    });
  }

  @Post('auto-plan')
  async autoPlan(@Body() data: any) {
    const draft = await this.planner.autoPlan(data);

    const refined = await this.ai.refineSession({
      teamId: data.teamId,
      sessionDraft: draft,
    });

    return refined.draft;
  }

  @Post(':id/duplicate')
  async duplicate(@Param('id') id: string) {
    const session = await this.prisma.trainingSession.findUnique({
      where: { id },
      include: {
        blocks: {
          include: {
            drills: true,
          },
        },
      },
    });

    if (!session) {
      throw new Error('Session not found');
    }

    return this.prisma.trainingSession.create({
      data: {
        title: `${session.title} (copy)`,
        teamId: session.teamId,
        coachId: session.coachId,
        createdBy: session.createdBy,
        date: new Date(),
        durationMinutes: session.durationMinutes,
        intensity: session.intensity,
        blocks: {
          create: session.blocks.map((block) => ({
            type: block.type,
            order: block.order,
            durationMinutes: block.durationMinutes,
            focusTags: block.focusTags,
            description: block.description,
            drills: {
              create: block.drills.map((drill) => ({
                drillId: drill.drillId,
                order: drill.order,
                customNotes: drill.customNotes,
              })),
            },
          })),
        },
      },
    });
  }
}

@Controller({
  path: 'teams/:teamId/sessions',
  version: '1',
})
export class TeamSessionsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  findByTeam(@Param('teamId') teamId: string) {
    return this.prisma.trainingSession.findMany({
      where: { teamId },
      include: {
        blocks: {
          include: {
            drills: {
              include: {
                drill: true,
              },
              orderBy: {
                order: 'asc',
              },
            },
          },
          orderBy: {
            order: 'asc',
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
    });
  }

  @Get(':id')
  findOneForTeam(
    @Param('teamId') teamId: string,
    @Param('id') id: string,
  ) {
    return this.prisma.trainingSession.findFirst({
      where: {
        id,
        teamId,
      },
      include: {
        blocks: {
          include: {
            drills: {
              include: {
                drill: true,
              },
              orderBy: {
                order: 'asc',
              },
            },
          },
          orderBy: {
            order: 'asc',
          },
        },
      },
    });
  }
}