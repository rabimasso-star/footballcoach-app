import { Module } from '@nestjs/common';

import { AppController } from './app.controller';
import { AppService } from './app.service';

import { AiDrillsModule } from './ai-drills/ai-drills.module';
import { AuthModule } from './auth/auth.module';
import { TeamsModule } from './teams/teams.module';
import { PlayersModule } from './players/players.module';
import { DrillsModule } from './drills/drills.module';
import { SessionsModule } from './sessions/sessions.module';
import { PlannerModule } from './planner/planner.module';

@Module({
  imports: [
    AiDrillsModule,
    AuthModule,
    TeamsModule,
    PlayersModule,
    DrillsModule,
    SessionsModule,
    PlannerModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}