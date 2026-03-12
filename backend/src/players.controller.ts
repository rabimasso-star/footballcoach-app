import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Controller('players')
export class PlayersController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('team/:teamId')
  findByTeam(@Param('teamId') teamId: string) {
    return this.prisma.player.findMany({
      where: { teamId },
      include: { attributes: true },
    });
  }

  @Post()
  create(
    @Body()
    body: {
      teamId: string;
      name: string;
      dateOfBirth?: string;
      positions?: string;
      dominantFoot?: string;
      notes?: string;
      attributes?: {
        speed: number;
        endurance: number;
        strength: number;
        dribbling: number;
        passing: number;
        shooting: number;
        firstTouch: number;
        tackling: number;
        positioning: number;
        decisionMaking: number;
        confidence: number;
        attitude: number;
        strengths?: string;
        weaknesses?: string;
      };
    },
  ) {
    const { attributes, dateOfBirth, ...rest } = body;

    return this.prisma.player.create({
      data: {
        ...rest,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
        attributes: attributes
          ? {
              create: attributes,
            }
          : undefined,
      },
      include: { attributes: true },
    });
  }
}

