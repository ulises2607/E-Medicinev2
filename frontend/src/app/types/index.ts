export interface AppointmentDoctorInfo {
  user_id: number | string;
  speciality: string;
  usuario: {
    id: number | string;
    first_name: string;
    last_name: string;
    photo_url?: string | null;
  };
}

export interface Appointment {
  id: number | string;
  patient_user_id: number | string;
  doctor_user_id: number | string;
  appointment_date: string;
  start_time: string;
  end_time: string;
  status: "pending" | "confirmed" | "completed" | "canceled";
  reason_for_consultation?: string | null;
  doctor?: AppointmentDoctorInfo;
  paciente?: AppointmentPatientInfo;
  registroConsulta?: any | null;
}

export interface AppointmentPatientInfo {
  // Información del paciente para la vista del doctor
  user_id: number | string;
  usuario: {
    // El alias 'usuario'
    id: number | string;
    first_name: string;
    last_name: string;
    photo_url?: string | null;
  };
}
