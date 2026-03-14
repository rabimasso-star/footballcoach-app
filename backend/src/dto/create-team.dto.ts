import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreateTeamDto {
  @IsOptional()
  @IsString()
  coachId?: string;

  @IsString()
  name!: string;

  @IsString()
  ageGroup!: string;

  @IsString()
  competitionLevel!: string;

  @IsOptional()
  @IsString()
  primaryFormation?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(7)
  trainingDaysPerWeek?: number;

  @IsOptional()
  @IsString()
  primaryGoals?: string;
}