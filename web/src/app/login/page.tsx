import Link from 'next/link';
import LoginForm from '@/features/auth/components/LoginForm';

export default function LoginPage() {
  return (
    <main className="mx-auto max-w-md py-10">
      <h1 className="mb-6 text-2xl font-bold">Logga in</h1>
      <LoginForm />

      <p className="mt-4 text-sm">
        Har du inget konto?{' '}
        <Link href="/register" className="underline">
          Skapa konto
        </Link>
      </p>
    </main>
  );
}