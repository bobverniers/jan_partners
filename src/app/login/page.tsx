import { LoginForm } from "@/app/login/login-form";

export default function LoginPage() {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
          Internal
        </p>
        <h1 className="mt-1 text-xl font-semibold text-zinc-900">
          Hotel Managers
        </h1>
        <p className="mt-2 text-sm text-zinc-500">
          Sign in to view and edit the database.
        </p>
        <LoginForm />
      </div>
    </main>
  );
}
