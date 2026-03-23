import { Module } from '@nestjs/common';
import { PlansController } from './plans.controller';
import { RuleBasedPlannerService } from './rule-based-planner.service';
import { AiSessionService } from './ai-session.service';
import { PrismaService } from '../prisma/prisma.service';
import { TeamAnalyzerService } from '../teams/team-analyzer.service';
import { SessionHistoryService } from '../sessions/session-history.service';

@Module({
  controllers: [PlansController],
  providers: [
    RuleBasedPlannerService,
    AiSessionService,
    PrismaService,
    TeamAnalyzerService,
    SessionHistoryService,
  ],
  exports: [RuleBasedPlannerService, AiSessionService],
})
export class PlannerModule {}