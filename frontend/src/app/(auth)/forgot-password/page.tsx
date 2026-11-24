"use client";

import { AuthShell } from "@/components/auth/AuthShell";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { requestPasswordReset } from "@/lib/api/services";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
});

type FormValues = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = handleSubmit(async (values) => {
    setSubmitting(true);
    try {
      const result = await requestPasswordReset(values.email);
      setSent(true);
      toast.success(result.message);
    } finally {
      setSubmitting(false);
    }
  });

  return (
    <AuthShell
      title="Forgot password"
      subtitle="We'll send reset instructions to your business email."
    >
      {sent ? (
        <div className="rounded-xl bg-brand-soft px-4 py-5 text-sm text-brand-secondary">
          If an account exists for that email, reset instructions have been queued.
          In demo mode you can continue to{" "}
          <Link href="/reset-password" className="font-semibold underline">
            reset password
          </Link>
          .
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4">
          <Input
            label="Email"
            type="email"
            placeholder="you@business.pk"
            error={errors.email?.message}
            {...register("email")}
          />
          <Button type="submit" className="w-full" loading={submitting}>
            Send reset link
          </Button>
        </form>
      )}
      <p className="mt-5 text-center text-sm text-ink-muted">
        <Link href="/login" className="font-semibold text-brand-secondary hover:underline">
          Back to login
        </Link>
      </p>
    </AuthShell>
  );
}
