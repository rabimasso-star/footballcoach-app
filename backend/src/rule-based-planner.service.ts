import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';

export type AutoPlanInput = {
  teamId: string;
  coachId: string;
  date: string;
  durationMinutes: number;
  intensity: number;
  mainFocusTags?: string; // comma-separated tags e.g. "finishing,pressing"
};

export type PlannedSessionDraft = {
  title: string;
  teamId: string;
  coachId: string;
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

@Injectable()
export class RuleBasedPlannerService {
  constructor(private readonly prisma: PrismaService) {}

  async autoPlan(input: AutoPlanInput): Promise<PlannedSessionDraft> {
    const { teamId, coachId, durationMinutes, intensity, mainFocusTags, date } =
      input;

    const team = await this.prisma.team.findUnique({
      where: { id: teamId },
      include: {
        players: {
          include: { attributes: true },
        },
      },
    });

    if (!team) {
      throw new Error('Team not found');
    }

    const tags = (mainFocusTags ?? '').toLowerCase().split(',').map((t) => t.trim()).filter(Boolean);

    const allDrills = await this.prisma.drill.findMany({
      where: {
        OR: tags.length
          ? tags.map((t) => ({
              focusTags: {
                contains: t,
                mode: 'insensitive',
              },
            }))
          : undefined,
      },
      orderBy: { difficulty: 'asc' },
    });

    const pickDrills = (count: number, filter: (d: (typeof allDrills)[number]) => boolean) => {
      const filtered = allDrills.filter(filter);
      return filtered.slice(0, count);
    };

    const warmupDrills = pickDrills(
      1,
      (d) => d.intensity <= Math.max(1, intensity - 1),
    );

    const technicalDrills = pickDrills(
      2,
      (d) => d.intensity === intensity || d.intensity === intensity - 1,
    );

    const gameDrills = pickDrills(
      1,
      (d) => d.intensity >= intensity,
    );

    const warmupDuration = Math.round(durationMinutes * 0.2);
    const technicalDuration = Math.round(durationMinutes * 0.5);
    const gameDuration = durationMinutes - warmupDuration - technicalDuration;

    let blockOrder = 1;

    const blocks: PlannedSessionDraft['blocks'] = [];

    if (warmupDrills.length) {
      blocks.push({
        type: 'warmup',
        order: blockOrder++,
        durationMinutes: warmupDuration,
        focusTags: mainFocusTags,
        description: 'Dynamic warmup and activation.',
        drills: warmupDrills.map((d, index) => ({
          drillId: d.id,
          order: index + 1,
          customNotes: 'Light intensity to prepare players.',
        })),
      });
    }

    if (technicalDrills.length) {
      blocks.push({
        type: 'technical',
        order: blockOrder++,
        durationMinutes: technicalDuration,
        focusTags: mainFocusTags,
        description: 'Main technical focus block.',
        drills: technicalDrills.map((d, index) => ({
          drillId: d.id,
          order: index + 1,
          customNotes: 'Emphasise repetition and quality.',
        })),
      });
    }

    if (gameDrills.length) {
      blocks.push({
        type: 'game',
        order: blockOrder++,
        durationMinutes: gameDuration,
        focusTags: mainFocusTags,
        description: 'Small-sided or conditioned games.',
        drills: gameDrills.map((d, index) => ({
          drillId: d.id,
          order: index + 1,
          customNotes: 'Encourage transfer of training to game situations.',
        })),
      });
    }

    return {
      title:
        tags.length > 0
          ? `Training: ${tags.join(', ')}`
          : 'Training session',
      teamId,
      coachId,
      date,
      durationMinutes,
      intensity,
      mainFocusTags,
      createdBy: 'rule_engine',
      blocks,
    };
  }
}

