import { money } from "@/lib/utils";
import React from "react";

type StatsCardsProps = {
  totalSavings: number;
  activeCount: number;
  completedCount: number;
};

export const StatsCards = ({
  totalSavings,
  activeCount,
  completedCount,
}: StatsCardsProps) => {
  return (
    <section
      className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-[1.65fr_1fr_1fr] gap-4"
      aria-label="Savings summary"
    >
      <div className="stat-card-primary">
        <div className="stat-label text-[#eee9e4]">Total savings</div>
        <div className="stat-value">{money(totalSavings)}</div>
      </div>

      <div className="stat-card">
        <div className="stat-label-muted">Active goals</div>
        <div className="stat-value text-primary">{activeCount}</div>
      </div>

      <div className="stat-card">
        <div className="stat-label-muted">Goals completed</div>
        <div className="stat-value text-success">{completedCount}</div>
      </div>
    </section>
  );
};
