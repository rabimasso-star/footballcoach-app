import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { PlannedSessionDraft } from './rule-based-planner.service';

type AiRefineInput = {
  teamId: string;
  sessionDraft: PlannedSessionDraft;
};

@Injectable()
export class AiSessionService {
  constructor(private readonly prisma: PrismaService) {}

  async refineSession(input: AiRefineInput) {
    const team = await this.prisma.team.findUnique({
      where: { id: input.teamId },
      include: {
        players: {
          include: {
            attributes: true,
          },
        },
      },
    });

    if (!team) {
      return {
        draft: input.sessionDraft,
        aiNotes: 'No team found. Returning original draft.',
      };
    }

    const players = team.players ?? [];
    const averages = this.calculateAverageAttributes(players);

    const strengths: string[] = [];
    const weaknesses: string[] = [];

    if (averages.passing >= 7) strengths.push('passing');
    if (averages.firstTouch >= 7) strengths.push('first touch');
    if (averages.dribbling >= 7) strengths.push('dribbling');
    if (averages.decisionMaking >= 7) strengths.push('decision making');
    if (averages.positioning >= 7) strengths.push('positioning');

    if (averages.passing <= 5) weaknesses.push('passing');
    if (averages.firstTouch <= 5) weaknesses.push('first touch');
    if (averages.dribbling <= 5) weaknesses.push('dribbling');
    if (averages.decisionMaking <= 5) weaknesses.push('decision making');
    if (averages.positioning <= 5) weaknesses.push('positioning');
    if (averages.confidence <= 5) weaknesses.push('confidence');

    const refinedBlocks = input.sessionDraft.blocks.map((block) => {
      const extraNotes = this.buildBlockNotes(block.type, strengths, weaknesses);

      return {
        ...block,
        description: block.description
          ? `${block.description} ${extraNotes}`.trim()
          : extraNotes,
      };
    });

    const aiNotes = [
      `Team: ${team.name} (${team.ageGroup})`,
      strengths.length > 0
        ? `Team strengths: ${strengths.join(', ')}`
        : 'No clear strengths detected yet.',
      weaknesses.length > 0
        ? `Main development areas: ${weaknesses.join(', ')}`
        : 'No major weaknesses detected yet.',
      `Player count: ${players.length}`,
    ].join(' ');

    return {
      teamSummary: {
        id: team.id,
        name: team.name,
        ageGroup: team.ageGroup,
        competitionLevel: team.competitionLevel,
        playerCount: players.length,
        averageAttributes: averages,
      },
      draft: {
        ...input.sessionDraft,
        blocks: refinedBlocks,
      },
      aiNotes,
    };
  }

  private calculateAverageAttributes(players: any[]) {
    const defaults = {
      speed: 0,
      endurance: 0,
      strength: 0,
      dribbling: 0,
      passing: 0,
      shooting: 0,
      firstTouch: 0,
      tackling: 0,
      positioning: 0,
      decisionMaking: 0,
      confidence: 0,
      attitude: 0,
    };

    if (!players.length) return defaults;

    let count = 0;
    const totals = { ...defaults };

    for (const player of players) {
      if (!player.attributes) continue;

      count += 1;
      totals.speed += player.attributes.speed ?? 0;
      totals.endurance += player.attributes.endurance ?? 0;
      totals.strength += player.attributes.strength ?? 0;
      totals.dribbling += player.attributes.dribbling ?? 0;
      totals.passing += player.attributes.passing ?? 0;
      totals.shooting += player.attributes.shooting ?? 0;
      totals.firstTouch += player.attributes.firstTouch ?? 0;
      totals.tackling += player.attributes.tackling ?? 0;
      totals.positioning += player.attributes.positioning ?? 0;
      totals.decisionMaking += player.attributes.decisionMaking ?? 0;
      totals.confidence += player.attributes.confidence ?? 0;
      totals.attitude += player.attributes.attitude ?? 0;
    }

    if (count === 0) return defaults;

    return Object.fromEntries(
      Object.entries(totals).map(([key, value]) => [
        key,
        Math.round((value / count) * 10) / 10,
      ]),
    ) as typeof defaults;
  }

  private buildBlockNotes(
    blockType: string,
    strengths: string[],
    weaknesses: string[],
  ) {
    if (blockType === 'warmup') {
      return 'Use lots of touches, scanning and quick communication from the start.';
    }

    if (blockType === 'technical') {
      if (weaknesses.includes('first touch')) {
        return 'Emphasize receiving across the body and first touch away from pressure.';
      }

      if (weaknesses.includes('passing')) {
        return 'Focus on pass quality, tempo and body shape before receiving.';
      }

      return 'Encourage repetition with quality and clear coaching points.';
    }

    if (blockType === 'possession') {
      if (weaknesses.includes('decision making')) {
        return 'Coach quick decisions, support angles and awareness before receiving.';
      }

      return 'Encourage patience in possession and good spacing.';
    }

    if (blockType === 'game') {
      if (weaknesses.includes('positioning')) {
        return 'Pause and coach positioning, distances and defensive compactness.';
      }

      if (strengths.includes('dribbling')) {
        return 'Allow freedom in 1v1 moments and encourage brave attacking actions.';
      }

      return 'Focus on transfer from drills into realistic game situations.';
    }

    return 'Connect the exercise clearly to the session objective.';
  }
}