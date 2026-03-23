import { Module } from '@nestjs/common';
import { AiDrillsController } from './ai-drills.controller';
import { AiDrillsService } from './ai-drills.service';

@Module({
  controllers: [AiDrillsController],
  providers: [AiDrillsService],
})
export class AiDrillsModule {}