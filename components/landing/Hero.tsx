"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { motion, useScroll, useTransform, useInView } from "framer-motion";
import { useRef, useState, useEffect } from "react";

// Counting animation component
function CountingNumber({ target, delay = 0 }: { target: number; delay?: number }) {
    const [count, setCount] = useState(0);
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true });

    useEffect(() => {
        if (!isInView) return;

        const timer = setTimeout(() => {
            const duration = 1500;
            const steps = 60;
            const increment = target / steps;
            let current = 0;

            const interval = setInterval(() => {
                current += increment;
                if (current >= target) {
                    setCount(target);
                    clearInterval(interval);
                } else {
                    setCount(Math.floor(current));
                }
            }, duration / steps);

            return () => clearInterval(interval);
        }, delay * 1000);

        return () => clearTimeout(timer);
    }, [isInView, target, delay]);

    return <span ref={ref}>{count}</span>;
}

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
            className="relative min-h-[90vh] pt-24 pb-28 sm:pt-28 sm:pb-36 lg:pt-32 lg:pb-44 overflow-hidden"
        >
            {/* Animated Gradient Background */}
            <div className="absolute inset-0 bg-gradient-to-b from-slate-50 via-slate-50/95 to-slate-50/0 dark:from-slate-950 dark:via-slate-950/95 dark:to-slate-950/0"></div>

            {/* Animated Grid Background */}
            <motion.div
                className="absolute inset-0 opacity-[0.6] dark:opacity-[0.3]"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0.5, 0.7, 0.5] }}
                transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                style={{
                    backgroundImage: `
                        linear-gradient(to right, rgb(100 116 139 / 0.2) 1px, transparent 1px),
                        linear-gradient(to bottom, rgb(100 116 139 / 0.2) 1px, transparent 1px)
                    `,
                    backgroundSize: '50px 50px'
                }}
            />

            {/* Animated Gradient Background Orbs */}
            <motion.div
                className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-r from-blue-400/30 to-purple-500/30 rounded-full blur-3xl"
                animate={{
                    x: [0, 100, 0],
                    y: [0, 50, 0],
                    scale: [1, 1.2, 1],
                }}
                transition={{
                    duration: 20,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
            />
            <motion.div
                className="absolute bottom-0 right-1/4 w-96 h-96 bg-gradient-to-r from-pink-400/30 to-orange-500/30 rounded-full blur-3xl"
                animate={{
                    x: [0, -100, 0],
                    y: [0, -50, 0],
                    scale: [1, 1.3, 1],
                }}
                transition={{
                    duration: 25,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
            />
            <motion.div
                className="absolute top-1/2 right-0 w-80 h-80 bg-gradient-to-r from-cyan-400/20 to-blue-500/20 rounded-full blur-3xl"
                animate={{
                    x: [0, -80, 0],
                    y: [0, 80, 0],
                    scale: [1, 1.1, 1],
                }}
                transition={{
                    duration: 18,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
            />

            <div className="container mx-auto px-6 sm:px-8 md:px-12 lg:px-16 relative z-10">
                {/* Content */}
                <div className="max-w-5xl mx-auto">
                    {/* Trust Pill */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        whileHover={{ scale: 1.05 }}
                        className="flex justify-center mb-8"
                    >
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl border border-slate-200/50 dark:border-slate-700/50 shadow-sm">
                            <motion.div
                                className="w-1.5 h-1.5 rounded-full bg-emerald-500"
                                animate={{
                                    scale: [1, 1.3, 1],
                                    opacity: [1, 0.7, 1]
                                }}
                                transition={{
                                    duration: 2,
                                    repeat: Infinity,
                                    ease: "easeInOut"
                                }}
                            ></motion.div>
                            <span className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400">
                                Trusted by 5,000+ teams worldwide
                            </span>
                        </div>
                    </motion.div>

                    {/* Headline - Word by Word */}
                    <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-[4.5rem] font-[family-name:var(--font-outfit)] font-bold text-center mb-6 leading-[1.15] tracking-tight">
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
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
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
                        whileHover={{ scale: 1.02 }}
                        className="w-full max-w-5xl mx-auto"
                    >
                        <div className="bg-slate-900/90 dark:bg-slate-950/90 backdrop-blur-2xl rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-700/50 hover:border-slate-600/50 transition-all duration-300">
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
                                <motion.div
                                    className="bg-slate-800/50 rounded-xl p-4 cursor-pointer transition-all hover:bg-slate-800/70 hover:scale-105 hover:shadow-lg hover:shadow-blue-500/20"
                                    whileHover={{ y: -4 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <div className="text-xs text-slate-400 mb-1">Total Employees</div>
                                    <div className="text-2xl sm:text-3xl font-bold text-white mb-1">248</div>
                                    <div className="text-xs text-blue-400">+12%</div>
                                </motion.div>
                                <motion.div
                                    className="bg-slate-800/50 rounded-xl p-4 cursor-pointer transition-all hover:bg-slate-800/70 hover:scale-105 hover:shadow-lg hover:shadow-emerald-500/20"
                                    whileHover={{ y: -4 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <div className="text-xs text-slate-400 mb-1">Present Today</div>
                                    <div className="text-2xl sm:text-3xl font-bold text-white mb-1">231</div>
                                    <div className="text-xs text-emerald-400">93%</div>
                                </motion.div>
                                <motion.div
                                    className="bg-slate-800/50 rounded-xl p-4 cursor-pointer transition-all hover:bg-slate-800/70 hover:scale-105 hover:shadow-lg hover:shadow-orange-500/20"
                                    whileHover={{ y: -4 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <div className="text-xs text-slate-400 mb-1">On Leave</div>
                                    <div className="text-2xl sm:text-3xl font-bold text-white mb-1">17</div>
                                    <div className="text-xs text-orange-400">-3</div>
                                </motion.div>
                                <motion.div
                                    className="bg-slate-800/50 rounded-xl p-4 cursor-pointer transition-all hover:bg-slate-800/70 hover:scale-105 hover:shadow-lg hover:shadow-purple-500/20 border border-transparent hover:border-purple-500/30"
                                    whileHover={{ y: -4 }}
                                    transition={{ duration: 0.2 }}
                                    animate={{
                                        borderColor: ["rgba(168, 85, 247, 0)", "rgba(168, 85, 247, 0.2)", "rgba(168, 85, 247, 0)"]
                                    }}
                                    style={{
                                        animationDuration: "3s",
                                        animationIterationCount: "infinite"
                                    }}
                                >
                                    <div className="text-xs text-slate-400 mb-1">Pending Requests</div>
                                    <div className="text-2xl sm:text-3xl font-bold text-white mb-1">8</div>
                                    <motion.div
                                        className="text-xs text-purple-400"
                                        animate={{ opacity: [1, 0.7, 1] }}
                                        transition={{ duration: 2, repeat: Infinity }}
                                    >
                                        4 new
                                    </motion.div>
                                </motion.div>
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
                                                whileHover={{
                                                    scale: 1.05,
                                                    backgroundColor: "rgba(59, 130, 246, 0.9)"
                                                }}
                                                transition={{
                                                    duration: 0.8,
                                                    delay: 1.8 + i * 0.1,
                                                    ease: [0.22, 1, 0.36, 1]
                                                }}
                                                className="flex-1 bg-gradient-to-t from-blue-600 to-blue-400 rounded-t-lg cursor-pointer"
                                            ></motion.div>
                                        ))}
                                    </div>
                                </div>

                                {/* Departments */}
                                <div className="bg-slate-800/50 rounded-xl p-5">
                                    <div className="text-sm text-slate-400 mb-4">Departments</div>
                                    <div className="space-y-3">
                                        {[
                                            { name: "Engineering", count: 84, delay: 2.2 },
                                            { name: "Design", count: 32, delay: 2.3 },
                                            { name: "Marketing", count: 28, delay: 2.4 },
                                            { name: "HR", count: 12, delay: 2.5 }
                                        ].map((dept, i) => {
                                            const maxCount = 84; // Engineering has the highest count
                                            const percentage = (dept.count / maxCount) * 100;

                                            return (
                                                <motion.div
                                                    key={i}
                                                    initial={{ opacity: 0, x: -10 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ duration: 0.4, delay: dept.delay }}
                                                    whileHover={{ x: 5, backgroundColor: "rgba(51, 65, 85, 0.3)" }}
                                                    className="p-2 rounded-lg transition-all cursor-pointer"
                                                >
                                                    <div className="flex justify-between items-center mb-2">
                                                        <span className="text-sm text-slate-300">{dept.name}</span>
                                                        <span className="text-sm font-semibold text-white">{dept.count}</span>
                                                    </div>
                                                    {/* Animated Progress Bar */}
                                                    <div className="w-full h-1.5 bg-slate-700/50 rounded-full overflow-hidden">
                                                        <motion.div
                                                            className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400"
                                                            initial={{ width: 0 }}
                                                            animate={{ width: `${percentage}%` }}
                                                            transition={{
                                                                duration: 1.5,
                                                                delay: dept.delay,
                                                                ease: [0.22, 1, 0.36, 1]
                                                            }}
                                                        />
                                                    </div>
                                                </motion.div>
                                            );
                                        })}
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
