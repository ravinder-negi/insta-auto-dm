import { LoginForm } from "./LoginForm";

export default async function LoginPage(props: PageProps<"/login">) {
  const searchParams = await props.searchParams;
  const redirectToRaw = searchParams.redirectTo;
  const redirectTo = Array.isArray(redirectToRaw)
    ? redirectToRaw[0]
    : redirectToRaw;

  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 px-4 py-16 dark:bg-black">
      <LoginForm redirectTo={redirectTo && redirectTo.startsWith("/") ? redirectTo : "/dashboard"} />
    </div>
  );
}
