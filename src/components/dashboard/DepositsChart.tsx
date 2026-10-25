import type { ChartRange, ChartType, SavingsTransactions } from "@/types";
import React, { useMemo, useState } from "react";
import { Button } from "../ui/button";
import { BarChartIcon, LineChartIcon } from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const monthNames = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const shortMoney = (v: number): string =>
  `KES ${Number(v || 0).toLocaleString("en-US", { maximumFractionDigits: 0 })}`;

const formatAxisKES = (v: number): string => {
  if (v >= 1000) return `${(v / 1000).toFixed(v >= 10000 ? 0 : 1)}K`;
  return String(v);
};

type ChartDatum = { label: string; amount: number };

const RANGES: { value: ChartRange; label: string }[] = [
  { value: "1d", label: "1D" },
  { value: "1w", label: "1W" },
  { value: "1m", label: "1M" },
  { value: "3m", label: "3M" },
  { value: "6m", label: "6M" },
  { value: "1y", label: "1Y" },
  { value: "2y", label: "2Y" },
  { value: "3y", label: "3Y" },
  { value: "lifetime", label: "Lifetime" },
];

function buildData(
  transactions: SavingsTransactions[],
  range: ChartRange,
): ChartDatum[] {
  const now = new Date();
  const deposits = transactions.filter((t) => t.transactionType === "deposit");

  if (range === "1d") {
    const todayKey = now.toISOString().slice(0, 10);
    const amount = deposits
      .filter((t) => t.transactionDate === todayKey)
      .reduce((sum, t) => sum + Number(t.amount), 0);

    return [{ label: "Today", amount }];
  }

  if (range === "1w") {
    const result: ChartDatum[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const label = d.toLocaleDateString("en-US", { weekday: "short" });
      const amount = deposits
        .filter((t) => t.transactionDate === key)
        .reduce((sum, t) => sum + Number(t.amount), 0);
      result.push({ label, amount });
    }

    return result;
  }

  if (range === "1m") {
    const result: ChartDatum[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const label = `${d.getMonth() + 1}/${d.getDate()}`;
      const amount = deposits
        .filter((t) => t.transactionDate === key)
        .reduce((sum, t) => sum + Number(t.amount), 0);
      result.push({ label, amount });
    }
    return result;
  }

  const months = {
    "3m": 3,
    "6m": 6,
    "1y": 12,
    "2y": 24,
    "3y": 36,
    lifetime: 0,
  } as const;

  const count = months[range];

  if (count === 0) {
    const earliest = deposits.reduce((min, t) => {
      const d = new Date(t.transactionDate + "T12:00:00");
      return d < min ? d : min;
    }, new Date());

    const totalMonths =
      (now.getFullYear() - earliest.getFullYear()) * 12 +
      (now.getMonth() - earliest.getMonth()) +
      1;
    const numBuckets = Math.max(1, totalMonths);

    const result: ChartDatum[] = [];
    for (let i = numBuckets - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const label = monthNames[d.getMonth()];
      const amount = deposits
        .filter((t) => t.transactionDate?.startsWith(key))
        .reduce((sum, t) => sum + Number(t.amount), 0);
      result.push({ label, amount });
    }
    return result;
  }

  const result: ChartDatum[] = [];
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = monthNames[d.getMonth()];
    const amount = deposits
      .filter((t) => t.transactionDate?.startsWith(key))
      .reduce((sum, t) => sum + Number(t.amount), 0);
    result.push({ label, amount });
  }
  return result;
}

export const DepositsChart = ({
  transactions,
}: {
  transactions: SavingsTransactions[];
}) => {
  const [chartType, setChartType] = useState<ChartType>("line");
  const [range, setRange] = useState<ChartRange>("1y");

  const data = useMemo(
    () => buildData(transactions, range),
    [transactions, range],
  );

  return (
    <section className="chart-section" aria-label="Deposit history">
      <div className="chart-header">
        <h2 className="chart-title">Deposits</h2>
        <div className="chart-toggle-group">
          <Button
            variant={chartType === "bar" ? "primary" : "secondary"}
            size="icon-sm"
            onClick={() => setChartType("bar")}
            aria-label="Bar chart"
          >
            <BarChartIcon size={14} />
          </Button>

          <Button
            variant={chartType === "line" ? "primary" : "secondary"}
            size="icon-sm"
            onClick={() => setChartType("line")}
            aria-label="Line chart"
          >
            <LineChartIcon size={14} />
          </Button>
        </div>
      </div>

      <div className="chart-range-bar">
        {RANGES.map((r) => (
          <button
            key={r.value}
            onClick={() => setRange(r.value)}
            className={`chart-range-btn ${range === r.value ? "chart-range-btn-active" : "chart-range-btn-inactive"}`}
          >
            {r.label}
          </button>
        ))}
      </div>

      <ResponsiveContainer width="100%" height={240}>
        {chartType === "bar" ? (
          <BarChart
            data={data}
            margin={{ top: 10, right: 6, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ff542c" stopOpacity={0.9} />
                <stop offset="100%" stopColor="#ff542c" stopOpacity={0.2} />
              </linearGradient>
            </defs>

            <XAxis
              dataKey="label"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#f0ece8", fontSize: 10, fontWeight: 600 }}
            />

            <YAxis
              tickFormatter={formatAxisKES}
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#a3a4a2", fontSize: 10, fontWeight: 600 }}
              width={42}
            />

            <Tooltip
              cursor={{ fill: "rgba(255, 84, 44, 0.08)" }}
              contentStyle={{
                background: "#1b1c1c",
                border: "1px solid #353635",
                borderRadius: "8px",
                fontSize: "12px",
                color: "#f6f5f2",
              }}
              formatter={(value) => [shortMoney(Number(value)), "Deposits"]}
              labelStyle={{ color: "#a3a4a2" }}
            />

            <Bar dataKey="amount" radius={[6, 6, 3, 3]} maxBarSize={42}>
              {data.map((entry, index) => (
                <Cell
                  key={index}
                  fill={entry.amount > 0 ? "url(#barGradient)" : "#353635"}
                />
              ))}
            </Bar>
          </BarChart>
        ) : (
          <AreaChart
            data={data}
            margin={{ top: 10, right: 6, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ff542c" stopOpacity={0.9} />
                <stop offset="100%" stopColor="#ff542c" stopOpacity={0.1} />
              </linearGradient>
            </defs>

            <XAxis
              dataKey="label"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#f0ece8", fontSize: 10, fontWeight: 600 }}
            />

            <YAxis
              tickFormatter={formatAxisKES}
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#a3a4a2", fontSize: 10, fontWeight: 600 }}
              width={42}
            />

            <Tooltip
              cursor={{ fill: "rgba(255, 84, 44, 0.3)" }}
              contentStyle={{
                background: "#1b1c1c",
                border: "1px solid #353635",
                borderRadius: "8px",
                fontSize: "12px",
                color: "#f6f5f2",
              }}
              formatter={(value) => [shortMoney(Number(value)), "Deposits"]}
              labelStyle={{ color: "#a3a4a2" }}
            />

            <Area
              type="monotone"
              dataKey="amount"
              stroke="#ff542c"
              strokeWidth={2}
              fill="url(#lineGradient)"
              dot={{ fill: "#ff542c", r: 3 }}
              activeDot={{ r: 5 }}
            />
          </AreaChart>
        )}
      </ResponsiveContainer>
    </section>
  );
};
