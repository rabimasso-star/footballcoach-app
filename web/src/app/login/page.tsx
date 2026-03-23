"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("demo@footballcoach.local");
  const [password, setPassword] = useState("demo1234");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMessage("");

    try {
      setIsSubmitting(true);

      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          password: password.trim(),
        }),
      });

      const text = await response.text();
      const data = text ? JSON.parse(text) : null;

      if (!response.ok) {
        throw new Error(data?.message || "Could not log in.");
      }

      if (data?.coach) {
        localStorage.setItem("coach", JSON.stringify(data.coach));
      }

      const redirectTo = searchParams.get("redirect") || "/teams";
      router.push(redirectTo);
      router.refresh();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Could not log in.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#f1f5f9",
        padding: 24,
      }}
    >
      <form
        onSubmit={handleLogin}
        style={{
          width: "100%",
          maxWidth: 420,
          background: "#fff",
          padding: 32,
          borderRadius: 20,
          border: "1px solid #e2e8f0",
          display: "grid",
          gap: 18,
        }}
      >
        <Link href="/" style={{ color: "#334155", textDecoration: "none" }}>
          ← Back
        </Link>

        <h1 style={{ fontSize: 32, margin: 0 }}>Coach login</h1>

        <div style={{ display: "grid", gap: 6 }}>
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={input}
            autoComplete="email"
          />
        </div>

        <div style={{ display: "grid", gap: 6 }}>
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={input}
            autoComplete="current-password"
          />
        </div>

        {errorMessage ? (
          <div
            style={{
              borderRadius: 12,
              background: "#fef2f2",
              color: "#991b1b",
              padding: "12px 14px",
            }}
          >
            {errorMessage}
          </div>
        ) : null}

        <button type="submit" style={loginButton} disabled={isSubmitting}>
          {isSubmitting ? "Logging in..." : "Log in"}
        </button>
      </form>
    </main>
  );
}

const input: React.CSSProperties = {
  padding: "12px",
  borderRadius: 10,
  border: "1px solid #cbd5e1",
};

const loginButton: React.CSSProperties = {
  padding: "14px",
  borderRadius: 12,
  border: "none",
  background: "#0f172a",
  color: "#fff",
  fontWeight: 600,
  cursor: "pointer",
};