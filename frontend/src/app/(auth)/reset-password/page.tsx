"use client";

import { AuthShell } from "@/components/auth/AuthShell";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { resetPassword } from "@/lib/api/services";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const schema = z
  .object({
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(6, "Confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type FormValues = z.infer<typeof schema>;

export default function ResetPasswordPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = handleSubmit(async (values) => {
    setSubmitting(true);
    try {
      const result = await resetPassword("demo-token", values.password);
      toast.success(result.message);
      router.push("/login");
    } finally {
      setSubmitting(false);
    }
  });

  return (
    <AuthShell title="Reset password" subtitle="Choose a new password for your WhatsRep account.">
      <form onSubmit={onSubmit} className="space-y-4">
        <Input
          label="New password"
          type="password"
          placeholder="••••••••"
          error={errors.password?.message}
          {...register("password")}
        />
        <Input
          label="Confirm password"
          type="password"
          placeholder="••••••••"
          error={errors.confirmPassword?.message}
          {...register("confirmPassword")}
        />
        <Button type="submit" className="w-full" loading={submitting}>
          Update password
        </Button>
      </form>
      <p className="mt-5 text-center text-sm text-ink-muted">
        <Link href="/login" className="font-semibold text-brand-secondary hover:underline">
          Back to login
        </Link>
      </p>
    </AuthShell>
  );
}
