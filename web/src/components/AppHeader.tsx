import LogoutButton from "@/components/LogoutButton";

export default function AppHeader() {
  return (
    <header
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "16px 24px",
        borderBottom: "1px solid #e2e8f0",
        background: "#fff",
      }}
    >
      <div>Football Coach</div>
      <LogoutButton />
    </header>
  );
}