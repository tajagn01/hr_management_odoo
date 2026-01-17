"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

/**
 * Premium Hero Section - Dashboard Preview
 */
export default function Hero() {
    const ref = useRef(null);
    const { scrollYProgress } = useScroll({
        target: ref,
        offset: ["start start", "end start"]
    });

    const y = useTransform(scrollYProgress, [0, 1], [0, -50]);

    const words = ["Payroll", "runs", "itself.", "Growth", "moves", "faster."];

    return (
        <section
            ref={ref}
            className="relative min-h-[90vh] pt-32 pb-28 sm:pt-40 sm:pb-36 lg:pt-48 lg:pb-44 overflow-hidden bg-gradient-to-br from-slate-50 via-white to-blue-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-blue-950/30"
        >
            {/* Radial gradient overlay */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-100/40 via-transparent to-transparent dark:from-blue-900/20"></div>

            {/* Subtle noise texture */}
            <div className="absolute inset-0 opacity-[0.015] dark:opacity-[0.025]" style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
                backgroundRepeat: 'repeat',
                backgroundSize: '200px 200px'
            }}></div>

            <div className="container mx-auto px-6 sm:px-8 md:px-12 lg:px-16 relative z-10">
                {/* Content */}
                <div className="max-w-5xl mx-auto">
                    {/* Trust Pill */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="flex justify-center mb-8"
                    >
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl border border-slate-200/50 dark:border-slate-700/50 shadow-sm">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                            <span className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400">
                                Trusted by 5,000+ teams worldwide
                            </span>
                        </div>
                    </motion.div>

                    {/* Headline - Word by Word */}
                    <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-[5.5rem] font-bold text-center mb-6 leading-[1.1] tracking-tight">
                        {words.map((word, i) => (
                            <motion.span
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{
                                    duration: 0.5,
                                    delay: 0.6 + i * 0.08,
                                    ease: [0.21, 0.47, 0.32, 0.98]
                                }}
                                className="inline-block mr-3 text-slate-900 dark:text-white"
                            >
                                {word}
                                {i === 2 && <br className="hidden sm:block" />}
                            </motion.span>
                        ))}
                    </h1>

                    {/* Subheadline */}
                    <motion.p
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 1.2 }}
                        className="text-center text-lg sm:text-xl lg:text-2xl text-slate-600 dark:text-slate-400 mb-10 max-w-2xl mx-auto font-medium"
                    >
                        Modern HR automation for fast-moving companies
                    </motion.p>

                    {/* CTAs */}
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, delay: 1.4 }}
                            className="w-full sm:w-auto"
                        >
                            <Link href="/register" className="block w-full sm:w-auto">
                                <Button
                                    size="lg"
                                    className="w-full sm:w-auto h-12 sm:h-11 px-6 text-base font-semibold bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 shadow-lg hover:shadow-xl transition-all duration-200"
                                >
                                    Start free trial
                                    <ArrowRight className="w-4 h-4 ml-2" />
                                </Button>
                            </Link>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, delay: 1.5 }}
                            className="hidden sm:block"
                        >
                            <Link href="#demo">
                                <Button
                                    size="lg"
                                    variant="ghost"
                                    className="h-11 px-6 text-base font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-transparent"
                                >
                                    See it in action →
                                </Button>
                            </Link>
                        </motion.div>
                    </div>
                </div>

                {/* Dashboard Preview Card */}
                <div className="relative max-w-5xl mx-auto">
                    <motion.div
                        style={{ y }}
                        initial={{ opacity: 0, y: 60 }}
                        animate={{
                            opacity: 1,
                            y: [0, -6, 0]
                        }}
                        transition={{
                            opacity: { duration: 0.7, delay: 1.6 },
                            y: {
                                duration: 6,
                                repeat: Infinity,
                                ease: "easeInOut",
                                delay: 1.6
                            }
                        }}
                        className="w-full max-w-4xl mx-auto"
                    >
                        <div className="bg-slate-900/90 dark:bg-slate-950/90 backdrop-blur-2xl rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-700/50">
                            {/* Browser Chrome */}
                            <div className="flex items-center gap-2 mb-6">
                                <div className="flex gap-1.5">
                                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                                </div>
                                <div className="flex-1 px-4 py-1.5 bg-slate-800/50 rounded-lg text-xs text-slate-400 text-center">
                                    dayflow.com/dashboard
                                </div>
                            </div>

                            {/* Stats Grid */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
                                <div className="bg-slate-800/50 rounded-xl p-4">
                                    <div className="text-xs text-slate-400 mb-1">Total Employees</div>
                                    <div className="text-2xl sm:text-3xl font-bold text-white mb-1">248</div>
                                    <div className="text-xs text-blue-400">+12%</div>
                                </div>
                                <div className="bg-slate-800/50 rounded-xl p-4">
                                    <div className="text-xs text-slate-400 mb-1">Present Today</div>
                                    <div className="text-2xl sm:text-3xl font-bold text-white mb-1">231</div>
                                    <div className="text-xs text-emerald-400">93%</div>
                                </div>
                                <div className="bg-slate-800/50 rounded-xl p-4">
                                    <div className="text-xs text-slate-400 mb-1">On Leave</div>
                                    <div className="text-2xl sm:text-3xl font-bold text-white mb-1">17</div>
                                    <div className="text-xs text-orange-400">-3</div>
                                </div>
                                <div className="bg-slate-800/50 rounded-xl p-4">
                                    <div className="text-xs text-slate-400 mb-1">Pending Requests</div>
                                    <div className="text-2xl sm:text-3xl font-bold text-white mb-1">8</div>
                                    <div className="text-xs text-purple-400">4 new</div>
                                </div>
                            </div>

                            {/* Chart & Departments */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                {/* Attendance Chart */}
                                <div className="lg:col-span-2 bg-slate-800/50 rounded-xl p-5">
                                    <div className="text-sm text-slate-400 mb-4">Attendance Overview</div>
                                    <div className="flex items-end justify-between gap-2 h-32">
                                        {[65, 78, 72, 85, 88, 92, 84].map((height, i) => (
                                            <motion.div
                                                key={i}
                                                initial={{ height: 0 }}
                                                animate={{ height: `${height}%` }}
                                                transition={{
                                                    duration: 0.8,
                                                    delay: 1.8 + i * 0.1,
                                                    ease: [0.22, 1, 0.36, 1]
                                                }}
                                                className="flex-1 bg-gradient-to-t from-blue-600 to-blue-400 rounded-t-lg"
                                            ></motion.div>
                                        ))}
                                    </div>
                                </div>

                                {/* Departments */}
                                <div className="bg-slate-800/50 rounded-xl p-5">
                                    <div className="text-sm text-slate-400 mb-4">Departments</div>
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-slate-300">Engineering</span>
                                            <span className="text-sm font-semibold text-white">84</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-slate-300">Design</span>
                                            <span className="text-sm font-semibold text-white">32</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-slate-300">Marketing</span>
                                            <span className="text-sm font-semibold text-white">28</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-slate-300">HR</span>
                                            <span className="text-sm font-semibold text-white">12</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
