import { BrowserRouter, Route, Routes } from "react-router";
import { Toaster } from "react-hot-toast";
import { EventsProvider } from "./context/EventsContext";
import { AuthProvider } from "./context/AuthContext";
import Layout from "./components/layout/Layout";
import Home from "./pages/Home";
import Events from "./pages/Events";
import EventDetail from "./pages/EventDetail";
import CreateEvent from "./pages/CreateEvent";
import EditEvent from "./pages/EditEvent";
import OrganizerDashboard from "./pages/OrganizerDashboard";
import ManageTicketTypes from "./pages/ManageTicketTypes";
import MyTickets from "./pages/MyTickets";
import Register from "./pages/Register";
import Login from "./pages/Login";
import PaypalSuccess from "./pages/PaypalSuccess";
import PaypalCancel from "./pages/PaypalCancel";
import NotFound from "./pages/NotFound";

export default function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: "var(--color-surface)",
            color: "var(--color-text)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-md)",
            boxShadow: "var(--shadow-md)",
            fontSize: "0.9rem",
            padding: "var(--space-3) var(--space-4)",
          },
          success: {
            iconTheme: { primary: "var(--color-success)", secondary: "var(--color-success-soft)" },
          },
          error: {
            iconTheme: { primary: "var(--color-danger)", secondary: "var(--color-danger-soft)" },
          },
        }}
      />
      <AuthProvider>
        <EventsProvider>
          <Routes>
            <Route element={<Layout />}>
              <Route index path="/" element={<Home />} />
              <Route path="/events" element={<Events />} />
              <Route path="/events/new" element={<CreateEvent />} />
              <Route path="/events/:id/edit" element={<EditEvent />} />
              <Route path="/events/:id/tickets" element={<ManageTicketTypes />} />
              <Route path="/events/:id" element={<EventDetail />} />
              <Route path="/dashboard" element={<OrganizerDashboard />} />
              <Route path="/my-tickets" element={<MyTickets />} />
              <Route path="/register" element={<Register />} />
              <Route path="/login" element={<Login />} />
              <Route path="/paypal/success" element={<PaypalSuccess />} />
              <Route path="/paypal/cancel" element={<PaypalCancel />} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </EventsProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
