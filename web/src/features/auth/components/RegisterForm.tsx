'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { registerRequest } from '../api';
import { saveToken } from '../hooks/useAuth';

export default function RegisterForm() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');

    try {
      const data = await registerRequest({ name, email, password });
      saveToken(data.access_token);
      router.push('/teams');
    } catch {
      setError('Registreringen misslyckades');
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input
        type="text"
        placeholder="Namn"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-full rounded border p-2"
      />
      <input
        type="email"
        placeholder="E-post"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full rounded border p-2"
      />
      <input
        type="password"
        placeholder="Lösenord"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="w-full rounded border p-2"
      />
      {error && <p className="text-red-600">{error}</p>}
      <button type="submit" className="rounded border px-4 py-2">
        Skapa konto
      </button>
    </form>
  );
}