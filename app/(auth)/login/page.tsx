"use client";

import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Mail, Lock, Eye, EyeOff, KeyRound } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isDemoOpen, setIsDemoOpen] = useState(false);

  const registered = searchParams.get("registered");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const result = await signIn("credentials", {
        redirect: false,
        email,
        password,
      });

      if (result?.error) {
        setError("Invalid email or password");
      } else {
        router.push("/admin");
        router.refresh();
      }
    } catch (error) {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[400px] mx-auto py-4">
      {/* Floating Auth Card */}
      <div className="bg-slate-900/70 backdrop-blur-2xl border border-slate-700/30 rounded-[24px] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.5)] hover:shadow-[0_25px_70px_rgba(0,0,0,0.6)] transition-all duration-500">

        {/* Logo */}
        <div className="flex items-center justify-center mb-5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-violet-600 rounded-lg flex items-center justify-center shadow-lg">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="text-lg font-bold text-white">DayFlow</span>
          </div>
        </div>

        {/* Headline */}
        <div className="text-center mb-5">
          <h1 className="text-xl font-bold text-white mb-1">Welcome back!</h1>
          <p className="text-slate-400 text-xs">Sign in to continue to your account</p>
        </div>

        {registered && (
          <div className="mb-4 p-2 bg-green-500/10 border border-green-500/20 rounded-lg">
            <p className="text-green-400 text-xs text-center">Registration successful! Please sign in.</p>
          </div>
        )}

        {error && (
          <div className="mb-4 p-2 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p className="text-red-400 text-xs text-center">{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Email Input */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Email</label>
            <div className="relative group">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-violet-400 transition-colors" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="w-full pl-9 pr-4 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all"
                required
              />
            </div>
          </div>

          {/* Password Input */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Password</label>
            <div className="relative group">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-violet-400 transition-colors" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full pl-9 pr-10 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all"
                required
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

          {/* Primary CTA Button */}
          <Button
            type="submit"
            disabled={loading}
            className="w-full py-2 h-10 bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 text-white text-sm font-semibold rounded-lg shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
          >
            {loading ? "Signing in..." : "Continue with Email"}
          </Button>
        </form>

        {/* Divider */}
        <div className="my-4 flex items-center gap-3">
          <div className="h-px flex-1 bg-slate-700/50"></div>
          <span className="text-[10px] uppercase tracking-wider text-slate-500">or</span>
          <div className="h-px flex-1 bg-slate-700/50"></div>
        </div>

        {/* Social Login - Only Google */}
        <Button
          type="button"
          variant="outline"
          onClick={() => signIn("google", { callbackUrl: "/admin" })}
          className="w-full py-2 h-10 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-sm font-medium rounded-lg transition-all"
        >
          <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Google
        </Button>

        {/* Secondary Link */}
        <div className="mt-4 text-center">
          <p className="text-xs text-slate-400">
            Don't have an account?{" "}
            <Link href="/register" className="text-violet-400 hover:text-violet-300 font-medium transition-colors">
              Sign up
            </Link>
          </p>
        </div>
      </div>

      {/* Demo Credentials Button */}
      <div className="mt-8 text-center animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
        <Dialog open={isDemoOpen} onOpenChange={setIsDemoOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="gap-2 bg-slate-900/50 border-slate-700/50 text-slate-400 hover:text-white hover:bg-slate-800">
              <KeyRound className="w-4 h-4" />
              <span>Demo Access</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-slate-950 border-slate-800 text-white sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Demo Credentials</DialogTitle>
              <DialogDescription className="text-slate-400">
                Click any account below to autofill parameters.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 mt-2">
              {/* Admin */}
              <button
                type="button"
                onClick={() => { setEmail('admin@dayflow.com'); setPassword('admin123'); setIsDemoOpen(false); }}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800 hover:bg-blue-950/30 hover:border-blue-500/30 cursor-pointer transition-all group text-left"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-200 group-hover:text-blue-400 transition-colors">Admin</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-medium">Super Admin</span>
                  </div>
                  <div className="text-xs text-slate-500 mt-1 font-mono">admin@dayflow.com</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] bg-slate-900 px-2 py-1 rounded text-slate-500 font-mono border border-slate-800">admin123</span>
                </div>
              </button>

              {/* Manager (Sarah) */}
              <button
                type="button"
                onClick={() => { setEmail('manager@dayflow.com'); setPassword('manager123'); setIsDemoOpen(false); }}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800 hover:bg-purple-950/30 hover:border-purple-500/30 cursor-pointer transition-all group text-left"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-200 group-hover:text-purple-400 transition-colors">Sarah Manager</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 font-medium">Manager</span>
                  </div>
                  <div className="text-xs text-slate-500 mt-1 font-mono">manager@dayflow.com</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] bg-slate-900 px-2 py-1 rounded text-slate-500 font-mono border border-slate-800">manager123</span>
                </div>
              </button>

              {/* Employee (John) */}
              <button
                type="button"
                onClick={() => { setEmail('john@dayflow.com'); setPassword('employee123'); setIsDemoOpen(false); }}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800 hover:bg-emerald-950/30 hover:border-emerald-500/30 cursor-pointer transition-all group text-left"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-200 group-hover:text-emerald-400 transition-colors">John Doe</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">Employee</span>
                  </div>
                  <div className="text-xs text-slate-500 mt-1 font-mono">john@dayflow.com</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] bg-slate-900 px-2 py-1 rounded text-slate-500 font-mono border border-slate-800">employee123</span>
                </div>
              </button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="text-white text-center">Loading...</div>}>
      <LoginContent />
    </Suspense>
  );
}
