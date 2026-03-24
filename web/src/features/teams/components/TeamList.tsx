'use client';

import Link from 'next/link';
import type { Team } from '../types';

type Props = {
  teams: Team[];
};

export default function TeamList({ teams }: Props) {
  if (!teams.length) {
    return <p>Inga lag ännu.</p>;
  }

  return (
    <div className="space-y-3">
      {teams.map((team) => (
        <Link
          key={team.id}
          href={`/teams/${team.id}`}
          className="block rounded border p-4"
        >
          <h2 className="text-lg font-semibold">{team.name}</h2>
          <p className="text-sm text-gray-600">
            {team.ageGroup || 'Ingen åldersgrupp'} • {team.level || 'Ingen nivå'}
          </p>
        </Link>
      ))}
    </div>
  );
}