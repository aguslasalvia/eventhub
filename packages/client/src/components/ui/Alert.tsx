import type { ReactNode } from "react";
import { CircleAlert, CircleCheck, Info } from "lucide-react";
import "./Alert.css";

type AlertTone = "danger" | "success" | "info";

const icons = { danger: CircleAlert, success: CircleCheck, info: Info } as const;

export default function Alert({ tone = "info", children }: { tone?: AlertTone; children: ReactNode }) {
  const Icon = icons[tone];
  return (
    <div className={`alert alert--${tone}`} role={tone === "danger" ? "alert" : "status"}>
      <Icon size={18} className="alert__icon" />
      <span>{children}</span>
    </div>
  );
}
