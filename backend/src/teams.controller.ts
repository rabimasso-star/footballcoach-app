import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Controller('teams')
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

  @Post()
  create(
    @Body()
    data: {
      coachId: string;
      name: string;
      ageGroup: string;
      competitionLevel: string;
      primaryFormation?: string;
      trainingDaysPerWeek?: number;
      primaryGoals?: string;
    },
  ) {
    return this.prisma.team.create({ data });
  }
}

