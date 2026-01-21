"use client";

import { motion } from "framer-motion";
import { UserPlus, Users, Settings, Sparkles } from "lucide-react";

const steps = [
    {
        number: "01",
        icon: UserPlus,
        title: "Sign Up",
        description: "Create your account in 30 seconds",
        color: "from-blue-500 to-cyan-500"
    },
    {
        number: "02",
        icon: Users,
        title: "Add Team",
        description: "Import employees or invite them directly",
        color: "from-cyan-500 to-teal-500"
    },
    {
        number: "03",
        icon: Settings,
        title: "Configure",
        description: "Set up departments, roles, and payroll rules",
        color: "from-teal-500 to-emerald-500"
    },
    {
        number: "04",
        icon: Sparkles,
        title: "Automate",
        description: "Let DayFlow handle the rest",
        color: "from-emerald-500 to-green-500"
    }
];

export default function Workflow() {
    return (
        <section className="relative py-20 sm:py-24 md:py-32 overflow-hidden">
            {/* Light gradient background */}
            <div className="absolute inset-0 bg-gradient-to-b from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950" />

            {/* Subtle grid pattern */}
            <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]"
                style={{
                    backgroundImage: `
                        linear-gradient(to right, rgb(100 116 139) 1px, transparent 1px),
                        linear-gradient(to bottom, rgb(100 116 139) 1px, transparent 1px)
                    `,
                    backgroundSize: '40px 40px'
                }}
            />

            <div className="container mx-auto px-6 sm:px-8 md:px-12 lg:px-16 relative z-10">
                {/* Section Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-16 sm:mb-20"
                >
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 mb-6">
                        <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        <span className="text-sm font-medium text-blue-600 dark:text-blue-400">How It Works</span>
                    </div>
                    <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6 text-slate-900 dark:text-white">
                        Get started in
                        <span className="block mt-2 bg-gradient-to-r from-blue-600 to-emerald-600 dark:from-blue-400 dark:to-emerald-400 bg-clip-text text-transparent">
                            four simple steps
                        </span>
                    </h2>
                    <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
                        From signup to full automation in less than 10 minutes. No complex setup, no training required.
                    </p>
                </motion.div>

                {/* Timeline - Desktop Horizontal */}
                <div className="hidden lg:block max-w-6xl mx-auto">
                    {/* Connecting Line */}
                    <div className="relative mb-8">
                        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-slate-200 dark:bg-slate-800" />
                        <motion.div
                            initial={{ width: 0 }}
                            whileInView={{ width: "100%" }}
                            viewport={{ once: true, margin: "-100px" }}
                            transition={{ duration: 1.5, ease: "easeInOut", delay: 0.3 }}
                            className="absolute top-1/2 left-0 h-1 bg-gradient-to-r from-blue-500 via-teal-500 to-emerald-500"
                            style={{ transform: "translateY(-50%)" }}
                        />
                    </div>

                    {/* Steps */}
                    <div className="grid grid-cols-4 gap-8">
                        {steps.map((step, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: "-100px" }}
                                transition={{ duration: 0.5, delay: i * 0.15 }}
                                className="relative"
                            >
                                {/* Node Circle */}
                                <motion.div
                                    initial={{ scale: 0 }}
                                    whileInView={{ scale: 1 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.5, delay: i * 0.15 + 0.3, type: "spring", stiffness: 200 }}
                                    className="mx-auto mb-6 relative"
                                >
                                    <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center shadow-xl relative z-10 group-hover:scale-110 transition-transform`}>
                                        <step.icon className="w-9 h-9 text-white" />
                                    </div>
                                    {/* Number badge */}
                                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-slate-900 dark:bg-white rounded-full flex items-center justify-center z-20 border-2 border-white dark:border-slate-900">
                                        <span className="text-xs font-bold text-white dark:text-slate-900">{step.number}</span>
                                    </div>
                                </motion.div>

                                {/* Content */}
                                <div className="text-center">
                                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                                        {step.title}
                                    </h3>
                                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                                        {step.description}
                                    </p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* Timeline - Mobile/Tablet Vertical */}
                <div className="lg:hidden max-w-2xl mx-auto">
                    <div className="relative">
                        {/* Vertical connecting line */}
                        <div className="absolute left-10 top-0 bottom-0 w-0.5 bg-slate-200 dark:bg-slate-800" />
                        <motion.div
                            initial={{ height: 0 }}
                            whileInView={{ height: "100%" }}
                            viewport={{ once: true, margin: "-100px" }}
                            transition={{ duration: 1.5, ease: "easeInOut", delay: 0.3 }}
                            className="absolute left-10 top-0 w-1 bg-gradient-to-b from-blue-500 via-teal-500 to-emerald-500"
                        />

                        {/* Steps */}
                        <div className="space-y-12">
                            {steps.map((step, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, x: -20 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    viewport={{ once: true, margin: "-100px" }}
                                    transition={{ duration: 0.5, delay: i * 0.1 }}
                                    className="relative flex items-start gap-6"
                                >
                                    {/* Node Circle */}
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        whileInView={{ scale: 1 }}
                                        viewport={{ once: true }}
                                        transition={{ duration: 0.5, delay: i * 0.1 + 0.2, type: "spring", stiffness: 200 }}
                                        className="flex-shrink-0 relative"
                                    >
                                        <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center shadow-xl relative z-10`}>
                                            <step.icon className="w-8 h-8 text-white" />
                                        </div>
                                        {/* Number badge */}
                                        <div className="absolute -top-2 -right-2 w-8 h-8 bg-slate-900 dark:bg-white rounded-full flex items-center justify-center z-20 border-2 border-white dark:border-slate-900">
                                            <span className="text-xs font-bold text-white dark:text-slate-900">{step.number}</span>
                                        </div>
                                    </motion.div>

                                    {/* Content */}
                                    <div className="flex-1 pt-3">
                                        <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                                            {step.title}
                                        </h3>
                                        <p className="text-base text-slate-600 dark:text-slate-400 leading-relaxed">
                                            {step.description}
                                        </p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Bottom CTA */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.6, delay: 0.8 }}
                    className="mt-16 text-center"
                >
                    <p className="text-lg text-slate-600 dark:text-slate-400 mb-4">
                        Ready to transform your HR?
                    </p>
                    <div className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 font-semibold text-lg group cursor-pointer">
                        <span>Start your free trial</span>
                        <motion.svg
                            className="w-5 h-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            animate={{ x: [0, 5, 0] }}
                            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </motion.svg>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
