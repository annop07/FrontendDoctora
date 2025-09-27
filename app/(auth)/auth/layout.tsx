// app/(auth)/layout.tsx
import type { Metadata } from "next";
import "../globals.css";

export const metadata: Metadata = {
  title: "Auth | Healthi",
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh grid place-items-center bg-gradient-to-br from-teal-50 via-sky-50 to-white">
      <div className="w-full max-w-md bg-white shadow-lg rounded-2xl p-6">
        {children}
      </div>
    </div>
  );
}
