import AppShell from "@/app/components/appointments/AppShell";
import AppointmentList from "@/app/components/appointments/AppointmentList";
export default function Page() {
  return (
    <AppShell role="patient">
      <AppointmentList />
    </AppShell>
  );
}
