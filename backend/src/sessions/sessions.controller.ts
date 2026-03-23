import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RuleBasedPlannerService } from '../planner/rule-based-planner.service';
import { AiSessionService } from '../planner/ai-session.service';

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
    const { title, date, durationMinutes, intensity, mainFocus, mainFocusTags } = data;

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
        mainFocusTags: mainFocusTags ?? mainFocus,
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

  @Post(':id/blocks/:blockId/drills')
  async addDrillToBlock(
    @Param('id') sessionId: string,
    @Param('blockId') blockId: string,
    @Body() body: any,
  ) {
    const block = await this.prisma.trainingBlock.findFirst({
      where: {
        id: blockId,
        sessionId,
      },
      include: {
        drills: {
          orderBy: {
            order: 'asc',
          },
        },
      },
    });

    if (!block) {
      throw new Error('Block not found');
    }

    const nextOrder = block.drills.length + 1;

    await this.prisma.trainingBlockDrill.create({
      data: {
        blockId,
        drillId: String(body.drillId),
        order: nextOrder,
        customNotes: body.customNotes ?? null,
      },
    });

    return this.prisma.trainingSession.findUnique({
      where: { id: sessionId },
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

  @Delete(':id/blocks/:blockId/drills/:trainingBlockDrillId')
  async removeDrillFromBlock(
    @Param('id') sessionId: string,
    @Param('blockId') blockId: string,
    @Param('trainingBlockDrillId') trainingBlockDrillId: string,
  ) {
    await this.prisma.trainingBlockDrill.delete({
      where: {
        id: trainingBlockDrillId,
      },
    });

    const remaining = await this.prisma.trainingBlockDrill.findMany({
      where: { blockId },
      orderBy: { order: 'asc' },
    });

    for (let index = 0; index < remaining.length; index += 1) {
      await this.prisma.trainingBlockDrill.update({
        where: { id: remaining[index].id },
        data: { order: index + 1 },
      });
    }

    return this.prisma.trainingSession.findUnique({
      where: { id: sessionId },
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

  @Patch(':id/blocks/:blockId/drills/:trainingBlockDrillId')
  async updateBlockDrill(
    @Param('id') sessionId: string,
    @Param('blockId') blockId: string,
    @Param('trainingBlockDrillId') trainingBlockDrillId: string,
    @Body() body: any,
  ) {
    const current = await this.prisma.trainingBlockDrill.findUnique({
      where: { id: trainingBlockDrillId },
    });

    if (!current) {
      throw new Error('Training block drill not found');
    }

    if (body.direction === 'up' || body.direction === 'down') {
      const drills = await this.prisma.trainingBlockDrill.findMany({
        where: { blockId },
        orderBy: { order: 'asc' },
      });

      const currentIndex = drills.findIndex((item) => item.id === trainingBlockDrillId);

      if (currentIndex !== -1) {
        const swapIndex =
          body.direction === 'up' ? currentIndex - 1 : currentIndex + 1;

        if (swapIndex >= 0 && swapIndex < drills.length) {
          const currentItem = drills[currentIndex];
          const swapItem = drills[swapIndex];

          await this.prisma.trainingBlockDrill.update({
            where: { id: currentItem.id },
            data: { order: swapItem.order },
          });

          await this.prisma.trainingBlockDrill.update({
            where: { id: swapItem.id },
            data: { order: currentItem.order },
          });
        }
      }
    }

    if (typeof body.customNotes === 'string' || body.customNotes === null) {
      await this.prisma.trainingBlockDrill.update({
        where: { id: trainingBlockDrillId },
        data: {
          customNotes: body.customNotes,
        },
      });
    }

    return this.prisma.trainingSession.findUnique({
      where: { id: sessionId },
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
        mainFocusTags: session.mainFocusTags,
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