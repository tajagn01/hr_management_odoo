"use client";

import { motion } from "framer-motion";
import { Star, TrendingUp, Zap } from "lucide-react";

const companies = ["TechCorp", "GlobalTech", "Quantum", "StartupX", "BuildRight"];

const testimonials = [
    {
        quote: "Cut payroll time by 70%. Best decision we made.",
        author: "Sarah M.",
        role: "HR Director",
        company: "TechCorp",
        metric: "70%",
        metricLabel: "time saved"
    },
    {
        quote: "Setup took 30 minutes. Been smooth ever since.",
        author: "Mike R.",
        role: "Founder",
        company: "StartupX",
        metric: "30min",
        metricLabel: "setup time"
    },
    {
        quote: "Zero payroll errors in 6 months. Amazing.",
        author: "Priya S.",
        role: "Operations",
        company: "Quantum",
        metric: "0",
        metricLabel: "errors"
    }
];

export default function SocialProof() {
    return (
        <>
            {/* Simple company bar */}
            <section className="py-12 border-y border-slate-200 dark:border-slate-800">
                <div className="container mx-auto px-6 sm:px-8 md:px-12 lg:px-16">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 shrink-0">
                            Trusted by 5,000+ companies
                        </p>
                        <div className="flex flex-wrap items-center justify-center md:justify-end gap-8">
                            {companies.map((company, i) => (
                                <motion.span
                                    key={i}
                                    initial={{ opacity: 0 }}
                                    whileInView={{ opacity: 1 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.5, delay: i * 0.1 }}
                                    className="text-lg font-bold text-slate-400 dark:text-slate-600 hover:text-slate-900 dark:hover:text-slate-300 transition-colors"
                                >
                                    {company}
                                </motion.span>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Testimonials - Bento Grid */}
            <section className="py-24 sm:py-32">
                <div className="container mx-auto px-6 sm:px-8 md:px-12 lg:px-16">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="mb-16"
                    >
                        <div className="flex items-baseline gap-4 mb-4">
                            <span className="text-7xl sm:text-8xl md:text-9xl font-bold text-slate-900 dark:text-white">01</span>
                            <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800 mt-12"></div>
                        </div>
                        <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900 dark:text-white max-w-3xl">
                            Real teams, real results
                        </h2>
                    </motion.div>

                    {/* Bento grid testimonials */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {testimonials.map((testimonial, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: i * 0.1 }}
                                className="bg-white dark:bg-slate-900 p-8 rounded-2xl border-2 border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-800 transition-colors"
                            >
                                <div className="flex gap-1 mb-4">
                                    {[...Array(5)].map((_, j) => (
                                        <Star key={j} className="w-4 h-4 fill-emerald-500 text-emerald-500" />
                                    ))}
                                </div>

                                <p className="text-lg text-slate-900 dark:text-white font-medium mb-6">
                                    "{testimonial.quote}"
                                </p>

                                <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
                                    <div>
                                        <div className="font-semibold text-slate-900 dark:text-white text-sm">
                                            {testimonial.author}
                                        </div>
                                        <div className="text-xs text-slate-500 dark:text-slate-400">
                                            {testimonial.role} @ {testimonial.company}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                                            {testimonial.metric}
                                        </div>
                                        <div className="text-xs text-slate-500 dark:text-slate-400">
                                            {testimonial.metricLabel}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}

                        {/* Large stat card */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: 0.4 }}
                            className="bg-gradient-to-br from-blue-600 to-emerald-600 p-8 rounded-2xl text-white md:col-span-2 lg:col-span-1"
                        >
                            <Zap className="w-12 h-12 mb-4 opacity-80" />
                            <div className="text-6xl font-bold mb-2">4.9</div>
                            <div className="text-lg opacity-90 mb-4">Average rating</div>
                            <div className="text-sm opacity-75">from 2,400+ reviews</div>
                        </motion.div>
                    </div>

                    {/* Simple stats row */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12">
                        {[
                            { value: "5,000+", label: "Companies" },
                            { value: "50K+", label: "Active users" },
                            { value: "99.9%", label: "Uptime" },
                            { value: "24/7", label: "Support" }
                        ].map((stat, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.4, delay: i * 0.1 }}
                                className="text-center p-6 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800"
                            >
                                <div className="text-3xl font-bold text-slate-900 dark:text-white mb-1">{stat.value}</div>
                                <div className="text-sm text-slate-600 dark:text-slate-400">{stat.label}</div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>
        </>
    );
}
