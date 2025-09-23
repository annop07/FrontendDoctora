import { redirect } from "next/dist/server/api-utils";

export function validatePasswords(pass: string, confirm: string): string | null {
    if (pass.length < 6) {
      return "Password must be at least 6 characters";
    }
    return null;

  }
  