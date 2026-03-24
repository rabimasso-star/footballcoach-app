'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createTeam } from '../api';

export default function CreateTeamForm() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [ageGroup, setAgeGroup] = useState('');
  const [level, setLevel] = useState('');
  const [formation, setFormation] = useState('');
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');

    try {
      await createTeam({ name, ageGroup, level, formation });
      router.refresh();
      setName('');
      setAgeGroup('');
      setLevel('');
      setFormation('');
    } catch {
      setError('Kunde inte skapa laget');
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded border p-4">
      <h2 className="text-lg font-semibold">Skapa lag</h2>

      <input
        type="text"
        placeholder="Lagnamn"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-full rounded border p-2"
      />

      <input
        type="text"
        placeholder="Åldersgrupp"
        value={ageGroup}
        onChange={(e) => setAgeGroup(e.target.value)}
        className="w-full rounded border p-2"
      />

      <input
        type="text"
        placeholder="Nivå"
        value={level}
        onChange={(e) => setLevel(e.target.value)}
        className="w-full rounded border p-2"
      />

      <input
        type="text"
        placeholder="Formation"
        value={formation}
        onChange={(e) => setFormation(e.target.value)}
        className="w-full rounded border p-2"
      />

      {error && <p className="text-red-600">{error}</p>}

      <button type="submit" className="rounded border px-4 py-2">
        Skapa lag
      </button>
    </form>
  );
}