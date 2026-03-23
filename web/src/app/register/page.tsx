import Link from 'next/link';
import RegisterForm from '@/features/auth/components/RegisterForm';

export default function RegisterPage() {
  return (
    <main className="mx-auto max-w-md py-10">
      <h1 className="mb-6 text-2xl font-bold">Skapa konto</h1>
      <RegisterForm />

      <p className="mt-4 text-sm">
        Har du redan ett konto?{' '}
        <Link href="/login" className="underline">
          Logga in
        </Link>
      </p>
    </main>
  );
}