import { Search } from "lucide-react";
import { EventState } from "@eventhub/shared";
import { eventStateLabel } from "../../lib/enumLabels";
import "./EventFilters.css";

interface EventFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  status: EventState | "all";
  onStatusChange: (value: EventState | "all") => void;
}

const filterableStates = [EventState.Published, EventState.Cancelled];

export default function EventFilters({ search, onSearchChange, status, onStatusChange }: EventFiltersProps) {
  return (
    <div className="event-filters">
      <label className="event-filters__search">
        <Search size={17} />
        <input
          type="search"
          placeholder="Search events by title or description…"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          aria-label="Search events"
        />
      </label>

      <select
        className="event-filters__status"
        value={status}
        onChange={(e) => onStatusChange(e.target.value === "all" ? "all" : (Number(e.target.value) as EventState))}
        aria-label="Filter by status"
      >
        <option value="all">All statuses</option>
        {filterableStates.map((state) => (
          <option key={state} value={state}>
            {eventStateLabel[state]}
          </option>
        ))}
      </select>
    </div>
  );
}
