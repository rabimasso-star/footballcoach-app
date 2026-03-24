export type Team = {
  id: string;
  name: string;
  ageGroup?: string;
  level?: string;
  formation?: string;
  createdAt?: string;
};

export type CreateTeamPayload = {
  name: string;
  ageGroup?: string;
  level?: string;
  formation?: string;
};