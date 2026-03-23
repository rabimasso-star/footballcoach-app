import LoginForm from '@/features/auth/components/LoginForm';

export default function LoginPage() {
  return (
    <main className="mx-auto max-w-md py-10">
      <h1 className="mb-6 text-2xl font-bold">Logga in</h1>
      <LoginForm />
    </main>
  );
}