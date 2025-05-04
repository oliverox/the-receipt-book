"use client"

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useOnboarding } from "@/hooks/use-onboarding";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn } = useUser();
  const router = useRouter();
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const { isProcessing } = useOnboarding();

  // Check if user is signed in and redirect if not
  useEffect(() => {
    if (isLoaded) {
      if (!isSignedIn) {
        router.push("/sign-in");
      } else {
        setIsInitialLoad(false);
      }
    }
  }, [isLoaded, isSignedIn, router]);

  // Show loading state on initial load or during onboarding
  if (isInitialLoad || isProcessing) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-600"></div>
          <p className="text-sm text-muted-foreground">
            {isProcessing ? "Setting up your account..." : "Loading..."}
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}