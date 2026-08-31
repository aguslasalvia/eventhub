import type { ReactNode } from "react";
import "./Badge.css";

export type BadgeTone = "success" | "neutral" | "danger" | "accent";

export default function Badge({ tone = "neutral", children }: { tone?: BadgeTone; children: ReactNode }) {
  return <span className={`badge badge--${tone}`}>{children}</span>;
}
