import { apiFetch } from '@/lib/api';
import type { Team, CreateTeamPayload } from './types';

export function getTeams(): Promise<Team[]> {
  return apiFetch('/teams');
}

export function getTeam(id: string): Promise<Team> {
  return apiFetch(`/teams/${id}`);
}

export function createTeam(payload: CreateTeamPayload): Promise<Team> {
  return apiFetch('/teams', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}