import { Body, Controller, Get, Param, Patch, Post, Put } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { CreateTeamDto } from './dto/create-team.dto';

@Controller({
  path: 'teams',
  version: '1',
})
export class TeamsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  findAll() {
    return this.prisma.team.findMany({
      include: { players: { include: { attributes: true } } },
    });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.prisma.team.findUnique({
      where: { id },
      include: { players: { include: { attributes: true } } },
    });
  }

  @Get(':id/formation')
  async getFormation(@Param('id') id: string) {
    const team = await this.prisma.team.findUnique({
      where: { id },
      select: {
        id: true,
        primaryFormation: true,
        formationLayout: true,
        players: {
          select: {
            id: true,
            name: true,
            positions: true,
          },
          orderBy: {
            name: 'asc',
          },
        },
      },
    });

    if (!team) {
      return null;
    }

    return {
      teamId: team.id,
      formation: team.primaryFormation ?? null,
      layout: team.formationLayout ?? null,
      players: team.players,
    };
  }

  @Put(':id/formation')
  async saveFormation(@Param('id') id: string, @Body() body: any) {
    const payload = {
      formation: typeof body?.formation === 'string' ? body.formation : null,
      players: Array.isArray(body?.players) ? body.players : [],
      updatedAt: new Date().toISOString(),
    };

    const updated = await this.prisma.team.update({
      where: { id },
      data: {
        formationLayout: payload,
        ...(typeof body?.formation === 'string'
          ? { primaryFormation: body.formation }
          : {}),
      },
      select: {
        id: true,
        primaryFormation: true,
        formationLayout: true,
      },
    });

    return {
      teamId: updated.id,
      formation: updated.primaryFormation ?? null,
      layout: updated.formationLayout ?? null,
    };
  }

  @Post()
  async create(@Body() data: CreateTeamDto) {
    const coachId = data.coachId?.trim();

    if (coachId) {
      return this.prisma.team.create({
        data: {
          ...data,
          coachId,
        },
      });
    }

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

    return this.prisma.team.create({
      data: {
        name: data.name,
        ageGroup: data.ageGroup,
        competitionLevel: data.competitionLevel,
        primaryFormation: data.primaryFormation,
        trainingDaysPerWeek: data.trainingDaysPerWeek,
        primaryGoals: data.primaryGoals,
        coachId: demoCoach.id,
      },
    });
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body()
    data: {
      name?: string;
      ageGroup?: string;
      competitionLevel?: string;
      primaryFormation?: string;
      trainingDaysPerWeek?: number;
      primaryGoals?: string;
    },
  ) {
    return this.prisma.team.update({
      where: { id },
      data: {
        name: data.name,
        ageGroup: data.ageGroup,
        competitionLevel: data.competitionLevel,
        primaryFormation: data.primaryFormation,
        trainingDaysPerWeek: data.trainingDaysPerWeek,
        primaryGoals: data.primaryGoals,
      },
    });
  }
}