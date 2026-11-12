import AppShell from "@/app/components/appointments/AppShell";
import BookingForm from "@/app/components/appointments/BookingForm";
export default function Page() {
  return (
    <AppShell role="patient">
      <div className="page-heading">
        <div>
          <h1>Reservar turno</h1>
          <p className="muted">
            Elegí profesional, fecha y un horario disponible.
          </p>
        </div>
      </div>
      <BookingForm />
    </AppShell>
  );
}
