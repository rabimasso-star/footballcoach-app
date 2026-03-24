import {
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  IsNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateTeamDto {
  @IsOptional()
  @IsString()
  coachId?: string;

  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  ageGroup!: string;

  @IsString()
  @IsNotEmpty()
  competitionLevel!: string;

  @IsOptional()
  @IsString()
  primaryFormation?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(7)
  trainingDaysPerWeek?: number;

  @IsOptional()
  @IsString()
  primaryGoals?: string;
}