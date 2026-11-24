"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Skeleton } from "@/components/ui/Skeleton";

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) router.replace("/login");
    else if (!user.onboardingComplete) router.replace("/onboarding");
    else router.replace("/overview");
  }, [user, loading, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-app">
      <Skeleton className="h-10 w-48" />
    </div>
  );
}
