"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

const stats = [
    { label: "Manual errors reduced", value: "94%", color: "text-emerald-600 dark:text-emerald-400" },
    { label: "Time saved weekly", value: "15hrs", color: "text-blue-600 dark:text-blue-400" },
    { label: "Compliance violations", value: "Zero", color: "text-violet-600 dark:text-violet-400" }
];

export default function ProblemSolution() {
    return (
        <section className="py-24 sm:py-32">
            <div className="container mx-auto px-6 sm:px-8 md:px-12 lg:px-16">
                {/* Large number header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="mb-16"
                >
                    <div className="flex items-baseline gap-4 mb-4">
                        <span className="text-7xl sm:text-8xl md:text-9xl font-bold text-slate-900 dark:text-white">02</span>
                        <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800 mt-12"></div>
                    </div>
                    <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900 dark:text-white max-w-3xl">
                        The problem with traditional HR? Everything.
                    </h2>
                </motion.div>

                {/* Bento Grid - Asymmetric layout */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-20">
                    {/* Large card - spans 2 columns */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        className="md:col-span-2 bg-slate-900 dark:bg-slate-800 p-8 sm:p-12 rounded-2xl border border-slate-800 dark:border-slate-700"
                    >
                        <div className="text-sm font-mono text-emerald-400 mb-4">// OLD WAY</div>
                        <h3 className="text-2xl sm:text-3xl font-bold text-white mb-6">
                            Spreadsheets, emails, sticky notes
                        </h3>
                        <div className="space-y-4 text-slate-300">
                            <p className="flex items-start gap-3">
                                <span className="text-red-400 text-xl">×</span>
                                <span>Payroll errors cost you time, money, and employee trust</span>
                            </p>
                            <p className="flex items-start gap-3">
                                <span className="text-red-400 text-xl">×</span>
                                <span>Attendance tracked on spreadsheets = disputed records</span>
                            </p>
                            <p className="flex items-start gap-3">
                                <span className="text-red-400 text-xl">×</span>
                                <span>Documents scattered across emails and folders</span>
                            </p>
                            <p className="flex items-start gap-3">
                                <span className="text-red-400 text-xl">×</span>
                                <span>One audit away from compliance fines</span>
                            </p>
                        </div>
                    </motion.div>

                    {/* Small card */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="bg-white dark:bg-slate-900 p-8 rounded-2xl border-2 border-slate-200 dark:border-slate-800 flex flex-col justify-between"
                    >
                        <div>
                            <div className="text-6xl font-bold text-slate-900 dark:text-white mb-2">73%</div>
                            <p className="text-slate-600 dark:text-slate-400">of HR teams say manual data entry is their biggest time drain</p>
                        </div>
                    </motion.div>
                </div>

                {/* Solution section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                    className="mb-16"
                >
                    <div className="flex items-baseline gap-4 mb-4">
                        <span className="text-7xl sm:text-8xl md:text-9xl font-bold bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">03</span>
                        <div className="h-px flex-1 bg-gradient-to-r from-blue-200 to-emerald-200 dark:from-blue-900 dark:to-emerald-900 mt-12"></div>
                    </div>
                    <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900 dark:text-white max-w-3xl">
                        One system. Zero headaches.
                    </h2>
                </motion.div>

                {/* Bento Grid - Solution cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
                    {/* Tall card */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.4 }}
                        className="md:row-span-2 bg-gradient-to-br from-blue-50 to-emerald-50 dark:from-blue-950/20 dark:to-emerald-950/20 p-8 rounded-2xl border-2 border-blue-200 dark:border-blue-900"
                    >
                        <div className="text-sm font-mono text-blue-600 dark:text-blue-400 mb-4">// AUTOMATED</div>
                        <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
                            Payroll that runs itself
                        </h3>
                        <p className="text-slate-600 dark:text-slate-400 mb-6">
                            AI-powered calculations handle taxes, deductions, and allowances. Zero errors, every time.
                        </p>
                        <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-semibold">
                            <span>Set it and forget it</span>
                            <ArrowRight className="w-4 h-4" />
                        </div>
                    </motion.div>

                    {/* Wide card */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.5 }}
                        className="md:col-span-2 bg-white dark:bg-slate-900 p-8 rounded-2xl border-2 border-slate-200 dark:border-slate-800"
                    >
                        <div className="text-sm font-mono text-emerald-600 dark:text-emerald-400 mb-4">// REAL-TIME</div>
                        <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
                            Smart attendance tracking
                        </h3>
                        <p className="text-slate-600 dark:text-slate-400">
                            Geolocation check-ins, automatic overtime calculations, and instant reports. No more disputes.
                        </p>
                    </motion.div>

                    {/* Stats cards */}
                    {stats.map((stat, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: 0.6 + i * 0.1 }}
                            className="bg-white dark:bg-slate-900 p-6 rounded-2xl border-2 border-slate-200 dark:border-slate-800"
                        >
                            <div className={`text-4xl font-bold mb-2 ${stat.color}`}>{stat.value}</div>
                            <p className="text-sm text-slate-600 dark:text-slate-400">{stat.label}</p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
