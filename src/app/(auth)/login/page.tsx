"use client";

import { useFormStatus } from "react-dom";
import { Suspense, useEffect, useRef, useActionState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LockClosedIcon } from "@heroicons/react/24/solid";
import { loginAction, type LoginState } from "@/app/actions/auth";
import { Button } from "@/components/ui/Button";

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/";
  const [state, formAction] = useActionState<LoginState, FormData>(loginAction, {});
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (state.ok) router.replace(next);
  }, [state.ok, router, next]);

  useEffect(() => {
    if (state.error) inputRef.current?.focus();
  }, [state.error]);

  return (
    <main className="flex-1 flex items-center justify-center px-6 py-10">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-16 h-16 rounded-3xl bg-accent flex items-center justify-center mb-4 shadow-lg">
            <LockClosedIcon className="w-8 h-8 text-white" />
          </div>
          <h1 className="display text-2xl font-semibold">اقساط یار</h1>
          <p className="text-fg-tertiary text-[15px] mt-1">
            برای ورود رمز عبور اپراتور را وارد کنید
          </p>
        </div>

        <form action={formAction} className="space-y-3">
          <input
            ref={inputRef}
            name="password"
            type="password"
            autoComplete="current-password"
            placeholder="رمز عبور"
            className="w-full h-12 px-4 rounded-card bg-surface-elevated border border-separator text-base outline-none focus:border-accent transition-colors text-center tracking-widest"
            aria-invalid={!!state.error}
            aria-describedby={state.error ? "login-error" : undefined}
          />

          {state.error && (
            <p
              id="login-error"
              role="alert"
              className="text-[13px] text-danger text-center"
            >
              {state.error}
            </p>
          )}

          <SubmitButton />
        </form>

        <p className="text-center text-[12px] text-fg-tertiary mt-6 leading-relaxed">
          رمز پیش‌فرض نسخهٔ توسعه: admin123
          <br />
          (در نسخه نهایی تغییر دهید)
        </p>
      </div>
    </main>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" className="w-full" disabled={pending}>
      {pending ? "در حال ورود…" : "ورود"}
    </Button>
  );
}
