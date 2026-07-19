"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { verifyPassword } from "@/lib/auth";
import { createSession, destroySession } from "@/lib/session";

const LoginSchema = z.object({
  password: z.string().min(1, "رمز عبور را وارد کنید"),
});

export type LoginState = {
  error?: string;
  ok?: boolean;
};

export async function loginAction(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const parsed = LoginSchema.safeParse({
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "ورود نامعتبر" };
  }

  if (!verifyPassword(parsed.data.password)) {
    return { error: "رمز عبور نادرست است" };
  }

  await createSession();
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function logoutAction(): Promise<void> {
  await destroySession();
  revalidatePath("/", "layout");
}
