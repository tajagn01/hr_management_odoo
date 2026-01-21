"use client";

import dynamic from "next/dynamic";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/theme-toggle";
import { Sparkles, Menu } from "lucide-react";

// Static, optimized Hero component (no Framer Motion)
import Hero from "@/components/landing/Hero";

// Lazy load below-fold sections with loading states
const SocialProof = dynamic(() => import("@/components/landing/SocialProof"), {
    ssr: true,
});

const ProblemSolution = dynamic(() => import("@/components/landing/ProblemSolution"), {
    ssr: false,
    loading: () => <div className="min-h-screen bg-slate-900" />
});

const Workflow = dynamic(() => import("@/components/landing/Workflow"), {
    ssr: false,
    loading: () => <div className="min-h-screen bg-slate-50 dark:bg-slate-950" />
});

const UseCases = dynamic(() => import("@/components/landing/UseCases"), {
    ssr: false,
    loading: () => <div className="min-h-screen bg-slate-50 dark:bg-slate-950" />
});

const BelowFold = dynamic(() => import("@/components/landing/BelowFold"), {
    loading: () => <div className="min-h-screen bg-slate-50 dark:bg-slate-950" />,
    ssr: false
});

export default function Home() {
    const [isScrolled, setIsScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };

        // Smooth scroll behavior
        document.documentElement.style.scrollBehavior = 'smooth';

        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => {
            window.removeEventListener("scroll", handleScroll);
            document.documentElement.style.scrollBehavior = 'auto';
        };
    }, []);

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 via-slate-50 to-white dark:from-slate-950 dark:via-slate-950 dark:to-slate-900 overflow-x-hidden">
            {/* Fixed Navigation - Minimal, fast loading */}
            <nav
                className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled
                    ? "bg-white/80 dark:bg-slate-950/90 backdrop-blur-xl shadow-sm border-b border-slate-200/50 dark:border-slate-800/50"
                    : "bg-transparent"
                    }`}
            >
                <div className="container mx-auto px-6 sm:px-8 md:px-12 lg:px-16 py-4">
                    <div className="grid grid-cols-3 items-center gap-4">
                        {/* Left: Logo */}
                        <div className="flex items-center gap-3">
                            <div className="relative group cursor-pointer">
                                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/25 group-hover:shadow-blue-500/40 transition-all duration-300 group-hover:scale-105">
                                    <Sparkles className="w-5 h-5 text-white" />
                                </div>
                                <div className="absolute -inset-1 bg-gradient-to-br from-blue-600 to-violet-600 rounded-lg blur opacity-30 group-hover:opacity-50 transition-opacity duration-300 -z-10"></div>
                            </div>
                            <span className="text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                                DayFlow
                            </span>
                        </div>

                        {/* Center: Navigation Links */}
                        <div className="hidden md:flex items-center justify-center gap-8">
                            <a href="#features" className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition">Features</a>
                            <a href="#pricing" className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition">Pricing</a>
                            <a href="#faq" className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition">FAQ</a>
                            <a href="#contact" className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition">Contact</a>
                        </div>

                        {/* Right: Action Buttons */}
                        <div className="flex items-center justify-end gap-3">
                            <ThemeToggle />
                            <Link href="/login" className="hidden sm:block">
                                <Button variant="ghost" size="sm" className="font-medium">
                                    Sign In
                                </Button>
                            </Link>
                            <Link href="/register" className="hidden sm:block">
                                <Button size="sm" className="font-medium bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20">
                                    Get Started
                                </Button>
                            </Link>

                            {/* Mobile menu */}
                            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                                <SheetTrigger asChild>
                                    <Button variant="ghost" size="icon" className="md:hidden">
                                        <Menu className="h-5 w-5" />
                                    </Button>
                                </SheetTrigger>
                                <SheetContent side="right" className="w-80">
                                    <SheetHeader>
                                        <SheetTitle className="flex items-center gap-2">
                                            <div className="w-9 h-9 bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600 rounded-lg flex items-center justify-center">
                                                <Sparkles className="w-5 h-5 text-white" />
                                            </div>
                                            DayFlow
                                        </SheetTitle>
                                    </SheetHeader>
                                    <div className="flex flex-col gap-4 mt-8">
                                        <a
                                            href="#features"
                                            className="text-lg font-medium hover:text-primary transition"
                                            onClick={() => setMobileMenuOpen(false)}
                                        >
                                            Features
                                        </a>
                                        <a
                                            href="#pricing"
                                            className="text-lg font-medium hover:text-primary transition"
                                            onClick={() => setMobileMenuOpen(false)}
                                        >
                                            Pricing
                                        </a>
                                        <a
                                            href="#faq"
                                            className="text-lg font-medium hover:text-primary transition"
                                            onClick={() => setMobileMenuOpen(false)}
                                        >
                                            FAQ
                                        </a>
                                        <Separator className="my-2" />
                                        <Link href="/login">
                                            <Button variant="outline" className="w-full" size="lg">
                                                Sign In
                                            </Button>
                                        </Link>
                                        <Link href="/register">
                                            <Button className="w-full bg-blue-600 hover:bg-blue-700" size="lg">
                                                Get Started
                                            </Button>
                                        </Link>
                                    </div>
                                </SheetContent>
                            </Sheet>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section - Static, optimized (NO CHANGES) */}
            <Hero />

            {/* 01 - Social Proof - Real teams, real results */}
            <SocialProof />

            {/* 02 - Problem → Solution Section */}
            <ProblemSolution />

            {/* Workflow Section - In the middle */}
            <Workflow />

            {/* Use Cases Section - In the middle */}
            <UseCases />

            {/* Below-fold content - Features, Pricing, CTA, FAQ, Footer */}
            <BelowFold />
        </div>
    );
}
