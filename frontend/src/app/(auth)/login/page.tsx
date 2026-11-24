"use client";

import { AuthShell } from "@/components/auth/AuthShell";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAuth } from "@/context/AuthContext";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  remember: z.boolean().optional(),
});

type FormValues = z.infer<typeof schema>;

export default function LoginPage() {
  const { login, user, loading } = useAuth();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "", remember: true },
  });

  useEffect(() => {
    if (!loading && user) {
      router.replace(user.onboardingComplete ? "/overview" : "/onboarding");
    }
  }, [user, loading, router]);

  const onSubmit = handleSubmit(async (values) => {
    setSubmitting(true);
    try {
      const next = await login(values.email, values.password);
      toast.success("Welcome back");
      router.push(next.onboardingComplete ? "/overview" : "/onboarding");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Login failed");
    } finally {
      setSubmitting(false);
    }
  });

  return (
    <AuthShell title="Sign in" subtitle="Access your WhatsRep merchant dashboard.">
      <form onSubmit={onSubmit} className="space-y-4">
        <Input
          label="Email"
          type="email"
          placeholder="you@business.pk"
          error={errors.email?.message}
          {...register("email")}
        />
        <Input
          label="Password"
          type="password"
          placeholder="••••••••"
          error={errors.password?.message}
          {...register("password")}
        />
        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center gap-2 text-ink-muted">
            <input type="checkbox" className="rounded border-line" {...register("remember")} />
            Remember me
          </label>
          <Link href="/forgot-password" className="font-medium text-brand-secondary hover:underline">
            Forgot password?
          </Link>
        </div>
        <Button type="submit" className="w-full" loading={submitting}>
          Login
        </Button>
      </form>
      <p className="mt-5 text-center text-sm text-ink-muted">
        New to WhatsRep?{" "}
        <Link href="/signup" className="font-semibold text-brand-secondary hover:underline">
          Create an account
        </Link>
      </p>
      <p className="mt-4 rounded-xl bg-brand-soft px-3 py-2 text-xs text-brand-secondary">
        Demo auth runs locally until JWT signup/login APIs are available on the FastAPI backend.
      </p>
    </AuthShell>
  );
}
