import AppShell from "@/app/components/appointments/AppShell";
import Dashboard from "@/app/components/appointments/Dashboard";
export default function Page() {
  return (
    <AppShell role="patient">
      <Dashboard />
    </AppShell>
  );
}
