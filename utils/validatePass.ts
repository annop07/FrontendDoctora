import { redirect } from "next/dist/server/api-utils";

export function validatePasswords(pass: string, confirm: string): string | null {
    if (pass !== confirm) {
      return "Passwords do not match";
    }
    if (pass.length < 6) {
      return "Password must be at least 6 characters";
    }
    return null;

  }
  