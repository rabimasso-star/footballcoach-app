import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from './prisma.service';
import { TeamsController } from './teams.controller';
import { PlayersController } from './players.controller';
import { DrillsController } from './drills.controller';
import { SessionsController } from './sessions.controller';
import { RuleBasedPlannerService } from './rule-based-planner.service';
import { AiSessionService } from './ai-session.service';

@Module({
  imports: [],
  controllers: [
    AppController,
    TeamsController,
    PlayersController,
    DrillsController,
    SessionsController,
  ],
  providers: [
    AppService,
    PrismaService,
    RuleBasedPlannerService,
    AiSessionService,
  ],
})
export class AppModule {}
