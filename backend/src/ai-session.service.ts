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
          include: { attributes: true },
        },
      },
    });

    return {
      teamSummary: team,
      draft: input.sessionDraft,
      aiNotes:
        'AI refinement placeholder. Integrate an LLM provider here to add coaching points and individual adjustments.',
    };
  }
}

