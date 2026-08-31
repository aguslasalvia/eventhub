import type { ComponentType } from "react";
import type { LucideProps } from "lucide-react";
import "./EmptyState.css";

interface EmptyStateProps {
  icon: ComponentType<LucideProps>;
  title: string;
  description?: string;
}

export default function EmptyState({ icon: Icon, title, description }: EmptyStateProps) {
  return (
    <div className="empty-state">
      <Icon className="empty-state__icon" size={32} strokeWidth={1.5} />
      <p className="empty-state__title">{title}</p>
      {description && <p className="empty-state__description">{description}</p>}
    </div>
  );
}
