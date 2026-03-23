import { Injectable, InternalServerErrorException } from '@nestjs/common';
import OpenAI from 'openai';

@Injectable()
export class AiDrillsService {
  private client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  async generateDrill(prompt: string) {
    try {
      const response = await this.client.responses.create({
        model: 'gpt-5',
        input: [
          {
            role: 'developer',
            content: `
You are a professional football coaching assistant.

Generate a football drill draft from the user's prompt.

Return ONLY valid JSON with exactly this structure:

{
  "name": "",
  "description": "",
  "objectives": "",
  "category": "warmup",
  "focusTags": "",
  "difficulty": 1,
  "minPlayers": 4,
  "maxPlayers": 8,
  "durationMin": 10,
  "intensity": 1,
  "equipment": "",
  "pitchArea": "",
  "ageMin": 10,
  "ageMax": 12
}

Rules:
- category must be one of: warmup, technical, possession, finishing, game
- difficulty must be between 1 and 5
- intensity must be between 1 and 3
- minPlayers and maxPlayers must be realistic
- durationMin must be a positive integer
- focusTags should be comma-separated
- return JSON only
            `.trim(),
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      const text = response.output_text?.trim() || '{}';
      const parsed = JSON.parse(text);

      return {
        name: parsed.name || '',
        description: parsed.description || '',
        objectives: parsed.objectives || '',
        category: parsed.category || 'technical',
        focusTags: parsed.focusTags || '',
        difficulty: Number(parsed.difficulty || 1),
        minPlayers: Number(parsed.minPlayers || 4),
        maxPlayers: Number(parsed.maxPlayers || 8),
        durationMin: Number(parsed.durationMin || 10),
        intensity: Number(parsed.intensity || 1),
        equipment: parsed.equipment || '',
        pitchArea: parsed.pitchArea || '',
        ageMin:
          parsed.ageMin === null || parsed.ageMin === undefined
            ? null
            : Number(parsed.ageMin),
        ageMax:
          parsed.ageMax === null || parsed.ageMax === undefined
            ? null
            : Number(parsed.ageMax),
      };
    } catch (error) {
      console.error('AI drill generation failed:', error);
      throw new InternalServerErrorException(
        'Could not generate drill with AI.',
      );
    }
  }
}