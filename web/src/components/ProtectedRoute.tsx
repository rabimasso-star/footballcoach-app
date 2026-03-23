"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function ProtectedRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch("/api/auth/me");

        if (!res.ok) {
          router.replace("/login");
          return;
        }

        setIsChecking(false);
      } catch {
        router.replace("/login");
      }
    }

    checkAuth();
  }, [router]);

  if (isChecking) {
    return (
      <main style={{ padding: 32 }}>
        <p>Checking login...</p>
      </main>
    );
  }

  return <>{children}</>;
}