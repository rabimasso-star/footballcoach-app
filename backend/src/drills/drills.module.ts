import { Module } from '@nestjs/common';
import { DrillsController } from './drills.controller';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [DrillsController],
  providers: [PrismaService],
})
export class DrillsModule {}