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

const schema = z
  .object({
    businessName: z.string().min(2, "Business name is required"),
    ownerName: z.string().min(2, "Owner name is required"),
    email: z.string().email("Enter a valid email"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(6, "Confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type FormValues = z.infer<typeof schema>;

export default function SignupPage() {
  const { signup, user, loading } = useAuth();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    if (!loading && user) {
      router.replace(user.onboardingComplete ? "/overview" : "/onboarding");
    }
  }, [user, loading, router]);

  const onSubmit = handleSubmit(async (values) => {
    setSubmitting(true);
    try {
      await signup(values);
      toast.success("Account created");
      router.push("/onboarding");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Signup failed");
    } finally {
      setSubmitting(false);
    }
  });

  return (
    <AuthShell title="Create your account" subtitle="Set up WhatsRep for your WhatsApp business.">
      <form onSubmit={onSubmit} className="space-y-4">
        <Input
          label="Business name"
          placeholder="Noor Fashion Store"
          error={errors.businessName?.message}
          {...register("businessName")}
        />
        <Input
          label="Owner name"
          placeholder="Noor Fatima"
          error={errors.ownerName?.message}
          {...register("ownerName")}
        />
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
        <Input
          label="Confirm password"
          type="password"
          placeholder="••••••••"
          error={errors.confirmPassword?.message}
          {...register("confirmPassword")}
        />
        <Button type="submit" className="w-full" loading={submitting}>
          Create account
        </Button>
      </form>
      <p className="mt-5 text-center text-sm text-ink-muted">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-brand-secondary hover:underline">
          Sign in
        </Link>
      </p>
    </AuthShell>
  );
}
