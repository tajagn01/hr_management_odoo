"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { Rocket, Building2, Building, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const useCases = [
    {
        id: "startups",
        title: "Startups",
        icon: Rocket,
        tagline: "Focus on growth, not paperwork",
        description: "Automate HR from day one so you can focus on building your product and scaling your team.",
        outcomes: [
            {
                metric: "15hrs",
                label: "Saved per month",
                color: "text-blue-600 dark:text-blue-400"
            },
            {
                metric: "90%",
                label: "Faster onboarding",
                color: "text-emerald-600 dark:text-emerald-400"
            },
            {
                metric: "$0",
                label: "Administrative overhead",
                color: "text-violet-600 dark:text-violet-400"
            }
        ],
        features: [
            "Quick employee onboarding",
            "Automated attendance tracking",
            "Simple payroll processing",
            "Compliance built-in"
        ]
    },
    {
        id: "smes",
        title: "SMEs",
        icon: Building,
        tagline: "Scale your team without scaling HR overhead",
        description: "As you grow from 10 to 100+ employees, DayFlow grows with you — no additional complexity.",
        outcomes: [
            {
                metric: "60%",
                label: "Less HR admin time",
                color: "text-blue-600 dark:text-blue-400"
            },
            {
                metric: "100%",
                label: "Payroll accuracy",
                color: "text-emerald-600 dark:text-emerald-400"
            },
            {
                metric: "3x",
                label: "Faster reporting",
                color: "text-violet-600 dark:text-violet-400"
            }
        ],
        features: [
            "Multi-department management",
            "Advanced leave workflows",
            "Custom payroll rules",
            "Detailed analytics"
        ]
    },
    {
        id: "enterprises",
        title: "Enterprises",
        icon: Building2,
        tagline: "Enterprise-grade security with unlimited scalability",
        description: "Handle thousands of employees across multiple locations with advanced security and custom integrations.",
        outcomes: [
            {
                metric: "99.9%",
                label: "Uptime guarantee",
                color: "text-blue-600 dark:text-blue-400"
            },
            {
                metric: "SOC 2",
                label: "Compliant",
                color: "text-emerald-600 dark:text-emerald-400"
            },
            {
                metric: "24/7",
                label: "Priority support",
                color: "text-violet-600 dark:text-violet-400"
            }
        ],
        features: [
            "Unlimited employees",
            "SSO & advanced security",
            "Custom integrations",
            "Dedicated account manager"
        ]
    },
    {
        id: "hr-managers",
        title: "HR Managers",
        icon: Users,
        tagline: "Spend less time on admin, more time on people",
        description: "Empower your HR team with tools that eliminate busywork and let them focus on strategic initiatives.",
        outcomes: [
            {
                metric: "80%",
                label: "Less manual data entry",
                color: "text-blue-600 dark:text-blue-400"
            },
            {
                metric: "5min",
                label: "Average response time",
                color: "text-emerald-600 dark:text-emerald-400"
            },
            {
                metric: "10x",
                label: "Better insights",
                color: "text-violet-600 dark:text-violet-400"
            }
        ],
        features: [
            "Automated workflows",
            "Self-service portals",
            "Real-time dashboards",
            "One-click reports"
        ]
    }
];

export default function UseCases() {
    const [activeTab, setActiveTab] = useState("startups");
    const activeCase = useCases.find(uc => uc.id === activeTab) || useCases[0];

    return (
        <section className="relative py-20 sm:py-24 md:py-32 overflow-hidden">
            {/* Gradient background */}
            <div className="absolute inset-0 bg-gradient-to-b from-white via-slate-50 to-white dark:from-slate-900 dark:via-slate-950 dark:to-slate-900" />

            {/* Radial gradient accent */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full">
                <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-r from-blue-500/10 via-violet-500/10 to-emerald-500/10 blur-3xl rounded-full" />
            </div>

            <div className="container mx-auto px-6 sm:px-8 md:px-12 lg:px-16 relative z-10">
                {/* Section Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-12 sm:mb-16"
                >
                    <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6 text-slate-900 dark:text-white">
                        Built for teams of
                        <span className="block mt-2 bg-gradient-to-r from-blue-600 via-violet-600 to-emerald-600 dark:from-blue-400 dark:via-violet-400 dark:to-emerald-400 bg-clip-text text-transparent">
                            every size and stage
                        </span>
                    </h2>
                    <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
                        Whether you're a 5-person startup or a 5,000-person enterprise, DayFlow scales with you.
                    </p>
                </motion.div>

                {/* Tab Navigation */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="flex flex-wrap justify-center gap-3 mb-12"
                >
                    {useCases.map((useCase) => {
                        const Icon = useCase.icon;
                        return (
                            <button
                                key={useCase.id}
                                onClick={() => setActiveTab(useCase.id)}
                                className={`
                                    group relative px-6 py-3 rounded-xl font-semibold transition-all duration-300
                                    ${activeTab === useCase.id
                                        ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-lg'
                                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                                    }
                                `}
                            >
                                <span className="flex items-center gap-2">
                                    <Icon className="w-4 h-4" />
                                    {useCase.title}
                                </span>
                                {activeTab === useCase.id && (
                                    <motion.div
                                        layoutId="activeTab"
                                        className="absolute inset-0 bg-slate-900 dark:bg-white rounded-xl -z-10"
                                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                    />
                                )}
                            </button>
                        );
                    })}
                </motion.div>

                {/* Content Area */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                        className="max-w-5xl mx-auto"
                    >
                        <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl border border-slate-200 dark:border-slate-700 rounded-3xl p-8 sm:p-10 md:p-12 shadow-2xl">
                            {/* Icon & Title */}
                            <div className="flex items-start gap-6 mb-8">
                                <div className="flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center shadow-lg">
                                    <activeCase.icon className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-3">
                                        {activeCase.tagline}
                                    </h3>
                                    <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed">
                                        {activeCase.description}
                                    </p>
                                </div>
                            </div>

                            {/* Outcome Metrics */}
                            <div className="grid sm:grid-cols-3 gap-6 mb-10">
                                {activeCase.outcomes.map((outcome, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ duration: 0.4, delay: i * 0.1 }}
                                        className="text-center p-6 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700"
                                    >
                                        <div className={`text-4xl sm:text-5xl font-bold mb-2 ${outcome.color}`}>
                                            {outcome.metric}
                                        </div>
                                        <div className="text-sm text-slate-600 dark:text-slate-400 font-medium">
                                            {outcome.label}
                                        </div>
                                    </motion.div>
                                ))}
                            </div>

                            {/* Features Grid */}
                            <div className="grid sm:grid-cols-2 gap-4 mb-8">
                                {activeCase.features.map((feature, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ duration: 0.3, delay: i * 0.05 }}
                                        className="flex items-center gap-3"
                                    >
                                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                                            <svg className="w-4 h-4 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                        </div>
                                        <span className="text-base text-slate-700 dark:text-slate-300 font-medium">
                                            {feature}
                                        </span>
                                    </motion.div>
                                ))}
                            </div>

                            {/* CTA */}
                            <div className="flex flex-col sm:flex-row gap-4 pt-4">
                                <Link href="/register" className="flex-1">
                                    <Button size="lg" className="w-full bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 shadow-lg">
                                        Start Free Trial
                                    </Button>
                                </Link>
                                <Link href="#pricing" className="flex-1">
                                    <Button size="lg" variant="outline" className="w-full border-2">
                                        View Pricing
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </motion.div>
                </AnimatePresence>
            </div>
        </section>
    );
}
