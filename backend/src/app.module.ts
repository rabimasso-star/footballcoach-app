import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from './prisma.service';
import { TeamsController } from './teams.controller';
import { PlayersController } from './players.controller';
import { DrillsController } from './drills.controller';
import { SessionsController } from './sessions.controller';
import { PlansController } from './plans.controller';
import { RuleBasedPlannerService } from './rule-based-planner.service';
import { AiSessionService } from './ai-session.service';
import { TeamAnalyzerService } from './team-analyzer.service';
import { SessionHistoryService } from './session-history.service';

@Module({
  imports: [],
  controllers: [
    AppController,
    TeamsController,
    PlayersController,
    DrillsController,
    SessionsController,
    PlansController,
  ],
  providers: [
    AppService,
    PrismaService,
    RuleBasedPlannerService,
    AiSessionService,
    TeamAnalyzerService,
    SessionHistoryService,
  ],
})
export class AppModule {}