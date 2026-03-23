import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTeamDto } from '../dto/create-team.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller({
  path: 'teams',
  version: '1',
})
@UseGuards(JwtAuthGuard)
export class TeamsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  findAll(@Req() req: any) {
    return this.prisma.team.findMany({
      where: {
        coachId: req.user.coachId,
      },
      include: { players: { include: { attributes: true } } },
      orderBy: {
        name: 'asc',
      },
    });
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: any) {
    return this.prisma.team.findFirst({
      where: {
        id,
        coachId: req.user.coachId,
      },
      include: { players: { include: { attributes: true } } },
    });
  }

  @Get(':id/formation')
  async getFormation(@Param('id') id: string, @Req() req: any) {
    const team = await this.prisma.team.findFirst({
      where: {
        id,
        coachId: req.user.coachId,
      },
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
  async saveFormation(
    @Param('id') id: string,
    @Req() req: any,
    @Body() body: any,
  ) {
    const existing = await this.prisma.team.findFirst({
      where: {
        id,
        coachId: req.user.coachId,
      },
      select: {
        id: true,
      },
    });

    if (!existing) {
      throw new UnauthorizedException('Team not found or access denied.');
    }

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
  async create(@Body() data: CreateTeamDto, @Req() req: any) {
    return this.prisma.team.create({
      data: {
        name: data.name,
        ageGroup: data.ageGroup,
        competitionLevel: data.competitionLevel,
        primaryFormation: data.primaryFormation,
        trainingDaysPerWeek: data.trainingDaysPerWeek,
        primaryGoals: data.primaryGoals,
        coachId: req.user.coachId,
      },
    });
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Req() req: any,
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
    const existing = await this.prisma.team.findFirst({
      where: {
        id,
        coachId: req.user.coachId,
      },
      select: {
        id: true,
      },
    });

    if (!existing) {
      throw new UnauthorizedException('Team not found or access denied.');
    }

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