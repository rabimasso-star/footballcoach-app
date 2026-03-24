import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Put,
} from '@nestjs/common';
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
      include: {
        players: {
          include: {
            attributes: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const team = await this.prisma.team.findUnique({
      where: { id },
      include: {
        players: {
          include: {
            attributes: true,
          },
          orderBy: {
            name: 'asc',
          },
        },
      },
    });

    if (!team) {
      throw new NotFoundException('Team not found');
    }

    return team;
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
      throw new NotFoundException('Team not found');
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
    const existingTeam = await this.prisma.team.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existingTeam) {
      throw new NotFoundException('Team not found');
    }

    const formation =
      typeof body?.formation === 'string' && body.formation.trim().length > 0
        ? body.formation.trim()
        : null;

    const players = Array.isArray(body?.players) ? body.players : [];

    const payload = {
      formation,
      players,
      updatedAt: new Date().toISOString(),
    };

    const updated = await this.prisma.team.update({
      where: { id },
      data: {
        formationLayout: payload,
        ...(formation ? { primaryFormation: formation } : {}),
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

    const normalizedName = data.name?.trim();
    const normalizedAgeGroup = data.ageGroup?.trim();
    const normalizedCompetitionLevel = data.competitionLevel?.trim();
    const normalizedPrimaryFormation = data.primaryFormation?.trim() || null;
    const normalizedPrimaryGoals = data.primaryGoals?.trim() || null;

    if (coachId) {
      return this.prisma.team.create({
        data: {
          coachId,
          name: normalizedName,
          ageGroup: normalizedAgeGroup,
          competitionLevel: normalizedCompetitionLevel,
          primaryFormation: normalizedPrimaryFormation,
          trainingDaysPerWeek: data.trainingDaysPerWeek,
          primaryGoals: normalizedPrimaryGoals,
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
        coachId: demoCoach.id,
        name: normalizedName,
        ageGroup: normalizedAgeGroup,
        competitionLevel: normalizedCompetitionLevel,
        primaryFormation: normalizedPrimaryFormation,
        trainingDaysPerWeek: data.trainingDaysPerWeek,
        primaryGoals: normalizedPrimaryGoals,
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
    const existingTeam = await this.prisma.team.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existingTeam) {
      throw new NotFoundException('Team not found');
    }

    return this.prisma.team.update({
      where: { id },
      data: {
        name: data.name?.trim(),
        ageGroup: data.ageGroup?.trim(),
        competitionLevel: data.competitionLevel?.trim(),
        primaryFormation: data.primaryFormation?.trim(),
        trainingDaysPerWeek: data.trainingDaysPerWeek,
        primaryGoals: data.primaryGoals?.trim(),
      },
    });
  }
}