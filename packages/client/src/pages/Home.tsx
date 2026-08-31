import { Compass, Ticket, CalendarCheck, ArrowRight } from "lucide-react";
import { EventState } from "@eventhub/shared";
import Button from "../components/ui/Button";
import Spinner from "../components/ui/Spinner";
import Alert from "../components/ui/Alert";
import EmptyState from "../components/ui/EmptyState";
import EventGrid from "../components/events/EventGrid";
import { useEvents } from "../hooks/useEvents";
import { useAuth } from "../hooks/useAuth";
import { isOrganizer } from "../lib/roles";
import "./Home.css";

const steps = [
  { icon: Compass, title: "Browse events", description: "Explore what's published and find something worth going to." },
  { icon: Ticket, title: "Reserve a ticket", description: "Hold your spot — reservations are kept for a short window." },
  { icon: CalendarCheck, title: "Confirm & attend", description: "Confirm your reservation and show up with your ticket." },
];

export default function Home() {
  const { events, isLoading, error } = useEvents();
  const { user } = useAuth();

  const upcoming = events
    .filter((event) => event.status === EventState.Published)
    .sort((a, b) => {
      if (!a.date) return 1;
      if (!b.date) return -1;
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    })
    .slice(0, 6);

  return (
    <>
      <section className="hero">
        <div className="container hero__inner">
          <div className="hero__copy">
            <span className="hero__eyebrow">Event management, simplified</span>
            <h1 className="hero__title">Find events worth showing up for.</h1>
            <p className="hero__subtitle">
              EventHub connects organizers and attendees in one place — publish events, track
              capacity, and reserve tickets without the spreadsheet chaos.
            </p>
            <div className="hero__actions">
              <Button to="/events" variant="primary">
                Browse events <ArrowRight size={16} />
              </Button>
              {!user && (
                <Button to="/register" variant="secondary">
                  Create an account
                </Button>
              )}
              {user && isOrganizer(user) && (
                <Button to="/events/new" variant="secondary">
                  Create event
                </Button>
              )}
            </div>
          </div>
          <div className="hero__art" aria-hidden="true">
            <div className="hero__blob hero__blob--primary" />
            <div className="hero__blob hero__blob--accent" />
            <div className="hero__card">
              <Ticket size={20} />
              <div className="hero__card-lines">
                <span className="hero__card-line hero__card-line--wide" />
                <span className="hero__card-line" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container section">
        <div className="section__heading">
          <h2>Upcoming events</h2>
          <Button to="/events" variant="ghost">
            View all <ArrowRight size={15} />
          </Button>
        </div>

        {isLoading && <Spinner label="Loading events…" />}
        {!isLoading && error && <Alert tone="danger">{error}</Alert>}
        {!isLoading && !error && upcoming.length === 0 && (
          <EmptyState
            icon={CalendarCheck}
            title="No upcoming events yet"
            description="Published events with a confirmed date will show up here."
          />
        )}
        {!isLoading && !error && upcoming.length > 0 && <EventGrid events={upcoming} />}
      </section>

      <section className="container section steps">
        <h2 className="steps__heading">How it works</h2>
        <div className="steps__grid">
          {steps.map(({ icon: Icon, title, description }) => (
            <div className="steps__item" key={title}>
              <div className="steps__icon">
                <Icon size={20} />
              </div>
              <h3>{title}</h3>
              <p>{description}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
