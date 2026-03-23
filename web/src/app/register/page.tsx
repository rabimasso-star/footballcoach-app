import RegisterForm from '@/features/auth/components/RegisterForm';

export default function RegisterPage() {
  return (
    <main className="mx-auto max-w-md py-10">
      <h1 className="mb-6 text-2xl font-bold">Skapa konto</h1>
      <RegisterForm />
    </main>
  );
}