import { signIn, auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
}) {
  const session = await auth();
  const params = await searchParams;
  if (session?.user?.id) redirect(params.callbackUrl ?? "/");

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-zinc-100">
      <div className="w-full max-w-sm space-y-6 p-8 rounded-lg border border-zinc-800 bg-zinc-900">
        <div className="space-y-2">
          <h1 className="text-xl font-semibold">Sign in</h1>
          <p className="text-sm text-zinc-400">
            Sign in with your Google account to access your fantasy data.
          </p>
        </div>

        {params.error === "AccessDenied" && (
          <p className="text-sm text-red-400">
            Your email isn&apos;t on the allowlist. Contact the admin to be
            added.
          </p>
        )}

        <form
          action={async () => {
            "use server";
            await signIn("google", { redirectTo: params.callbackUrl ?? "/" });
          }}
        >
          <button
            type="submit"
            className="w-full rounded-md bg-white text-zinc-900 px-4 py-2 text-sm font-medium hover:bg-zinc-200"
          >
            Continue with Google
          </button>
        </form>
      </div>
    </div>
  );
}
