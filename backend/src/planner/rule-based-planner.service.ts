import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TeamAnalyzerService } from '../teams/team-analyzer.service';
import { SessionHistoryService } from '../sessions/session-history.service';

export type AutoPlanInput = {
  teamId: string;
  coachId: string;
  date: string;
  durationMinutes: number;
  intensity: number;
  mainFocusTags?: string;
};

export type PlannedSessionDraft = {
  title: string;
  teamId: string;
  coachId?: string;
  date: string;
  durationMinutes: number;
  intensity: number;
  mainFocusTags?: string;
  createdBy: 'rule_engine';
  blocks: {
    type: string;
    order: number;
    durationMinutes: number;
    focusTags?: string;
    description?: string;
    drills: {
      drillId: string;
      order: number;
      customNotes?: string;
    }[];
  }[];
};

type SessionBlockTemplate = {
  type: string;
  weight: number;
  drillCount: number;
};

@Injectable()
export class RuleBasedPlannerService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly analyzer: TeamAnalyzerService,
    private readonly history: SessionHistoryService,
  ) {}

  async autoPlan(input: AutoPlanInput): Promise<PlannedSessionDraft> {
    const { teamId, coachId, durationMinutes, intensity, mainFocusTags, date } =
      input;

    const analysis = await this.analyzer.analyzeTeam(teamId);
    const team = analysis.team;

    const teamAge = this.extractAge(team.ageGroup);
    const maxDifficulty = this.getMaxDifficulty(
      team.competitionLevel,
      teamAge,
    );
    const maxIntensity = this.getMaxIntensity(teamAge, intensity);

    const userFocusTags = (mainFocusTags ?? '')
      .toLowerCase()
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean);

    const recentFocuses = await this.history.getRecentFocuses(teamId, 5);

    const smartFocusTags = this.buildSmartFocusTags({
      userFocusTags,
      recommendedFocus: analysis.recommendedFocus,
      recentFocuses,
    });

    const blockTemplates = this.getSessionTemplateByAge(teamAge);
    const blockDurations = this.allocateDurations(
      durationMinutes,
      blockTemplates,
    );

    const allDrills = await this.prisma.drill.findMany({
      where: {
        difficulty: {
          lte: maxDifficulty,
        },
        intensity: {
          lte: maxIntensity,
        },
      },
      orderBy: [{ difficulty: 'asc' }, { durationMin: 'asc' }],
    });

    const blocks: PlannedSessionDraft['blocks'] = [];
    const usedDrillIds = new Set<string>();

    for (let index = 0; index < blockTemplates.length; index += 1) {
      const template = blockTemplates[index];
      const blockDuration = blockDurations[index];

      const drills = this.pickDrillsForBlock({
        allDrills,
        blockType: template.type,
        drillCount: template.drillCount,
        focusTags: smartFocusTags,
        teamAge,
        usedDrillIds,
      });

      if (drills.length === 0) {
        continue;
      }

      drills.forEach((drill) => usedDrillIds.add(drill.id));

      blocks.push({
        type: template.type,
        order: index + 1,
        durationMinutes: blockDuration,
        focusTags: smartFocusTags.join(', '),
        description: this.getBlockDescription(
          template.type,
          teamAge,
          team.competitionLevel,
          analysis.weaknesses,
        ),
        drills: drills.map((drill, drillIndex) => ({
          drillId: drill.id,
          order: drillIndex + 1,
          customNotes: this.getCustomNotesForBlock(
            template.type,
            teamAge,
            team.competitionLevel,
            analysis.weaknesses,
          ),
        })),
      });
    }

    return {
      title: smartFocusTags.length
        ? `Training: ${smartFocusTags.join(', ')}`
        : 'Training session',
      teamId,
      coachId,
      date,
      durationMinutes,
      intensity: maxIntensity,
      mainFocusTags: smartFocusTags.join(', '),
      createdBy: 'rule_engine',
      blocks,
    };
  }

  private buildSmartFocusTags(params: {
    userFocusTags: string[];
    recommendedFocus: string[];
    recentFocuses: string[];
  }) {
    const { userFocusTags, recommendedFocus, recentFocuses } = params;

    if (userFocusTags.length > 0) {
      return userFocusTags;
    }

    const filteredRecommended = recommendedFocus.filter(
      (focus) => !recentFocuses.includes(focus.toLowerCase()),
    );

    if (filteredRecommended.length > 0) {
      return filteredRecommended.slice(0, 2);
    }

    if (recommendedFocus.length > 0) {
      return recommendedFocus.slice(0, 2);
    }

    return ['general development'];
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

  private getSessionTemplateByAge(age: number | null): SessionBlockTemplate[] {
    if (age === null) {
      return [
        { type: 'warmup', weight: 20, drillCount: 1 },
        { type: 'technical', weight: 40, drillCount: 1 },
        { type: 'game', weight: 40, drillCount: 1 },
      ];
    }

    if (age <= 6) {
      return [
        { type: 'warmup', weight: 30, drillCount: 1 },
        { type: 'technical', weight: 35, drillCount: 1 },
        { type: 'game', weight: 35, drillCount: 1 },
      ];
    }

    if (age <= 9) {
      return [
        { type: 'warmup', weight: 25, drillCount: 1 },
        { type: 'technical', weight: 35, drillCount: 1 },
        { type: 'game', weight: 40, drillCount: 1 },
      ];
    }

    if (age <= 12) {
      return [
        { type: 'warmup', weight: 20, drillCount: 1 },
        { type: 'technical', weight: 30, drillCount: 1 },
        { type: 'possession', weight: 25, drillCount: 1 },
        { type: 'game', weight: 25, drillCount: 1 },
      ];
    }

    if (age <= 15) {
      return [
        { type: 'warmup', weight: 15, drillCount: 1 },
        { type: 'technical', weight: 25, drillCount: 1 },
        { type: 'possession', weight: 25, drillCount: 1 },
        { type: 'transition', weight: 15, drillCount: 1 },
        { type: 'game', weight: 20, drillCount: 1 },
      ];
    }

    return [
      { type: 'warmup', weight: 15, drillCount: 1 },
      { type: 'technical', weight: 20, drillCount: 1 },
      { type: 'possession', weight: 20, drillCount: 1 },
      { type: 'transition', weight: 20, drillCount: 1 },
      { type: 'game', weight: 25, drillCount: 1 },
    ];
  }

  private allocateDurations(
    totalMinutes: number,
    templates: SessionBlockTemplate[],
  ): number[] {
    const totalWeight = templates.reduce((sum, block) => sum + block.weight, 0);

    const rawDurations = templates.map((block) =>
      Math.round((block.weight / totalWeight) * totalMinutes),
    );

    let sum = rawDurations.reduce((a, b) => a + b, 0);

    while (sum < totalMinutes) {
      rawDurations[rawDurations.length - 1] += 1;
      sum += 1;
    }

    while (sum > totalMinutes) {
      const index = rawDurations.findIndex((value) => value > 5);
      if (index === -1) break;
      rawDurations[index] -= 1;
      sum -= 1;
    }

    return rawDurations;
  }

  private getMaxDifficulty(
    competitionLevel: string,
    age: number | null,
  ): number {
    let base: number;

    switch ((competitionLevel ?? '').toLowerCase()) {
      case 'development':
      case 'grassroots':
        base = 2;
        break;
      case 'intermediate':
        base = 3;
        break;
      case 'advanced':
        base = 4;
        break;
      case 'elite academy':
        base = 5;
        break;
      default:
        base = 3;
        break;
    }

    if (age !== null && age <= 6) return Math.min(base, 1);
    if (age !== null && age <= 9) return Math.min(base, 2);
    if (age !== null && age <= 12) return Math.min(base, 3);

    return base;
  }

  private getMaxIntensity(age: number | null, requestedIntensity: number) {
    if (age !== null && age <= 6) return Math.min(requestedIntensity, 1);
    if (age !== null && age <= 9) return Math.min(requestedIntensity, 2);
    return requestedIntensity;
  }

  private pickDrillsForBlock(params: {
    allDrills: any[];
    blockType: string;
    drillCount: number;
    focusTags: string[];
    teamAge: number | null;
    usedDrillIds: Set<string>;
  }) {
    const {
      allDrills,
      blockType,
      drillCount,
      focusTags,
      teamAge,
      usedDrillIds,
    } = params;

    const scored = allDrills
      .filter((drill) => this.matchesAge(drill, teamAge))
      .filter((drill) => !usedDrillIds.has(drill.id))
      .map((drill) => ({
        drill,
        score: this.scoreDrill(drill, blockType, focusTags),
      }))
      .sort((a, b) => b.score - a.score);

    return scored.slice(0, drillCount).map((item) => item.drill);
  }

  private scoreDrill(drill: any, blockType: string, focusTags: string[]) {
    let score = 0;

    if (this.matchesBlockType(drill, blockType)) {
      score += 5;
    }

    if (this.matchesFocus(drill, focusTags)) {
      score += 10;
    }

    score += Math.max(0, 6 - Number(drill.difficulty || 1));

    return score;
  }

  private matchesAge(drill: any, age: number | null) {
    if (age === null) return true;

    const minOk = drill.ageMin == null || drill.ageMin <= age;
    const maxOk = drill.ageMax == null || drill.ageMax >= age;

    return minOk && maxOk;
  }

  private matchesBlockType(drill: any, blockType: string) {
    const category = String(drill.category ?? '').toLowerCase();

    if (blockType === 'warmup') {
      return category === 'warmup' || category === 'technical';
    }

    if (blockType === 'technical') {
      return category === 'technical';
    }

    if (blockType === 'possession') {
      return category === 'possession' || category === 'technical';
    }

    if (blockType === 'transition') {
      return category === 'game' || category === 'possession';
    }

    if (blockType === 'game') {
      return category === 'game' || category === 'finishing';
    }

    return true;
  }

  private matchesFocus(drill: any, focusTags: string[]) {
    if (!focusTags.length) return true;

    const drillTags = String(drill.focusTags ?? '').toLowerCase();

    return focusTags.some((tag) => drillTags.includes(tag.toLowerCase()));
  }

  private getBlockDescription(
    blockType: string,
    age: number | null,
    competitionLevel: string,
    weaknesses: string[],
  ) {
    const weaknessText =
      weaknesses.length > 0 ? ` Priority areas: ${weaknesses.join(', ')}.` : '';

    if (blockType === 'warmup') {
      if (age !== null && age <= 6) {
        return `Fun movement-based activation with lots of ball touches and simple instructions.${weaknessText}`;
      }
      return `Progressive warm-up with activation, ball work and scanning.${weaknessText}`;
    }

    if (blockType === 'technical') {
      if (age !== null && age <= 9) {
        return `Simple technical block focused on repetition, confidence and clean execution.${weaknessText}`;
      }
      return `Technical block adapted to ${competitionLevel} level players.${weaknessText}`;
    }

    if (blockType === 'possession') {
      return `Possession-focused block with support angles, scanning and decision making.${weaknessText}`;
    }

    if (blockType === 'transition') {
      return `Transition block focused on quick reactions and realistic game moments.${weaknessText}`;
    }

    if (blockType === 'game') {
      if (age !== null && age <= 8) {
        return `Simple game block focused on enjoyment, confidence and lots of involvement.${weaknessText}`;
      }
      return `Game-related block focused on transfer into match situations.${weaknessText}`;
    }

    return 'Session block';
  }

  private getCustomNotesForBlock(
    blockType: string,
    age: number | null,
    competitionLevel: string,
    weaknesses: string[],
  ) {
    const weaknessHint =
      weaknesses.length > 0
        ? ` Extra focus on ${weaknesses.slice(0, 2).join(' and ')}.`
        : '';

    if (age !== null && age <= 6) {
      return `Keep it fun, simple and active. Use short coaching points.${weaknessHint}`;
    }

    if (age !== null && age <= 9) {
      return `Use simple language and encourage lots of repetitions and confidence.${weaknessHint}`;
    }

    if (blockType === 'possession') {
      return `Coach body shape, support angles and awareness before receiving.${weaknessHint}`;
    }

    if (blockType === 'transition') {
      return `Emphasise reactions after winning or losing the ball.${weaknessHint}`;
    }

    if (
      (competitionLevel ?? '').toLowerCase() === 'advanced' ||
      (competitionLevel ?? '').toLowerCase() === 'elite academy'
    ) {
      return `Increase tempo and demand better decision making under pressure.${weaknessHint}`;
    }

    return `Emphasise quality, communication and good habits.${weaknessHint}`;
  }
}