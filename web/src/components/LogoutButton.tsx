"use client";

import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", {
      method: "POST",
    });

    localStorage.removeItem("coach");
    localStorage.removeItem("accessToken"); // om du fortfarande sparar den
    router.push("/login");
    router.refresh();
  }

  return (
    <button onClick={handleLogout}>
      Log out
    </button>
  );
}