import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Injectable()
export class SessionHistoryService {
  constructor(private readonly prisma: PrismaService) {}

  async getRecentFocuses(teamId: string, limit = 5): Promise<string[]> {
    const sessions = await this.prisma.trainingSession.findMany({
      where: { teamId },
      orderBy: {
        date: 'desc',
      },
      take: limit,
    });

    const focuses = sessions
      .map((session) => String(session.mainFocusTags || ''))
      .flatMap((value) =>
        value
          .split(',')
          .map((tag) => tag.trim().toLowerCase())
          .filter(Boolean),
      );

    return [...new Set(focuses)];
  }
}