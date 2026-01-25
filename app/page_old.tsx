"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/theme-toggle";
import { motion, useScroll, useTransform, useInView } from "framer-motion";
import {
    Users,
    Calendar,
    CreditCard,
    BarChart3,
    Shield,
    Zap,
    CheckCircle2,
    ArrowRight,
    Sparkles,
    Clock,
    TrendingUp,
    Globe,
    Play,
    Menu,
    Award
} from "lucide-react";

// Animation Variants
const fadeIn = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5 }
};

const staggerContainer = {
    animate: {
        transition: {
            staggerChildren: 0.1
        }
    }
};

function Counter({ value, label, icon: Icon }: { value: string, label: string, icon: any }) {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true });

    return (
        <Card className="text-center hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-none bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
            <CardContent className="pt-6">
                <div className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-primary/10 mb-4">
                    <Icon className="w-6 h-6 sm:w-7 sm:h-7 text-primary" />
                </div>
                <div ref={ref} className="text-3xl sm:text-4xl md:text-5xl font-bold mb-2 tabular-nums">
                    {isInView ? (
                        <motion.span
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.5 }}
                        >
                            {value}
                        </motion.span>
                    ) : (
                        <span>0</span>
                    )}
                </div>
                <p className="text-sm sm:text-base text-muted-foreground font-medium">
                    {label}
                </p>
            </CardContent>
        </Card>
    );
}

export default function Home() {
    const [isScrolled, setIsScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const faqs = [
        {
            id: 1,
            question: "What is DayFlow HRMS?",
            answer: "DayFlow HRMS is a comprehensive Human Resource Management System designed to streamline HR operations. It helps manage employee data, track attendance, process payroll, handle leave requests, and maintain organizational efficiency."
        },
        {
            id: 2,
            question: "How do I get started with DayFlow?",
            answer: "Getting started is simple! Click 'Get Started' to create an admin account. Once registered, you can start adding employees, setting up payroll, and managing HR operations immediately."
        },
        {
            id: 3,
            question: "Can multiple admins manage the system?",
            answer: "Yes! DayFlow supports multiple admin accounts. Each admin can have full access to manage employees, approve leaves, process payroll, and generate reports."
        },
        {
            id: 4,
            question: "Is my employee data secure?",
            answer: "Absolutely! DayFlow uses industry-standard security protocols including encrypted databases, secure authentication, and role-based access control to protect your sensitive HR data."
        },
        {
            id: 5,
            question: "Can employees access their own information?",
            answer: "Yes! Employees can log in to view their profiles, attendance records, leave requests, payroll information, and other personal details through their dashboard."
        },
        {
            id: 6,
            question: "Does DayFlow support multiple departments?",
            answer: "Yes! You can organize employees into multiple departments and manage them separately. The system supports complex organizational structures."
        }
    ];

    const plans = [
        {
            name: "Starter",
            price: "₹999",
            period: "/month",
            description: "Perfect for small teams just getting started",
            features: [
                "Up to 25 Employees",
                "Basic Attendance Tracking",
                "Leave Management",
                "Simple Payroll",
                "Email Support",
                "Monthly Reports"
            ],
            cta: "Start Free Trial",
            highlighted: false
        },
        {
            name: "Professional",
            price: "₹2,999",
            period: "/month",
            description: "Best for growing businesses",
            features: [
                "Up to 100 Employees",
                "Advanced Attendance",
                "Full Leave Management",
                "Complete Payroll",
                "Priority Support",
                "Weekly Reports",
                "Custom Fields",
                "Multi-Department",
                "API Access"
            ],
            cta: "Start Free Trial",
            highlighted: true,
            badge: "Most Popular"
        },
        {
            name: "Enterprise",
            price: "Custom",
            period: "",
            description: "For large organizations with custom needs",
            features: [
                "Unlimited Employees",
                "All Pro Features",
                "Advanced Analytics",
                "Full API Access",
                "24/7 Phone Support",
                "Custom Integrations",
                "Dedicated Manager",
                "SLA Guarantee",
                "On-premise Option"
            ],
            cta: "Contact Sales",
            highlighted: false
        }
    ];

    const features = [
        {
            icon: Users,
            title: "Employee Management",
            desc: "Centralized employee database with complete profile management, documents, and org charts.",
            color: "from-blue-500 to-cyan-500"
        },
        {
            icon: Clock,
            title: "Smart Attendance",
            desc: "Real-time check-in/out with geolocation, work hour tracking, and overtime calculations.",
            color: "from-purple-500 to-pink-500"
        },
        {
            icon: Calendar,
            title: "Leave Management",
            desc: "Streamlined leave requests, approval workflows, and automatic balance tracking.",
            color: "from-orange-500 to-red-500"
        },
        {
            icon: CreditCard,
            title: "Payroll Processing",
            desc: "Automated salary calculations with tax deductions, allowances, and payment processing.",
            color: "from-green-500 to-emerald-500"
        },
        {
            icon: BarChart3,
            title: "Analytics & Reports",
            desc: "Comprehensive dashboards with actionable insights and exportable reports.",
            color: "from-indigo-500 to-violet-500"
        },
        {
            icon: Shield,
            title: "Enterprise Security",
            desc: "Bank-grade encryption, role-based access, and complete audit trails.",
            color: "from-slate-500 to-zinc-500"
        }
    ];

    const stats = [
        { value: "500+", label: "Companies Trust Us", icon: Award },
        { value: "50,000+", label: "Active Employees", icon: Users },
        { value: "99.9%", label: "Uptime Guaranteed", icon: TrendingUp },
        { value: "24/7", label: "Support Available", icon: Globe }
    ];

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 overflow-x-hidden">
            {/* Navigation */}
            <motion.nav
                initial={{ y: -100 }}
                animate={{ y: 0 }}
                transition={{ duration: 0.5 }}
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
            </motion.nav>

            {/* Hero Section - World-Class SaaS Design */}
            <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-b from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 pt-20 shadow-inner">
                {/* Subtle Premium Background */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    {/* Refined gradient orbs */}
                    <div className="absolute top-[20%] left-[10%] w-[500px] h-[500px] bg-blue-500/30 dark:bg-blue-500/10 rounded-full blur-[120px] animate-pulse" style={{ animationDuration: '8s' }}></div>
                    <div className="absolute bottom-[10%] right-[15%] w-[400px] h-[400px] bg-violet-500/30 dark:bg-violet-500/10 rounded-full blur-[100px] animate-pulse" style={{ animationDuration: '10s' }}></div>

                    {/* Grid pattern overlay */}
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,.05)_1px,transparent_1px),linear-gradient(to_right,rgba(0,0,0,.05)_1px,transparent_1px)] dark:bg-[linear-gradient(rgba(255,255,255,.03)_1px,transparent_1px),linear-gradient(to_right,rgba(255,255,255,.03)_1px,transparent_1px)] bg-[size:48px_48px]"></div>
                </div>

                <div className="container mx-auto px-6 sm:px-8 md:px-12 lg:px-16 relative z-10">
                    <div className="max-w-5xl mx-auto">
                        {/* Trust Badge */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, ease: "easeOut" }}
                            className="flex justify-center mb-8 sm:mb-10"
                        >
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-100 dark:bg-slate-800/60 border border-slate-300 dark:border-slate-600/60 backdrop-blur-xl">
                                <div className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                                </div>
                                <span className="text-sm text-slate-700 dark:text-slate-300 font-medium">Trusted by 500+ companies worldwide</span>
                            </div>
                        </motion.div>

                        {/* Headline - Two Part Structure */}
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
                            className="text-center mb-8"
                        >
                            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold tracking-tight font-[family-name:var(--font-space-grotesk)]">
                                <span className="block text-slate-900 dark:text-white font-extrabold mb-4">
                                    HR Management
                                </span>
                                <span className="block bg-gradient-to-r from-blue-400 via-blue-500 to-violet-500 bg-clip-text text-transparent">
                                    Made Simple
                                </span>
                            </h1>
                        </motion.div>

                        {/* Value Proposition - Clear & Concise */}
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.25, ease: "easeOut" }}
                            className="text-center text-lg sm:text-xl md:text-2xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto mb-10 leading-relaxed font-light"
                        >
                            Streamline employee management, attendance tracking, and payroll automation in one powerful platform.
                        </motion.p>

                        {/* CTA Buttons - Clear Hierarchy */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.35, ease: "easeOut" }}
                            className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-10"
                        >
                            <Link href="/register">
                                <Button
                                    size="lg"
                                    className="w-full sm:w-auto px-8 h-14 text-base font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/25 hover:shadow-blue-500/40 transition-all duration-200"
                                >
                                    Start Free Trial
                                    <ArrowRight className="w-5 h-5 ml-2" />
                                </Button>
                            </Link>
                            <Button
                                size="lg"
                                variant="outline"
                                className="w-full sm:w-auto px-8 h-14 text-base font-semibold border-2 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:border-slate-400 dark:hover:border-slate-500 transition-all duration-200"
                            >
                                <Play className="w-5 h-5 mr-2" />
                                Watch Demo
                            </Button>
                        </motion.div>

                        {/* Trust Indicators - Subtle & Clean */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.6, delay: 0.45 }}
                            className="flex flex-wrap items-center justify-center gap-x-6 sm:gap-x-8 gap-y-3 text-sm text-slate-600 dark:text-slate-400"
                        >
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-green-500" />
                                <span>No credit card required</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-green-500" />
                                <span>14-day free trial</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-green-500" />
                                <span>Cancel anytime</span>
                            </div>
                        </motion.div>

                        {/* Product Preview - Premium Dashboard Mockup */}
                        <motion.div
                            initial={{ opacity: 0, y: 60 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
                            className="mt-16 sm:mt-20 relative"
                        >
                            {/* Gradient fade at bottom */}
                            <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-slate-100 dark:from-slate-950 via-slate-100/80 dark:via-slate-950/80 to-transparent z-10"></div>

                            <div className="relative mx-auto max-w-6xl">
                                {/* Glow effect behind mockup */}
                                <div className="absolute -inset-4 bg-gradient-to-b from-blue-500/40 via-violet-500/30 dark:from-blue-500/20 dark:via-violet-500/10 to-transparent blur-3xl opacity-60 dark:opacity-50"></div>

                                {/* Browser mockup */}
                                <div className="relative rounded-xl overflow-hidden border border-slate-300 dark:border-slate-800/50 shadow-2xl shadow-slate-400/20 dark:shadow-black/50 bg-white dark:bg-slate-900">
                                    {/* Browser chrome */}
                                    <div className="flex items-center gap-2 px-4 py-3 bg-slate-100 dark:bg-slate-950/90">
                                        <div className="flex gap-2">
                                            <div className="w-3 h-3 rounded-full bg-slate-300 dark:bg-slate-700"></div>
                                            <div className="w-3 h-3 rounded-full bg-slate-300 dark:bg-slate-700"></div>
                                            <div className="w-3 h-3 rounded-full bg-slate-300 dark:bg-slate-700"></div>
                                        </div>
                                        <div className="flex-1 mx-4">
                                            <div className="flex items-center justify-center gap-2 px-4 py-1.5 bg-slate-200 dark:bg-slate-800/50 rounded-md max-w-sm mx-auto">
                                                <Shield className="w-3 h-3 text-slate-500 dark:text-slate-500" />
                                                <span className="text-xs text-slate-600 dark:text-slate-500">app.dayflow.com/dashboard</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Dashboard content */}
                                    <div className="p-8 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950">
                                        {/* Stats Grid */}
                                        <div className="grid grid-cols-4 gap-4 mb-6">
                                            {[
                                                { label: "Total Employees", value: "248", change: "+12%", trend: "up" },
                                                { label: "Present Today", value: "231", change: "93%", trend: "neutral" },
                                                { label: "On Leave", value: "17", change: "-3", trend: "down" },
                                                { label: "Pending", value: "8", change: "New", trend: "neutral" }
                                            ].map((stat, i) => (
                                                <motion.div
                                                    key={i}
                                                    initial={{ opacity: 0, y: 20 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: 0.7 + (i * 0.05), duration: 0.4 }}
                                                    className="bg-white dark:bg-slate-800/40 backdrop-blur-sm rounded-lg p-4 shadow-sm"
                                                >
                                                    <div className="text-xs text-slate-500 dark:text-slate-500 mb-1.5">{stat.label}</div>
                                                    <div className="text-2xl font-bold text-slate-900 dark:text-white mb-1">{stat.value}</div>
                                                    <div className={`text-xs ${stat.trend === 'up' ? 'text-emerald-400' : stat.trend === 'down' ? 'text-orange-400' : 'text-slate-400'}`}>
                                                        {stat.change}
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </div>

                                        {/* Charts section */}
                                        <div className="grid grid-cols-3 gap-4">
                                            <motion.div
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: 0.9, duration: 0.5 }}
                                                className="col-span-2 bg-white dark:bg-slate-800/40 backdrop-blur-sm rounded-lg p-4 shadow-sm"
                                            >
                                                <div className="text-xs text-slate-600 dark:text-slate-500 mb-4">Weekly Attendance</div>
                                                <div className="flex items-end justify-between gap-2 h-32">
                                                    {[70, 85, 78, 92, 88, 95, 90].map((height, i) => (
                                                        <motion.div
                                                            key={i}
                                                            initial={{ height: 0 }}
                                                            animate={{ height: `${height}%` }}
                                                            transition={{ delay: 1.1 + (i * 0.05), duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                                                            className="flex-1 bg-gradient-to-t from-blue-600 to-blue-400 rounded-t opacity-90"
                                                        ></motion.div>
                                                    ))}
                                                </div>
                                            </motion.div>

                                            <motion.div
                                                initial={{ opacity: 0, x: 20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: 0.9, duration: 0.5 }}
                                                className="bg-white dark:bg-slate-800/40 backdrop-blur-sm rounded-lg p-4 shadow-sm"
                                            >
                                                <div className="text-xs text-slate-600 dark:text-slate-500 mb-4">Departments</div>
                                                <div className="space-y-3">
                                                    {[
                                                        { name: "Engineering", percent: 85 },
                                                        { name: "Design", percent: 65 },
                                                        { name: "Marketing", percent: 45 },
                                                        { name: "HR", percent: 30 }
                                                    ].map((dept, i) => (
                                                        <div key={i} className="space-y-1">
                                                            <div className="flex justify-between text-xs">
                                                                <span className="text-slate-600 dark:text-slate-400">{dept.name}</span>
                                                                <span className="text-slate-500 dark:text-slate-500">{dept.percent}%</span>
                                                            </div>
                                                            <div className="h-1 bg-slate-200 dark:bg-slate-700/50 rounded-full overflow-hidden">
                                                                <motion.div
                                                                    initial={{ width: 0 }}
                                                                    animate={{ width: `${dept.percent}%` }}
                                                                    transition={{ delay: 1.2 + (i * 0.05), duration: 0.8, ease: "easeOut" }}
                                                                    className="h-full bg-blue-500 rounded-full"
                                                                />
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </motion.div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section >

            {/* Stats Section */}
            < section className="py-16 sm:py-20" >
                <div className="container mx-auto px-6 sm:px-8 md:px-12 lg:px-16">
                    <motion.div
                        variants={staggerContainer}
                        initial="initial"
                        whileInView="animate"
                        viewport={{ once: true }}
                        className="grid grid-cols-2 md:grid-cols-4 gap-6"
                    >
                        {stats.map((stat, i) => (
                            <motion.div key={i} variants={fadeIn}>
                                <Counter {...stat} />
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="py-20 sm:py-24 md:py-32 relative overflow-hidden">
                <div className="absolute inset-0 bg-slate-50 dark:bg-slate-950">
                    <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-100/20 via-transparent to-transparent dark:from-blue-900/20"></div>
                </div>

                <div className="container mx-auto px-6 sm:px-8 md:px-12 lg:px-16 relative">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center mb-16"
                    >
                        <Badge variant="outline" className="mb-4 border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400">
                            <Zap className="w-4 h-4 mr-2" />
                            Powerful Features
                        </Badge>
                        <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6">
                            Everything you need to
                            <span className="block bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">
                                manage your workforce
                            </span>
                        </h2>
                        <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
                            Streamline your HR operations with our comprehensive suite of tools designed for modern businesses.
                        </p>
                    </motion.div>

                    <motion.div
                        variants={staggerContainer}
                        initial="initial"
                        whileInView="animate"
                        viewport={{ once: true }}
                        className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6"
                    >
                        {features.map((feature, i) => (
                            <motion.div key={i} variants={fadeIn}>
                                <Card className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden relative h-full">
                                    <div className={`absolute top-0 left-0 w-1 h-full bg-gradient-to-b ${feature.color} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>
                                    <CardHeader>
                                        <div className={`inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br ${feature.color} mb-4 group-hover:scale-110 transition-transform shadow-lg`}>
                                            <feature.icon className="w-7 h-7 text-white" />
                                        </div>
                                        <CardTitle className="text-xl group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{feature.title}</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <CardDescription className="text-base leading-relaxed">
                                            {feature.desc}
                                        </CardDescription>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* Pricing Section */}
            <section id="pricing" className="py-20 sm:py-24 md:py-32">
                <div className="container mx-auto px-6 sm:px-8 md:px-12 lg:px-16">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center mb-16"
                    >
                        <Badge variant="outline" className="mb-4 border-green-200 dark:border-green-800 text-green-600 dark:text-green-400">
                            <CreditCard className="w-4 h-4 mr-2" />
                            Simple Pricing
                        </Badge>
                        <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6">
                            Plans that scale with
                            <span className="block bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                                your business
                            </span>
                        </h2>
                        <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
                            Choose the perfect plan for your team. All plans include a 14-day free trial.
                        </p>
                    </motion.div>

                    <motion.div
                        variants={staggerContainer}
                        initial="initial"
                        whileInView="animate"
                        viewport={{ once: true }}
                        className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto"
                    >
                        {plans.map((plan, i) => (
                            <motion.div key={i} variants={fadeIn}>
                                <Card
                                    className={`relative transition-all duration-300 h-full flex flex-col ${plan.highlighted
                                        ? "border-blue-500 shadow-2xl lg:scale-105 lg:-my-4 bg-white dark:bg-slate-900 z-10"
                                        : "hover:shadow-xl hover:-translate-y-1 bg-white/50 dark:bg-slate-900/50 backdrop-blur"
                                        }`}
                                >
                                    {plan.badge && (
                                        <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-600 to-violet-600 text-white border-none px-4 py-1">
                                            {plan.badge}
                                        </Badge>
                                    )}

                                    <CardHeader>
                                        <CardTitle className="text-2xl">{plan.name}</CardTitle>
                                        <CardDescription className="text-base mt-2">
                                            {plan.description}
                                        </CardDescription>
                                    </CardHeader>

                                    <CardContent className="flex-1 flex flex-col">
                                        <div className="mb-6">
                                            <span className="text-4xl md:text-5xl font-bold">
                                                {plan.price}
                                            </span>
                                            {plan.period && (
                                                <span className="text-base text-muted-foreground ml-1">
                                                    {plan.period}
                                                </span>
                                            )}
                                        </div>

                                        <div className="space-y-4 mb-8 flex-1">
                                            {plan.features.map((feature, j) => (
                                                <div key={j} className="flex items-center gap-3">
                                                    <div className="flex-shrink-0 w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                                                        <CheckCircle2 className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
                                                    </div>
                                                    <span className="text-base text-muted-foreground">
                                                        {feature}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>

                                        <Link href="/register" className="block mt-auto">
                                            <Button
                                                size="lg"
                                                variant={plan.highlighted ? "default" : "outline"}
                                                className={`w-full ${plan.highlighted ? 'bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/25' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                                            >
                                                {plan.cta}
                                            </Button>
                                        </Link>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* FAQ Section */}
            <section id="faq" className="py-20 sm:py-24 md:py-32">
                <div className="container mx-auto px-6 sm:px-8 md:px-12 lg:px-16 max-w-3xl">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center mb-16"
                    >
                        <Badge variant="outline" className="mb-4 border-purple-200 dark:border-purple-800 text-purple-600 dark:text-purple-400">
                            <Sparkles className="w-4 h-4 mr-2" />
                            FAQ
                        </Badge>
                        <h2 className="text-4xl sm:text-5xl font-bold mb-6">
                            Frequently Asked Questions
                        </h2>
                        <p className="text-lg sm:text-xl text-muted-foreground">
                            Everything you need to know about DayFlow
                        </p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 }}
                    >
                        <Accordion type="single" collapsible className="w-full space-y-4">
                            {faqs.map((faq) => (
                                <AccordionItem key={faq.id} value={`item-${faq.id}`} className="border border-slate-200 dark:border-slate-800 rounded-lg px-4 bg-white/50 dark:bg-slate-900/50 backdrop-blur">
                                    <AccordionTrigger className="text-left text-lg font-medium hover:no-underline hover:text-blue-600 dark:hover:text-blue-400 py-6">
                                        {faq.question}
                                    </AccordionTrigger>
                                    <AccordionContent className="text-base text-muted-foreground pb-6 leading-relaxed">
                                        {faq.answer}
                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>
                    </motion.div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 sm:py-24 md:py-32">
                <div className="container mx-auto px-6 sm:px-8 md:px-12 lg:px-16">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                    >
                        <Card className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600 border-none text-white shadow-2xl shadow-blue-900/20">
                            {/* Background Pattern */}
                            <div className="absolute inset-0 opacity-30">
                                <div className="absolute top-0 left-0 w-72 h-72 bg-white/10 rounded-full blur-3xl"></div>
                                <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
                            </div>

                            <CardContent className="relative text-center max-w-3xl mx-auto py-16 sm:py-20">
                                <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6 text-white">
                                    Ready to transform your HR?
                                </h2>
                                <p className="text-lg sm:text-xl text-blue-100 mb-10 max-w-2xl mx-auto">
                                    Join thousands of companies already using DayFlow to streamline their HR operations and boost productivity.
                                </p>

                                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                    <Link href="/register">
                                        <Button size="lg" variant="secondary" className="w-full sm:w-auto text-base font-semibold h-14 group bg-white text-blue-600 hover:bg-blue-50 px-10 shadow-lg">
                                            Start Your Free Trial
                                            <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                                        </Button>
                                    </Link>
                                    <Link href="#pricing">
                                        <Button size="lg" variant="outline" className="w-full sm:w-auto text-base font-semibold text-slate-700 dark:text-white border-2 border-slate-400 dark:border-white/50 hover:bg-slate-200 dark:hover:bg-white/20 hover:border-slate-500 dark:hover:border-white/70 h-14 px-10">
                                            View Pricing
                                        </Button>
                                    </Link>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-slate-950 text-slate-400 py-16 border-t border-slate-800">
                <div className="container mx-auto px-6 sm:px-8 md:px-12 lg:px-16">
                    <div className="grid sm:grid-cols-2 md:grid-cols-5 gap-10 md:gap-12 mb-12">
                        <div className="sm:col-span-2 md:col-span-2">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                                    <Sparkles className="w-5 h-5 text-white" />
                                </div>
                                <span className="text-xl font-bold text-white">DayFlow</span>
                            </div>
                            <p className="text-base text-slate-400 mb-6 max-w-sm">
                                Modern HR management solution designed to help businesses of all sizes streamline their workforce operations.
                            </p>
                        </div>

                        <div>
                            <h4 className="text-white font-semibold mb-4 text-base">Product</h4>
                            <ul className="space-y-3">
                                {["Features", "Pricing", "Integrations", "Changelog"].map((item) => (
                                    <li key={item}>
                                        <a href="#" className="hover:text-white transition text-base">{item}</a>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div>
                            <h4 className="text-white font-semibold mb-4 text-base">Company</h4>
                            <ul className="space-y-3">
                                {["About", "Blog", "Careers", "Contact"].map((item) => (
                                    <li key={item}>
                                        <a href="#" className="hover:text-white transition text-base">{item}</a>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div>
                            <h4 className="text-white font-semibold mb-4 text-base">Legal</h4>
                            <ul className="space-y-3">
                                {["Privacy", "Terms", "Security", "Cookies"].map((item) => (
                                    <li key={item}>
                                        <a href="#" className="hover:text-white transition text-base">{item}</a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-center md:text-left">
                        <p className="text-sm">© 2026 DayFlow HRMS. All rights reserved.</p>
                        <p className="text-sm">Made with ❤️ for modern businesses</p>
                    </div>
                </div>
            </footer>
        </div>
    );
}

