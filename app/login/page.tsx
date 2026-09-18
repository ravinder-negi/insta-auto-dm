import { AuthLayout } from "../AuthLayout";
import { LoginForm } from "./LoginForm";

export default async function LoginPage(props: PageProps<"/login">) {
  const searchParams = await props.searchParams;
  const redirectToRaw = searchParams.redirectTo;
  const redirectTo = Array.isArray(redirectToRaw)
    ? redirectToRaw[0]
    : redirectToRaw;

  return (
    <AuthLayout>
      <LoginForm
        redirectTo={
          redirectTo && redirectTo.startsWith("/") ? redirectTo : "/dashboard/accounts"
        }
      />
    </AuthLayout>
  );
}
