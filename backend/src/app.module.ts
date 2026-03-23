import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from './prisma.service';
import { TeamsController } from './teams.controller';
import { PlayersController } from './players.controller';
import { DrillsController } from './drills.controller';
import { SessionsController, TeamSessionsController } from './sessions.controller';
import { PlansController } from './plans.controller';
import { RuleBasedPlannerService } from './rule-based-planner.service';
import { AiSessionService } from './ai-session.service';
import { TeamAnalyzerService } from './team-analyzer.service';
import { SessionHistoryService } from './session-history.service';
import { AiDrillsModule } from './ai-drills/ai-drills.module';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.strategy';

@Module({
  imports: [
    AiDrillsModule,
    PassportModule,
    JwtModule.register({
      secret: 'super-secret-coach-key',
      signOptions: { expiresIn: '7d' },
    }),
  ],
  controllers: [
    AppController,
    TeamsController,
    PlayersController,
    DrillsController,
    SessionsController,
    TeamSessionsController,
    PlansController,
    AuthController,
  ],
  providers: [
    AppService,
    PrismaService,
    RuleBasedPlannerService,
    AiSessionService,
    TeamAnalyzerService,
    SessionHistoryService,
    JwtStrategy,
  ],
})
export class AppModule {}