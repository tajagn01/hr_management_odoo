"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Mail, Lock, Eye, EyeOff, ArrowLeft, CheckCircle } from "lucide-react";

/**
 * Reset Password Page
 * Handles both requesting a reset link (Enter Email)
 * and entering a new password (if token is present)
 */
function ResetPasswordContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get("token");

    // State
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    // Mode: "request" (email) or "reset" (password)
    const isResetMode = !!token;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        setSuccess(false);

        try {
            if (isResetMode) {
                // CONFIRM RESET (PUT)
                if (password !== confirmPassword) {
                    setError("Passwords do not match");
                    setLoading(false);
                    return;
                }

                const response = await fetch("/api/auth/reset-password", {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ token, newPassword: password }),
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.error || "Failed to reset password");
                }

                setSuccess(true);
                // Redirect to login after 3 seconds
                setTimeout(() => router.push("/login?error=PasswordResetSuccess"), 2000);

            } else {
                // REQUEST LINK (POST)
                const response = await fetch("/api/auth/reset-password", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email }),
                });

                const data = await response.json();

                // Always show success to prevent enumeration (API does this too)
                setSuccess(true);
            }
        } catch (err: any) {
            setError(err.message || "An error occurred. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full max-w-[400px] mx-auto py-4">
            <div className="bg-slate-900/70 backdrop-blur-2xl border border-slate-700/30 rounded-[24px] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.5)] transition-all duration-500">

                {/* Header */}
                <div className="text-center mb-6">
                    <Link href="/login" className="inline-flex items-center text-xs text-slate-400 hover:text-white mb-4 transition-colors">
                        <ArrowLeft className="w-3 h-3 mr-1" /> Back to Login
                    </Link>
                    <h1 className="text-xl font-bold text-white mb-2">
                        {isResetMode ? "Set New Password" : "Reset Password"}
                    </h1>
                    <p className="text-slate-400 text-xs text-balance">
                        {isResetMode
                            ? "Enter your new password below."
                            : "Enter your email address and we'll send you a link to reset your password."}
                    </p>
                </div>

                {/* Success State */}
                {success ? (
                    <div className="text-center py-6 animate-in fade-in zoom-in duration-500">
                        <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckCircle className="w-6 h-6 text-green-500" />
                        </div>
                        <h3 className="text-white font-semibold mb-2">
                            {isResetMode ? "Password Reset!" : "Check your inbox"}
                        </h3>
                        <p className="text-slate-400 text-sm">
                            {isResetMode
                                ? "Redirecting you to login..."
                                : "If an account exists for that email, we have sent password reset instructions."}
                        </p>
                        {!isResetMode && (
                            <Button
                                onClick={() => router.push("/login")}
                                className="mt-6 w-full bg-slate-800 hover:bg-slate-700 text-white"
                            >
                                Return to Login
                            </Button>
                        )}
                    </div>
                ) : (
                    /* Form */
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {error && (
                            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-xs text-center">
                                {error}
                            </div>
                        )}

                        {!isResetMode && (
                            <div>
                                <label className="block text-xs font-medium text-slate-300 mb-1.5">Email</label>
                                <div className="relative group">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-violet-400 transition-colors" />
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="name@company.com"
                                        className="w-full pl-9 pr-4 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all"
                                        required
                                    />
                                </div>
                            </div>
                        )}

                        {isResetMode && (
                            <>
                                <div>
                                    <label className="block text-xs font-medium text-slate-300 mb-1.5">New Password</label>
                                    <div className="relative group">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-violet-400 transition-colors" />
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="Min. 8 characters"
                                            className="w-full pl-9 pr-10 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all"
                                            required
                                            minLength={8}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                                        >
                                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-300 mb-1.5">Confirm Password</label>
                                    <div className="relative group">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-violet-400 transition-colors" />
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            placeholder="Re-enter password"
                                            className="w-full pl-9 pr-10 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all"
                                            required
                                        />
                                    </div>
                                </div>
                            </>
                        )}

                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full py-2 bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 text-white font-semibold rounded-lg shadow-lg shadow-violet-500/25 transition-all duration-300"
                        >
                            {loading ? "Processing..." : (isResetMode ? "Reset Password" : "Send Reset Link")}
                        </Button>
                    </form>
                )}
            </div>
        </div>
    );
}

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={<div className="text-white text-center pt-20">Loading...</div>}>
            <ResetPasswordContent />
        </Suspense>
    );
}
