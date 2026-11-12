export interface AppointmentDoctorInfo {
  user_id: number;
  speciality: string;
  usuario: Person;
}
export interface Person {
  id: number;
  first_name: string;
  last_name: string;
  photo_url?: string | null;
}
export interface AppointmentPatientInfo {
  user_id: number;
  usuario: Person;
}
export type AppointmentStatus =
  | "pending"
  | "confirmed"
  | "completed"
  | "canceled";
export interface Appointment {
  id: number;
  patient_user_id: number;
  doctor_user_id: number;
  appointment_date: string;
  start_time: string;
  end_time: string;
  status: AppointmentStatus;
  reason_for_consultation: string;
  doctor?: AppointmentDoctorInfo;
  paciente?: AppointmentPatientInfo;
}
export interface Doctor extends AppointmentDoctorInfo {
  consultation_value?: string | null;
  availability_status: string;
}
export interface Availability {
  day_of_week: string;
  start_time_morning: string | null;
  end_time_morning: string | null;
  start_time_afternoon: string | null;
  end_time_afternoon: string | null;
}
export interface SlotsResponse {
  date: string;
  timeZone: string;
  slotMinutes: number;
  slots: { startTime: string; endTime: string }[];
}
export interface AppConfig {
  timeZone: string;
  slotMinutes: number;
}
