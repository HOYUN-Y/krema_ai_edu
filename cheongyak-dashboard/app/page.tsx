import { Suspense } from "react";
import Dashboard from "./components/Dashboard";

// nuqs useQueryState는 Suspense boundary 필수 (Next.js prerender 함정)
export default function HomePage() {
  return (
    <Suspense fallback={<div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--sans)", color: "var(--muted)" }}>불러오는 중…</div>}>
      <Dashboard />
    </Suspense>
  );
}
