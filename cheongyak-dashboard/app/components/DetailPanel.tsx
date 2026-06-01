"use client";

import CompetitionChart from "./CompetitionChart";
import ApplicantStats from "./ApplicantStats";

export default function DetailPanel() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <CompetitionChart />
      <ApplicantStats />
    </div>
  );
}
