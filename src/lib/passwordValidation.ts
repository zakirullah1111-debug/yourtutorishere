const COMMON_PASSWORDS = new Set([
  "password", "password1", "password123", "12345678", "123456789",
  "1234567890", "qwerty123", "abc12345", "letmein123", "welcome1",
  "admin123", "iloveyou1", "monkey123", "dragon123", "master123",
  "qwerty12", "changeme1", "trustno1", "baseball1", "shadow123",
]);

export interface PasswordStrength {
  score: number; // 0-4
  label: "Too Weak" | "Weak" | "Medium" | "Strong" | "Very Strong";
  color: string;
  percentage: number;
}

export function getPasswordStrength(password: string): PasswordStrength {
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) score++;

  // Penalize common passwords
  if (COMMON_PASSWORDS.has(password.toLowerCase())) score = 0;

  const map: Record<number, PasswordStrength> = {
    0: { score: 0, label: "Too Weak", color: "hsl(0, 84%, 60%)", percentage: 10 },
    1: { score: 1, label: "Weak", color: "hsl(25, 95%, 53%)", percentage: 25 },
    2: { score: 2, label: "Medium", color: "hsl(45, 93%, 47%)", percentage: 50 },
    3: { score: 3, label: "Strong", color: "hsl(142, 71%, 45%)", percentage: 75 },
    4: { score: 4, label: "Very Strong", color: "hsl(142, 71%, 35%)", percentage: 90 },
    5: { score: 4, label: "Very Strong", color: "hsl(142, 71%, 35%)", percentage: 100 },
  };

  return map[Math.min(score, 5)];
}

export function validatePasswordPolicy(password: string): string[] {
  const errors: string[] = [];
  if (password.length < 8) errors.push("At least 8 characters");
  if (!/[A-Z]/.test(password)) errors.push("At least 1 uppercase letter");
  if (!/\d/.test(password)) errors.push("At least 1 number");
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) errors.push("At least 1 special character");
  if (COMMON_PASSWORDS.has(password.toLowerCase())) errors.push("Password is too common");
  return errors;
}

// Brute force protection
const LOGIN_ATTEMPTS_KEY = "yt_login_attempts";
const LOCKOUT_KEY = "yt_lockout_until";
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

export function checkLoginLockout(): { locked: boolean; remainingMinutes: number } {
  const lockoutUntil = localStorage.getItem(LOCKOUT_KEY);
  if (lockoutUntil) {
    const until = parseInt(lockoutUntil, 10);
    if (Date.now() < until) {
      return { locked: true, remainingMinutes: Math.ceil((until - Date.now()) / 60000) };
    }
    // Lockout expired, clear
    localStorage.removeItem(LOCKOUT_KEY);
    localStorage.removeItem(LOGIN_ATTEMPTS_KEY);
  }
  return { locked: false, remainingMinutes: 0 };
}

export function recordFailedLogin(): { locked: boolean; attemptsLeft: number } {
  const current = parseInt(localStorage.getItem(LOGIN_ATTEMPTS_KEY) || "0", 10) + 1;
  localStorage.setItem(LOGIN_ATTEMPTS_KEY, String(current));

  if (current >= MAX_ATTEMPTS) {
    localStorage.setItem(LOCKOUT_KEY, String(Date.now() + LOCKOUT_DURATION_MS));
    return { locked: true, attemptsLeft: 0 };
  }
  return { locked: false, attemptsLeft: MAX_ATTEMPTS - current };
}

export function clearLoginAttempts() {
  localStorage.removeItem(LOGIN_ATTEMPTS_KEY);
  localStorage.removeItem(LOCKOUT_KEY);
}
