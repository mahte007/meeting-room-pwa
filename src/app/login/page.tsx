"use client";

import { FormEvent, Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";

/**
 * Only allows same-origin paths like "/reservations", so a crafted link such as
 * /login?redirect=https://evil.example can't send the user to another site.
 */
function getSafeRedirect(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/";
  }

  if (value.startsWith("/\\") || value.startsWith("/login")) {
    return "/";
  }

  return value;
}

function LoginForm() {
  const searchParams = useSearchParams();
  const { login } = useAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setError(null);
    setIsSubmitting(true);

    try {
      await login(
        { username, password },
        getSafeRedirect(searchParams.get("redirect")),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-2xl border bg-white p-6 shadow-sm"
    >
      <div>
        <label
          htmlFor="username"
          className="mb-2 block text-sm font-medium text-slate-700"
        >
          Username
        </label>
        <input
          id="username"
          autoComplete="username"
          required
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full rounded-xl border border-slate-300 px-4 py-2.5 outline-none focus:border-slate-500"
        />
      </div>

      <div>
        <label
          htmlFor="password"
          className="mb-2 block text-sm font-medium text-slate-700"
        >
          Password
        </label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-xl border border-slate-300 px-4 py-2.5 outline-none focus:border-slate-500"
        />
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      <button
        disabled={isSubmitting}
        className="w-full rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? "Logging in..." : "Login"}
      </button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <section className="mx-auto max-w-md space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Login</h1>
        <p className="mt-2 text-slate-700">
          Sign in to access the reservation system.
        </p>
      </div>

      {/* useSearchParams needs a Suspense boundary for static rendering. */}
      <Suspense>
        <LoginForm />
      </Suspense>
    </section>
  );
}
