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

  async regenerateBlock(params: {
    sessionId: string;
    blockId: string;
  }) {
    const session = await this.prisma.trainingSession.findUnique({
      where: { id: params.sessionId },
      include: {
        team: {
          include: {
            players: {
              include: {
                attributes: true,
              },
            },
          },
        },
        blocks: {
          include: {
            drills: {
              include: {
                drill: true,
              },
              orderBy: {
                order: 'asc',
              },
            },
          },
          orderBy: {
            order: 'asc',
          },
        },
      },
    });

    if (!session) {
      throw new Error('Session not found');
    }

    const block = session.blocks.find((item) => item.id === params.blockId);

    if (!block) {
      throw new Error('Block not found');
    }

    const players = session.team.players ?? [];
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

    const existingDrillIds = session.blocks
      .flatMap((item) => item.drills.map((drill) => drill.drillId))
      .filter((drillId) => drillId !== block.drills[0]?.drillId);

    const focusTags = String(
      block.focusTags || session.mainFocusTags || '',
    )
      .toLowerCase()
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean);

    const categoryCandidates = this.getDrillCategoriesForBlockType(block.type);

    const availableDrills = await this.prisma.drill.findMany({
      where: {
        category: {
          in: categoryCandidates,
        },
        difficulty: {
          lte: 5,
        },
        intensity: {
          lte: session.intensity,
        },
      },
      orderBy: [{ difficulty: 'asc' }, { durationMin: 'asc' }],
    });

    const teamAge = this.extractAge(session.team.ageGroup);

    const scoredDrills = availableDrills
      .filter((drill) => !existingDrillIds.includes(drill.id))
      .filter((drill) => this.matchesAge(drill, teamAge))
      .map((drill) => ({
        drill,
        score: this.scoreDrillForRegeneration(drill, block.type, focusTags),
      }))
      .sort((a, b) => b.score - a.score);

    const replacementDrill =
      scoredDrills[0]?.drill ??
      block.drills[0]?.drill ??
      null;

    const nextDescription = this.buildRegeneratedBlockDescription({
      blockType: block.type,
      focusTags,
      strengths,
      weaknesses,
      drillName: replacementDrill?.name ?? null,
    });

    await this.prisma.trainingBlock.update({
      where: { id: block.id },
      data: {
        description: nextDescription,
      },
    });

    await this.prisma.trainingBlockDrill.deleteMany({
      where: { blockId: block.id },
    });

    if (replacementDrill) {
      await this.prisma.trainingBlockDrill.create({
        data: {
          blockId: block.id,
          drillId: replacementDrill.id,
          order: 1,
          customNotes: this.buildRegeneratedCustomNotes({
            blockType: block.type,
            strengths,
            weaknesses,
          }),
        },
      });
    }

    const updatedBlock = await this.prisma.trainingBlock.findUnique({
      where: { id: block.id },
      include: {
        drills: {
          include: {
            drill: true,
          },
          orderBy: {
            order: 'asc',
          },
        },
      },
    });

    return updatedBlock;
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

  private extractAge(ageGroup: string): number | null {
    if (!ageGroup) return null;

    const normalized = ageGroup.toLowerCase().trim();
    const currentYear = new Date().getFullYear();

    const yearMatch = normalized.match(/\b(20\d{2})\b/);
    if (yearMatch) {
      const birthYear = Number(yearMatch[1]);
      const calculatedAge = currentYear - birthYear;
      if (calculatedAge >= 4 && calculatedAge <= 25) {
        return calculatedAge;
      }
    }

    const ageMatch = normalized.match(/\b(?:u|p|f)?(\d{1,2})\b/);
    if (ageMatch) {
      const age = Number(ageMatch[1]);
      if (age >= 4 && age <= 25) {
        return age;
      }
    }

    return null;
  }

  private matchesAge(drill: any, age: number | null) {
    if (age === null) return true;

    const minOk = drill.ageMin == null || Number(drill.ageMin) <= age;
    const maxOk = drill.ageMax == null || Number(drill.ageMax) >= age;

    return minOk && maxOk;
  }

  private getDrillCategoriesForBlockType(blockType: string) {
    if (blockType === 'warmup') return ['warmup', 'technical'];
    if (blockType === 'technical') return ['technical'];
    if (blockType === 'possession') return ['possession', 'technical'];
    if (blockType === 'transition') return ['game', 'possession'];
    if (blockType === 'game') return ['game', 'finishing'];
    if (blockType === 'finishing') return ['finishing', 'game'];

    return ['warmup', 'technical', 'possession', 'game', 'finishing'];
  }

  private scoreDrillForRegeneration(
    drill: any,
    blockType: string,
    focusTags: string[],
  ) {
    let score = 0;

    const category = String(drill.category ?? '').toLowerCase();
    const drillTags = String(drill.focusTags ?? '').toLowerCase();

    if (this.getDrillCategoriesForBlockType(blockType).includes(category)) {
      score += 5;
    }

    if (focusTags.length > 0) {
      for (const focus of focusTags) {
        if (drillTags.includes(focus)) {
          score += 8;
        }
      }
    }

    score += Math.max(0, 6 - Number(drill.difficulty || 1));

    return score;
  }

  private buildRegeneratedBlockDescription(params: {
    blockType: string;
    focusTags: string[];
    strengths: string[];
    weaknesses: string[];
    drillName: string | null;
  }) {
    const { blockType, focusTags, strengths, weaknesses, drillName } = params;

    const focusText =
      focusTags.length > 0 ? ` Focus on ${focusTags.join(', ')}.` : '';

    const weaknessText =
      weaknesses.length > 0
        ? ` Prioritise ${weaknesses.slice(0, 2).join(' and ')}.`
        : '';

    const strengthText =
      strengths.length > 0
        ? ` Build on strengths in ${strengths.slice(0, 2).join(' and ')}.`
        : '';

    const drillText = drillName ? ` Recommended drill: ${drillName}.` : '';

    if (blockType === 'warmup') {
      return `New warm-up block with activation, ball touches and readiness for the main theme.${focusText}${weaknessText}${drillText}`.trim();
    }

    if (blockType === 'technical') {
      return `New technical block with repetition and quality under realistic pressure.${focusText}${weaknessText}${drillText}`.trim();
    }

    if (blockType === 'possession') {
      return `New possession block focused on support play, awareness and tempo.${focusText}${weaknessText}${drillText}`.trim();
    }

    if (blockType === 'transition') {
      return `New transition block focused on reactions after winning or losing the ball.${focusText}${weaknessText}${drillText}`.trim();
    }

    if (blockType === 'game') {
      return `New game block aimed at transfer into match situations.${focusText}${strengthText}${drillText}`.trim();
    }

    return `New session block generated for the current training focus.${focusText}${drillText}`.trim();
  }

  private buildRegeneratedCustomNotes(params: {
    blockType: string;
    strengths: string[];
    weaknesses: string[];
  }) {
    const { blockType, strengths, weaknesses } = params;

    const weaknessHint =
      weaknesses.length > 0
        ? ` Extra focus on ${weaknesses.slice(0, 2).join(' and ')}.`
        : '';

    const strengthHint =
      strengths.length > 0
        ? ` Use team strengths in ${strengths.slice(0, 2).join(' and ')}.`
        : '';

    if (blockType === 'warmup') {
      return `Keep the tempo high and start with clear simple coaching points.${weaknessHint}`.trim();
    }

    if (blockType === 'technical') {
      return `Coach quality of execution and body shape before action.${weaknessHint}`.trim();
    }

    if (blockType === 'game') {
      return `Encourage realistic decisions and transfer to match situations.${strengthHint}`.trim();
    }

    return `Connect this exercise clearly to the main objective.${weaknessHint}`.trim();
  }
}