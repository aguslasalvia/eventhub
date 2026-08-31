import { CompassIcon } from "lucide-react";
import Button from "../components/ui/Button";
import "./NotFound.css";

export default function NotFound() {
  return (
    <section className="container section not-found">
      <CompassIcon size={40} strokeWidth={1.5} />
      <h1>Page not found</h1>
      <p>The page you're looking for doesn't exist or was moved.</p>
      <Button to="/" variant="primary">
        Back to home
      </Button>
    </section>
  );
}
