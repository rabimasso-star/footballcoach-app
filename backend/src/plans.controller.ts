import { Body, Controller, Post } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Controller({
  path: 'plans',
  version: '1',
})
export class PlansController {
  constructor(private readonly prisma: PrismaService) {}

  @Post('weekly')
  async generateWeeklyPlan(
    @Body()
    data: {
      teamId: string;
      weeks: number;
      sessionsPerWeek: number;
      defaultDurationMinutes: number;
      mainFocus?: string;
    },
  ) {
    const team = await this.prisma.team.findUnique({
      where: { id: data.teamId },
      include: {
        players: {
          include: {
            attributes: true,
          },
        },
      },
    });

    const mainFocus = data.mainFocus?.trim() || 'general development';

    const weeks = Array.from({ length: data.weeks }, (_, weekIndex) => {
      const sessions = Array.from({ length: data.sessionsPerWeek }, (_, sessionIndex) => {
        const focus = this.pickFocus(mainFocus, weekIndex, sessionIndex, team);

        return {
          title: `${focus} session`,
          focus,
          durationMinutes: data.defaultDurationMinutes,
          intensity: sessionIndex % 2 === 0 ? 'Medium' : 'High',
        };
      });

      return {
        weekNumber: weekIndex + 1,
        sessions,
      };
    });

    return { weeks };
  }

private pickFocus(
  mainFocus: string,
  weekIndex: number,
  sessionIndex: number,
  team: any,
) {
  const players = team?.players ?? [];

  const weaknesses: string[] = [];

  let decision = 0;
  let positioning = 0;
  let confidence = 0;
  let passing = 0;
  let firstTouch = 0;

  for (const player of players) {
    const a = player.attributes;
    if (!a) continue;

    decision += a.decisionMaking ?? 0;
    positioning += a.positioning ?? 0;
    confidence += a.confidence ?? 0;
    passing += a.passing ?? 0;
    firstTouch += a.firstTouch ?? 0;
  }

  const count = players.length || 1;

  if (decision / count < 6) weaknesses.push('decision making');
  if (positioning / count < 6) weaknesses.push('positioning');
  if (confidence / count < 6) weaknesses.push('confidence');
  if (passing / count < 6) weaknesses.push('passing');
  if (firstTouch / count < 6) weaknesses.push('first touch');

  const rotation = [
    ...weaknesses,
    mainFocus,
    'possession',
    'transition',
    'finishing',
  ];

  return rotation[(weekIndex + sessionIndex) % rotation.length];
}
}