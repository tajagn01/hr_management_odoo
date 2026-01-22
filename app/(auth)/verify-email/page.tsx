"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Sparkles, Mail, AlertCircle, CheckCircle2, ArrowRight, Loader2, RefreshCw } from "lucide-react";

function VerifyEmailForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";

  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    if (!email) {
      router.push("/register");
    }
  }, [email, router]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });

      const data = await res.json();

      if (res.ok) {
        setVerified(true);
        setSuccess(data.message || "Email verified successfully!");
        setTimeout(() => {
          router.push("/login?verified=true");
        }, 2000);
      } else {
        setError(data.error || "Verification failed");
      }
    } catch (error) {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setResending(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/auth/verify-email", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(data.message || "New OTP sent to your email!");
      } else {
        setError(data.error || "Failed to resend OTP");
      }
    } catch (error) {
      setError("An error occurred. Please try again.");
    } finally {
      setResending(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    const numericValue = value.replace(/\D/g, "");
    if (numericValue) {
      const newOtp = otp.split("");
      newOtp[index] = numericValue;
      const updatedOtp = newOtp.join("").slice(0, 6);
      setOtp(updatedOtp);

      if (index < 5 && numericValue) {
        const nextInput = document.getElementById(`otp-${index + 1}`);
        if (nextInput) {
          (nextInput as HTMLInputElement).focus();
        }
      }
    } else if (value === "") {
      const newOtp = otp.split("");
      newOtp[index] = "";
      setOtp(newOtp.join(""));
      if (index > 0) {
        const prevInput = document.getElementById(`otp-${index - 1}`);
        if (prevInput) {
          (prevInput as HTMLInputElement).focus();
        }
      }
    }
  };

  if (!email) {
    return null;
  }

  return (
    <div className="w-full max-w-[400px] mx-auto py-4">
      {/* Floating Auth Card */}
      <div className="bg-slate-900/70 backdrop-blur-2xl border border-slate-700/30 rounded-[24px] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.5)] hover:shadow-[0_25px_70px_rgba(0,0,0,0.6)] transition-all duration-500">

        {/* Logo */}
        <div className="flex items-center justify-center mb-5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-violet-600 rounded-lg flex items-center justify-center shadow-lg">
              <Mail className="w-4 h-4 text-white" />
            </div>
          </div>
        </div>

        <div className="text-center mb-5">
          <h1 className="text-xl font-bold text-white mb-1">Verify Email</h1>
          <p className="text-slate-400 text-xs">
            Enter code sent to <span className="text-white font-medium">{email}</span>
          </p>
        </div>

        {success && (
          <div className="mb-4 p-2 bg-green-500/10 border border-green-500/20 rounded-lg flex items-center justify-center gap-2">
            <CheckCircle2 className="h-3 w-3 text-green-400" />
            <p className="text-green-400 text-xs text-center">{success}</p>
          </div>
        )}

        {error && !verified && (
          <div className="mb-4 p-2 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center justify-center gap-2">
            <AlertCircle className="h-3 w-3 text-red-400" />
            <p className="text-red-400 text-xs text-center">{error}</p>
          </div>
        )}

        {!verified ? (
          <form onSubmit={handleVerify} className="space-y-4">
            <div>
              <div className="flex gap-2 justify-center">
                {[0, 1, 2, 3, 4, 5].map((index) => (
                  <input
                    key={index}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={otp[index] || ""}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Backspace" && !otp[index] && index > 0) {
                        const prevInput = document.getElementById(`otp-${index - 1}`);
                        if (prevInput) {
                          (prevInput as HTMLInputElement).focus();
                          handleOtpChange(index - 1, "");
                        }
                      }
                    }}
                    onPaste={(e) => {
                      e.preventDefault();
                      const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
                      if (pastedData) {
                        setOtp(pastedData);
                        const nextEmptyIndex = Math.min(pastedData.length, 5);
                        const nextInput = document.getElementById(`otp-${nextEmptyIndex}`);
                        if (nextInput) {
                          (nextInput as HTMLInputElement).focus();
                        }
                      }
                    }}
                    id={`otp-${index}`}
                    className="w-10 h-10 text-center text-sm font-bold bg-slate-800/50 border border-slate-700/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all"
                    autoComplete="off"
                  />
                ))}
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-10 bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 text-white text-sm font-semibold rounded-lg shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
              disabled={loading || otp.length !== 6}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Verifying...
                </span>
              ) : (
                "Verify Code"
              )}
            </Button>
          </form>
        ) : (
          <div className="text-center py-4">
            <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="h-6 w-6 text-green-400" />
            </div>
            <p className="text-sm font-medium text-white mb-1">Email Verified!</p>
            <p className="text-xs text-slate-400">Redirecting to login...</p>
          </div>
        )}

        {!verified && (
          <div className="mt-4 pt-4 border-t border-slate-700/50">
            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={handleResendOTP}
                disabled={resending}
                className="text-xs text-slate-400 hover:text-white transition-colors flex items-center justify-center gap-1.5"
              >
                {resending ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <RefreshCw className="h-3 w-3" />
                )}
                {resending ? "Sending..." : "Resend code"}
              </button>

              <Link href="/register" className="text-xs text-center text-violet-400 hover:text-violet-300 transition-colors">
                Change email address
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="bg-slate-900/70 p-6 rounded-2xl border border-slate-700/30">
        <div className="text-center">
          <div className="inline-flex items-center justify-center h-10 w-10 rounded-lg bg-slate-800 mb-4 animate-pulse"></div>
          <h1 className="text-xl font-bold text-white">Loading...</h1>
        </div>
      </div>
    }>
      <VerifyEmailForm />
    </Suspense>
  );
}

