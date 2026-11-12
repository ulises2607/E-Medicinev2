import AppShell from "@/app/components/appointments/AppShell";
import AvailabilityEditor from "@/app/components/appointments/AvailabilityEditor";
export default function Page() {
  return (
    <AppShell role="doctor">
      <AvailabilityEditor />
    </AppShell>
  );
}
