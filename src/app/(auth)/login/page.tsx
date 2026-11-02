import { AuthLayout } from "@/features/auth/components/AuthLayout";
import { LoginForm } from "@/features/auth/components/LoginForm";
import { safeRedirectPath } from "@/lib/auth/redirect";

export default async function LoginPage(props: PageProps<"/login">) {
  const searchParams = await props.searchParams;
  const redirectToRaw = searchParams.redirectTo;
  const redirectTo = Array.isArray(redirectToRaw)
    ? redirectToRaw[0]
    : redirectToRaw;

  return (
    <AuthLayout>
      <LoginForm redirectTo={safeRedirectPath(redirectTo)} />
    </AuthLayout>
  );
}
