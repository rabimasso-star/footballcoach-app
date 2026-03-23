import { Body, Controller, Post, BadRequestException } from '@nestjs/common';
import { AiDrillsService } from './ai-drills.service';

@Controller({ path: 'ai/drills', version: '1' })
export class AiDrillsController {
  constructor(private readonly aiDrillsService: AiDrillsService) {}

  @Post('generate')
  async generate(@Body('prompt') prompt: string) {
    const cleanPrompt = String(prompt || '').trim();

    if (!cleanPrompt) {
      throw new BadRequestException('Prompt is required.');
    }

    return this.aiDrillsService.generateDrill(cleanPrompt);
  }
}