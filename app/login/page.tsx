import { LoginForm } from "./LoginForm";
import { BrandingPanel } from "./BrandingPanel";

export default async function LoginPage(props: PageProps<"/login">) {
  const searchParams = await props.searchParams;
  const redirectToRaw = searchParams.redirectTo;
  const redirectTo = Array.isArray(redirectToRaw)
    ? redirectToRaw[0]
    : redirectToRaw;

  return (
    <div className="flex min-h-screen flex-1 flex-col lg:flex-row">
      <div className="order-1 flex flex-1 items-center justify-center bg-zinc-50 px-4 py-12 sm:py-16 lg:order-2 dark:bg-black">
        <LoginForm
          redirectTo={
            redirectTo && redirectTo.startsWith("/") ? redirectTo : "/dashboard"
          }
        />
      </div>
      <div className="order-2 lg:order-1 lg:flex-1">
        <BrandingPanel />
      </div>
    </div>
  );
}
