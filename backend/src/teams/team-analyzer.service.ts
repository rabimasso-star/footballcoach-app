import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Injectable()
export class TeamAnalyzerService {
  constructor(private readonly prisma: PrismaService) {}

  async analyzeTeam(teamId: string) {
    const team = await this.prisma.team.findUnique({
      where: { id: teamId },
      include: {
        players: {
          include: {
            attributes: true,
          },
        },
      },
    });

    if (!team) {
      throw new Error('Team not found');
    }

    const attributes = [
      'speed',
      'endurance',
      'strength',
      'dribbling',
      'passing',
      'shooting',
      'firstTouch',
      'tackling',
      'positioning',
      'decisionMaking',
      'confidence',
      'attitude',
    ] as const;

    const totals: Record<string, number> = {};
    const counts: Record<string, number> = {};

    for (const attr of attributes) {
      totals[attr] = 0;
      counts[attr] = 0;
    }

    for (const player of team.players) {
      if (!player.attributes) continue;

      for (const attr of attributes) {
        const value = (player.attributes as any)[attr];

        if (value !== null && value !== undefined) {
          totals[attr] += value;
          counts[attr] += 1;
        }
      }
    }

    const averages: Record<string, number> = {};

    for (const attr of attributes) {
      averages[attr] = counts[attr] > 0 ? totals[attr] / counts[attr] : 0;
    }

    const weaknesses = Object.entries(averages)
      .sort((a, b) => a[1] - b[1])
      .slice(0, 4)
      .map(([key]) => key);

    const strengths = Object.entries(averages)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([key]) => key);

    const recommendedFocus = this.mapWeaknessesToTrainingFocus(weaknesses);

    return {
      team,
      playerCount: team.players.length,
      averages,
      weaknesses,
      strengths,
      recommendedFocus,
    };
  }

  private mapWeaknessesToTrainingFocus(weaknesses: string[]) {
    const mapping: Record<string, string> = {
      passing: 'passing',
      firstTouch: 'first touch',
      dribbling: 'dribbling',
      decisionMaking: 'decision making',
      positioning: 'positioning',
      confidence: 'confidence',
      speed: 'transition',
      endurance: 'intensity',
      strength: 'duels',
      shooting: 'finishing',
      tackling: 'defending',
      attitude: 'communication',
    };

    return weaknesses.map((weakness) => mapping[weakness] || weakness);
  }
}