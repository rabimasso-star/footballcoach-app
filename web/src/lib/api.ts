export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000/api/v1";

export async function apiFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("accessToken")
      : null;

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers || {}),
    },
    cache: "no-store",
  });

  const text = await response.text();

  if (!response.ok) {
    throw new Error(text || `Request failed with status ${response.status}`);
  }

  if (!text.trim()) {
    return null as T;
  }

  return JSON.parse(text) as T;
}

export type CreateTeamPayload = {
  coachId?: string;
  name: string;
  ageGroup: string;
  competitionLevel: string;
  primaryFormation?: string;
  trainingDaysPerWeek?: number;
  primaryGoals?: string;
};

export type PlayerAttributeSet = {
  speed: number;
  endurance: number;
  strength: number;
  dribbling: number;
  passing: number;
  shooting: number;
  firstTouch: number;
  tackling: number;
  positioning: number;
  decisionMaking: number;
  confidence: number;
  attitude: number;
  strengths?: string | null;
  weaknesses?: string | null;
};

export type Player = {
  id: string;
  name: string;
  positions?: string | null;
  dominantFoot?: string | null;
  notes?: string | null;
  attributes?: PlayerAttributeSet | null;
};

export type Team = {
  id: string;
  coachId?: string | null;
  name: string;
  ageGroup: string;
  competitionLevel: string;
  primaryFormation?: string | null;
  trainingDaysPerWeek?: number | null;
  primaryGoals?: string | null;
  players: Player[];
};

export type SessionDrillItem = {
  id?: string;
  order?: number;
  customNotes?: string | null;
  drill?: {
    id?: string;
    title?: string | null;
    name?: string | null;
    description?: string | null;
  } | null;
};

export type SessionBlock = {
  id: string;
  title?: string | null;
  type?: string | null;
  durationMinutes: number;
  focus?: string | null;
  focusTags?: string[] | null;
  description?: string | null;
  notes?: string | null;
  orderIndex?: number;
  order?: number;
  drills?: SessionDrillItem[];
};

export type TrainingSession = {
  id: string;
  title: string;
  date?: string | null;
  durationMinutes?: number | null;
  intensity?: string | null;
  mainFocus?: string | null;
  teamId: string;
  blocks?: SessionBlock[];
  createdAt?: string;
  updatedAt?: string;
};

export type UpdateSessionPayload = {
  title: string;
  date?: string;
  durationMinutes?: number;
  intensity?: string;
  mainFocus?: string;
};

export async function createTeam(payload: CreateTeamPayload) {
  return apiFetch<{ id: string }>("/teams", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getTeam(teamId: string) {
  return apiFetch<Team>(`/teams/${teamId}`);
}

export async function getTeams() {
  return apiFetch<Team[]>("/teams");
}

export async function getTeamSessions(teamId: string) {
  return apiFetch<TrainingSession[]>(`/teams/${teamId}/sessions`);
}

export async function getSession(teamId: string, sessionId: string) {
  return apiFetch<TrainingSession>(`/teams/${teamId}/sessions/${sessionId}`);
}

export async function updateSession(
  sessionId: string,
  payload: UpdateSessionPayload,
) {
  return apiFetch<TrainingSession>(`/sessions/${sessionId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function duplicateSession(sessionId: string) {
  return apiFetch<TrainingSession>(`/sessions/${sessionId}/duplicate`, {
    method: "POST",
  });
}