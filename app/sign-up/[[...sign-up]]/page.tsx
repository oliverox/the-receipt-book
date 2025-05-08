"use client";

import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-900 p-4">
      <SignUp
        appearance={{
          variables: {
            colorPrimary: "#10b981",
          },
          elements: {
            formButtonPrimary:
              "bg-emerald-600 hover:bg-emerald-700 text-sm normal-case",
            footerActionLink: "text-emerald-600 hover:text-emerald-700",
            card: "bg-white dark:bg-slate-800 shadow-md",
          },
        }}
        signInUrl="/sign-in"
        redirectUrl="/dashboard"
      />
    </div>
  );
}
