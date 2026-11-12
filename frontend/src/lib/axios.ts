import axios from "axios";
// Same-origin requests keep the HttpOnly session cookie on the frontend domain.
const apiClient = axios.create({
  baseURL: "/api",
  withCredentials: true,
  timeout: 15000,
});
export function errorMessage(error: unknown) {
  if (axios.isAxiosError(error))
    return (
      error.response?.data?.message ||
      "No pudimos conectar con el servidor. Intentá nuevamente."
    );
  return error instanceof Error
    ? error.message
    : "No pudimos completar la operación.";
}
export default apiClient;
