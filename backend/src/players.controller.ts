import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Controller({
  path: 'players',
  version: '1',
})
export class PlayersController {
  constructor(private readonly prisma: PrismaService) {}

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.prisma.player.findUnique({
      where: { id },
      include: {
        attributes: true,
      },
    });
  }

  @Get('team/:teamId')
  findByTeam(@Param('teamId') teamId: string) {
    return this.prisma.player.findMany({
      where: { teamId },
      include: {
        attributes: true,
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  @Post()
  async create(@Body() data: any) {
    const { attributes, dateOfBirth, ...playerData } = data;

    return this.prisma.player.create({
      data: {
        ...playerData,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
        attributes: attributes
          ? {
              create: attributes,
            }
          : undefined,
      },
      include: {
        attributes: true,
      },
    });
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() data: any) {
    const { attributes, dateOfBirth, ...playerData } = data;

    const existingPlayer = await this.prisma.player.findUnique({
      where: { id },
      include: {
        attributes: true,
      },
    });

    if (!existingPlayer) {
      throw new Error('Player not found');
    }

    return this.prisma.player.update({
      where: { id },
      data: {
        ...playerData,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        attributes: attributes
          ? existingPlayer.attributes
            ? {
                update: {
                  speed: attributes.speed,
                  endurance: attributes.endurance,
                  strength: attributes.strength,
                  dribbling: attributes.dribbling,
                  passing: attributes.passing,
                  shooting: attributes.shooting,
                  firstTouch: attributes.firstTouch,
                  tackling: attributes.tackling,
                  positioning: attributes.positioning,
                  decisionMaking: attributes.decisionMaking,
                  confidence: attributes.confidence,
                  attitude: attributes.attitude,
                  strengths: attributes.strengths,
                  weaknesses: attributes.weaknesses,
                },
              }
            : {
                create: attributes,
              }
          : undefined,
      },
      include: {
        attributes: true,
      },
    });
  }
}