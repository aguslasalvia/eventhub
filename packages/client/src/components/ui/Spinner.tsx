import { LoaderCircle } from "lucide-react";
import "./Spinner.css";

export default function Spinner({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="spinner" role="status">
      <LoaderCircle className="spinner__icon" size={22} />
      <span>{label}</span>
    </div>
  );
}
