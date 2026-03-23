import { Module } from '@nestjs/common';
import { TeamsController } from './teams.controller';
import { TeamAnalyzerService } from './team-analyzer.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [TeamsController],
  providers: [TeamAnalyzerService, PrismaService],
  exports: [TeamAnalyzerService],
})
export class TeamsModule {}