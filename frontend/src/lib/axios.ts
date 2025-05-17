import axios from "axios";

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL, // Ejemplo: http://localhost:4700/api
  withCredentials: true, // para el manejo de cookies HttpOnly cross-origin!
});

// Opcional: Interceptor para manejar errores de respuesta globalmente
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Ejemplo: si el backend devuelve un 401 (No autorizado) porque la cookie/sesión no es válida.
    // Podrías tener lógica aquí para desloguear al usuario automáticamente si es un error 401.
    // Pero esto también se puede manejar en el AuthContext o donde se hace la llamada.
    if (error.response && error.response.status === 401) {
      console.error(
        "AXIOS INTERCEPTOR: Error 401 - No autorizado o sesión expirada."
      );
      // Aquí NO debería llamar a `logout()` del AuthContext directamente porque este
      // es un módulo de bajo nivel. En su lugar, el AuthContext o el componente que
      // hizo la llamada debería manejar la lógica de deslogueo.
      // Lo importante es que el error se propague.
    }
    return Promise.reject(error); // Propagar el error para que sea manejado por quien llamó
  }
);

export default apiClient;
