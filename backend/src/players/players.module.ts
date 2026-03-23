import { Module } from '@nestjs/common';
import { PlayersController } from './players.controller';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [PlayersController],
  providers: [PrismaService],
})
export class PlayersModule {}