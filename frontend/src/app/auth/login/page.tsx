import LoginForm from "@/app/components/authentication/loginForm";
// El AuthHeader ya debería estar en src/app/auth/layout.tsx

export default function LoginPage() {
  return (
    // El layout /auth/layout.tsx ya centra el contenido y muestra el AuthHeader
    <LoginForm />
  );
}
