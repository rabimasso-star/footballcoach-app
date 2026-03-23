import { Module } from '@nestjs/common';
import { SessionsController, TeamSessionsController } from './sessions.controller';
import { SessionHistoryService } from './session-history.service';
import { PrismaService } from '../prisma/prisma.service';
import { RuleBasedPlannerService } from '../planner/rule-based-planner.service';
import { AiSessionService } from '../planner/ai-session.service';
import { TeamAnalyzerService } from '../teams/team-analyzer.service';

@Module({
  controllers: [SessionsController, TeamSessionsController],
  providers: [
    SessionHistoryService,
    PrismaService,
    RuleBasedPlannerService,
    AiSessionService,
    TeamAnalyzerService,
  ],
  exports: [SessionHistoryService],
})
export class SessionsModule {}