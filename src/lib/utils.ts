export { cn } from "cn";

export const money = (v: number): string =>
  `KES. ${Number(v || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const formatDate = (v: string | null): string =>
  v
    ? new Date(`${v}T12:00:00`).toLocaleDateString("en-KE", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "No deadline";
