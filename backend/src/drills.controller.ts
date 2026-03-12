import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Controller('drills')
export class DrillsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  findAll() {
    return this.prisma.drill.findMany();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.prisma.drill.findUnique({ where: { id } });
  }

  @Post()
  create(
    @Body()
    data: {
      coachId?: string;
      name: string;
      description: string;
      objectives?: string;
      category: string;
      focusTags?: string;
      difficulty: number;
      minPlayers: number;
      maxPlayers?: number;
      durationMin: number;
      intensity: number;
      equipment?: string;
      pitchArea?: string;
      ageMin?: number;
      ageMax?: number;
    },
  ) {
    return this.prisma.drill.create({ data });
  }
}

