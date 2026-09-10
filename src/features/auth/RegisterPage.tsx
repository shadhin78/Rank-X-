import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  GraduationCap,
  ArrowRight,
  ShieldCheck,
  User,
  KeyRound,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';
import { Badge } from '@/src/components/ui/badge';
import { authService } from '@/src/services/authService';
import { useAppStore } from '@/src/store';
import { validateUsername, validatePin } from '@/src/lib/auth/crypto';

export function RegisterPage() {
  const navigate = useNavigate();
  const setCurrentUser = useAppStore((state) => state.setCurrentUser);

  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form validation calculations
  const isUsernameValid = username.trim().length >= 3 && /^[a-zA-Z0-9_.-]+$/.test(username.trim());
  const isDisplayNameValid = displayName.trim().length >= 2;
  const isPinValid = /^\d{4,8}$/.test(pin);
  const isPinMatching = pin.length > 0 && pin === confirmPin;
  const isFormComplete = isUsernameValid && isDisplayNameValid && isPinValid && isPinMatching;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const userVal = validateUsername(username);
    if (!userVal.isValid) {
      setErrorMessage(userVal.error || 'Invalid username');
      return;
    }

    if (!displayName.trim()) {
      setErrorMessage('Display Name is required.');
      return;
    }

    const pinVal = validatePin(pin);
    if (!pinVal.isValid) {
      setErrorMessage(pinVal.error || 'Invalid PIN');
      return;
    }

    if (pin !== confirmPin) {
      setErrorMessage('PINs do not match. Please re-enter your PIN.');
      return;
    }

    setLoading(true);

    try {
      const profile = await authService.register(username, displayName, pin, confirmPin);
      setCurrentUser(profile);

      // New accounts strictly start as pending: redirect to awaiting-approval screen
      if (profile.accountStatus === 'pending') {
        navigate('/pending-approval', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[90vh] items-center justify-center py-8">
      <div className="w-full max-w-md space-y-5 animate-in fade-in duration-200">
        {/* Brand header */}
        <div className="text-center space-y-1.5">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-md shadow-indigo-500/20 mb-1">
            <GraduationCap className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Create StudyRank Account
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Track study chapters, build daily habits, and climb peer rankings
          </p>
        </div>

        <Card className="shadow-lg border-zinc-200/80 dark:border-zinc-800">
          <form onSubmit={handleSubmit} noValidate>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Student Registration</CardTitle>
                <Badge variant="warning" className="text-[10px]">
                  Requires Approval
                </Badge>
              </div>
              <CardDescription className="text-xs">
                New member accounts are verified by group admins before activation
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-3.5">
              {errorMessage && (
                <div className="flex items-start gap-2 rounded-lg border border-red-200/80 bg-red-50 p-3 text-xs text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span className="leading-snug">{errorMessage}</span>
                </div>
              )}

              {/* Username Field */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 flex items-center justify-between">
                  <span>Username</span>
                  <span className="text-[11px] text-zinc-400">Unique handle</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-400">
                    @
                  </span>
                  <input
                    type="text"
                    autoCapitalize="none"
                    autoCorrect="off"
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_.-]/g, ''));
                      if (errorMessage) setErrorMessage(null);
                    }}
                    placeholder="marcus_v"
                    className="h-9 w-full rounded-lg border border-zinc-200 bg-white pl-8 pr-3 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
                    required
                  />
                </div>
                {username && !isUsernameValid && (
                  <p className="text-[10px] text-amber-600 dark:text-amber-400">
                    At least 3 characters (letters, numbers, underscores)
                  </p>
                )}
              </div>

              {/* Display Name Field */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 flex items-center justify-between">
                  <span>Display Name</span>
                  <span className="text-[11px] text-zinc-400">Public name</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => {
                      setDisplayName(e.target.value);
                      if (errorMessage) setErrorMessage(null);
                    }}
                    placeholder="Marcus Vance"
                    className="h-9 w-full rounded-lg border border-zinc-200 bg-white pl-9 pr-3 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
                    required
                  />
                </div>
              </div>

              {/* PIN & Confirm PIN side by side or stacked */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 flex items-center justify-between">
                    <span>PIN</span>
                    <span className="text-[10px] text-zinc-400 font-mono">4-8 digits</span>
                  </label>
                  <div className="relative">
                    <KeyRound className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
                    <input
                      type={showPin ? 'text' : 'password'}
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={8}
                      value={pin}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '');
                        setPin(val);
                        if (errorMessage) setErrorMessage(null);
                      }}
                      placeholder="••••"
                      className="h-9 w-full rounded-lg border border-zinc-200 bg-white pl-8 pr-8 text-xs font-mono text-zinc-900 placeholder:text-zinc-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPin(!showPin)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
                    >
                      {showPin ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 flex items-center justify-between">
                    <span>Confirm PIN</span>
                    {pin && confirmPin && isPinMatching && (
                      <span className="text-[10px] text-emerald-600 flex items-center gap-0.5">
                        <CheckCircle2 className="h-2.5 w-2.5" /> Match
                      </span>
                    )}
                  </label>
                  <div className="relative">
                    <KeyRound className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
                    <input
                      type={showPin ? 'text' : 'password'}
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={8}
                      value={confirmPin}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '');
                        setConfirmPin(val);
                        if (errorMessage) setErrorMessage(null);
                      }}
                      placeholder="••••"
                      className={`h-9 w-full rounded-lg border bg-white pl-8 pr-3 text-xs font-mono text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 dark:bg-zinc-900 dark:text-zinc-100 ${
                        confirmPin && !isPinMatching
                          ? 'border-red-300 focus:ring-red-500/20 dark:border-red-800'
                          : 'border-zinc-200 focus:border-indigo-500 focus:ring-indigo-500/20 dark:border-zinc-800'
                      }`}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Security guarantee notice */}
              <div className="rounded-lg bg-zinc-50 p-2.5 text-[11px] text-zinc-500 dark:bg-zinc-900/60 dark:text-zinc-400 flex items-center gap-2">
                <Lock className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                <span>PINs are cryptographically hashed; never stored as plaintext.</span>
              </div>
            </CardContent>

            <CardFooter className="flex flex-col gap-3 pt-1">
              <Button
                type="submit"
                variant="primary"
                className="w-full h-10 font-semibold"
                isLoading={loading}
                disabled={!isFormComplete || loading}
              >
                <span>Register Account</span>
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>

              <div className="flex items-center justify-between w-full text-xs pt-1">
                <span className="text-zinc-500">Already registered?</span>
                <Link
                  to="/login"
                  className="font-medium text-indigo-600 hover:underline dark:text-indigo-400"
                >
                  Sign in with PIN
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
