"use client";

import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
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
} from "lucide-react";

const features = [
    {
        icon: Users,
        number: "400+",
        label: "companies automated",
        title: "Employee Management",
        desc: "One source of truth for all your people data."
    },
    {
        icon: Clock,
        number: "99.7%",
        label: " accuracy rate",
        title: "Smart Attendance",
        desc: "GPS check-ins. Auto overtime. Zero disputes."
    },
    {
        icon: Calendar,
        number: "<5sec",
        label: "approval time",
        title: "Leave Management",
        desc: "Request, approve, track. All in one click."
    },
    {
        icon: CreditCard,
        number: "0",
        label: "payroll errors",
        title: "Payroll Automation",
        desc: "Calculations so accurate, you'll forget they exist."
    },
    {
        icon: BarChart3,
        number: "24/7",
        label: "live insights",
        title: "Analytics & Reports",
        desc: "Real-time dashboards that actually tell you something."
    },
    {
        icon: Shield,
        number: "100%",
        label: "compliant",
        title: "Enterprise Security",
        desc: "Bank-level encryption. Sleep better at night."
    }
];

const plans = [
    {
        name: "Starter",
        price: "₹999",
        period: "/month",
        yearlyPrice: "₹799",
        description: "Perfect for small teams getting started",
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
        yearlyPrice: "₹2,499",
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
        yearlyPrice: "Custom",
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

export default function BelowFold() {
    const [isYearly, setIsYearly] = useState(false);

    return (
        <>
            {/* Features Section */}
            <section id="features" className="py-20 sm:py-24 md:py-32 relative overflow-hidden">
                {/* Background with gradient */}
                <div className="absolute inset-0 bg-gradient-to-b from-white via-slate-50/80 to-white dark:from-slate-900 dark:via-slate-950/80 dark:to-slate-900" />

                {/* Radial gradient accent */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[600px] bg-gradient-to-r from-blue-100/20 via-violet-100/20 to-transparent dark:from-blue-900/10 dark:via-violet-900/10 blur-3xl rounded-full pointer-events-none" />

                <div className="container mx-auto px-6 sm:px-8 md:px-12 lg:px-16 relative">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-100px" }}
                        transition={{ duration: 0.6 }}
                        className="text-center mb-16"
                    >
                        <Badge variant="outline" className="mb-4 border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 px-4 py-1.5">
                            <Zap className="w-4 h-4 mr-2" />
                            Powerful Features
                        </Badge>
                        <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6 text-slate-900 dark:text-white">
                            Everything you need to
                            <span className="block bg-gradient-to-r from-blue-600 to-violet-600 dark:from-blue-400 dark:to-violet-400 bg-clip-text text-transparent mt-2 leading-tight">
                                manage your workforce
                            </span>
                        </h2>
                        <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
                            Streamline your HR operations with tools designed for modern businesses.
                        </p>
                    </motion.div>

                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6 max-w-7xl mx-auto">
                        {features.map((feature, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: "-100px" }}
                                transition={{ duration: 0.5, delay: i * 0.08 }}
                                whileHover={{ y: -8, scale: 1.02 }}
                                className="group"
                            >
                                <Card className="relative h-full bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl border-slate-200 dark:border-slate-700 hover:border-blue-500/30 dark:hover:border-blue-500/30 hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-500 overflow-hidden">
                                    {/* Hover gradient overlay */}
                                    <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-transparent to-emerald-50/50 dark:from-blue-900/10 dark:via-transparent dark:to-emerald-900/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                                    <CardHeader className="relative z-10 p-4 sm:p-6">
                                        <feature.icon className="w-8 h-8 sm:w-12 sm:h-12 text-slate-900 dark:text-white mb-3 sm:mb-4" />

                                        <div className="mb-2 sm:mb-4">
                                            <div className="text-xl sm:text-3xl font-bold text-blue-600 dark:text-blue-400 mb-0.5 sm:mb-1">
                                                {feature.number}
                                            </div>
                                            <div className="text-[10px] sm:text-sm text-slate-500 dark:text-slate-400 leading-tight">
                                                {feature.label}
                                            </div>
                                        </div>

                                        <CardTitle className="text-sm sm:text-xl mb-1 sm:mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300">
                                            {feature.title}
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="relative z-10 p-4 sm:p-6 pt-0 sm:pt-0">
                                        <CardDescription className="text-xs sm:text-base leading-snug sm:leading-relaxed text-slate-600 dark:text-slate-400">
                                            {feature.desc}
                                        </CardDescription>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Pricing Section */}
            <section id="pricing" className="py-20 sm:py-24 md:py-32 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950" />
                <div className="container mx-auto px-6 sm:px-8 md:px-12 lg:px-16 relative">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-100px" }}
                        transition={{ duration: 0.6 }}
                        className="text-center mb-12"
                    >
                        <Badge variant="outline" className="mb-4 border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 px-4 py-1.5">
                            <CreditCard className="w-4 h-4 mr-2" />
                            Simple Pricing
                        </Badge>
                        <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6 text-slate-900 dark:text-white">
                            Plans that scale with
                            <span className="block mt-2 bg-gradient-to-r from-emerald-600 to-blue-600 dark:from-emerald-400 dark:to-blue-400 bg-clip-text text-transparent">
                                your business
                            </span>
                        </h2>
                        <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto mb-8">
                            Choose the perfect plan for your team. All plans include a 14-day free trial.
                        </p>
                        <div className="inline-flex items-center gap-4 p-1.5 bg-slate-100 dark:bg-slate-800 rounded-xl">
                            <button
                                onClick={() => setIsYearly(false)}
                                className={`px-6 py-2.5 rounded-lg font-semibold transition-all duration-300 ${!isYearly ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-md' : 'text-slate-600 dark:text-slate-400'}`}
                            >
                                Monthly
                            </button>
                            <button
                                onClick={() => setIsYearly(true)}
                                className={`px-6 py-2.5 rounded-lg font-semibold transition-all duration-300 ${isYearly ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-md' : 'text-slate-600 dark:text-slate-400'}`}
                            >
                                Yearly
                                <span className="ml-2 inline-flex px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300">Save 20%</span>
                            </button>
                        </div>
                    </motion.div>

                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
                        {plans.map((plan, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: "-100px" }}
                                transition={{ duration: 0.5, delay: i * 0.1 }}
                                whileHover={{ y: -4 }}
                            >
                                <Card
                                    className={`relative transition-all duration-300 h-full flex flex-col ${plan.highlighted
                                        ? "border-2 border-blue-500 shadow-2xl lg:scale-105 bg-white dark:bg-slate-800 z-10"
                                        : "border border-slate-200 dark:border-slate-700 hover:shadow-xl bg-white/60 dark:bg-slate-800/60 backdrop-blur"
                                        }`}
                                >
                                    {plan.badge && (
                                        <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-20">
                                            <Badge className="bg-gradient-to-r from-blue-600 to-violet-600 text-white border-none px-4 py-1.5 shadow-lg">
                                                {plan.badge}
                                            </Badge>
                                        </div>
                                    )}
                                    {plan.highlighted && (
                                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-violet-500/5 to-transparent rounded-lg pointer-events-none" />
                                    )}

                                    <CardHeader className="relative">
                                        <CardTitle className="text-2xl text-slate-900 dark:text-white">{plan.name}</CardTitle>
                                        <CardDescription className="text-base mt-2 text-slate-600 dark:text-slate-400">
                                            {plan.description}
                                        </CardDescription>
                                    </CardHeader>

                                    <CardContent className="flex-1 flex flex-col relative">
                                        <div className="mb-8">
                                            <motion.span
                                                key={isYearly ? 'yearly' : 'monthly'}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ duration: 0.3 }}
                                                className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white"
                                            >
                                                {isYearly ? (plan.yearlyPrice || plan.price) : plan.price}
                                            </motion.span>
                                            {plan.period && (
                                                <span className="text-base text-slate-600 dark:text-slate-400 ml-1">
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
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 sm:py-24 md:py-32 relative overflow-hidden">
                {/* Dark gradient background */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-indigo-700 to-violet-800 dark:from-blue-900 dark:via-indigo-950 dark:to-violet-950" />

                {/*Animated gradient orbs */}
                <motion.div
                    className="absolute top-10 left-10 w-96 h-96 bg-white/10 rounded-full blur-3xl"
                    animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.3, 0.5, 0.3]
                    }}
                    transition={{
                        duration: 8,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                />
                <motion.div
                    className="absolute bottom-10 right-10 w-96 h-96 bg-violet-400/20 rounded-full blur-3xl"
                    animate={{
                        scale: [1.2, 1, 1.2],
                        opacity: [0.4, 0.6, 0.4]
                    }}
                    transition={{
                        duration: 10,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                />

                <div className="container mx-auto px-6 sm:px-8 md:px-12 lg:px-16 relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-100px" }}
                        transition={{ duration: 0.6 }}
                        className="max-w-4xl mx-auto text-center"
                    >
                        <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6 text-white">
                            Built for teams of
                            <span className="block mt-2">every size and stage</span>
                        </h2>
                        <p className="text-lg sm:text-xl text-blue-100 mb-10 max-w-2xl mx-auto leading-relaxed">
                            From startups to enterprises, DayFlow grows with you. Start free, scale as needed.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                            <Link href="/register">
                                <motion.div
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    <Button size="lg" className="w-full sm:w-auto h-14 px-10 text-lg font-semibold bg-white hover:bg-slate-50 text-blue-600 shadow-2xl group">
                                        Start Free Trial
                                        <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                                    </Button>
                                </motion.div>
                            </Link>
                            <p className="text-sm text-blue-200">
                                No credit card required • 14-day free trial
                            </p>
                        </div>

                        {/* Trust indicators */}
                        <div className="mt-12 flex flex-wrap justify-center gap-8 items-center opacity-70">
                            <div className="text-center">
                                <div className="text-2xl font-bold text-white mb-1">5,000+</div>
                                <div className="text-sm text-blue-200">Companies</div>
                            </div>
                            <div className="h-12 w-px bg-white/20" />
                            <div className="text-center">
                                <div className="text-2xl font-bold text-white mb-1">99.9%</div>
                                <div className="text-sm text-blue-200">Uptime</div>
                            </div>
                            <div className="h-12 w-px bg-white/20" />
                            <div className="text-center">
                                <div className="text-2xl font-bold text-white mb-1">4.9/5</div>
                                <div className="text-sm text-blue-200">Rating</div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* FAQ Section */}
            <section id="faq" className="py-20 sm:py-24 md:py-32">
                <div className="container mx-auto px-6 sm:px-8 md:px-12 lg:px-16 max-w-4xl">
                    <div className="text-center mb-16 animate-fade-in-up">
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
                    </div>

                    <div className="animate-fade-in-up delay-200">
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
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-slate-950 text-slate-400 py-12 sm:py-16">
                <div className="container mx-auto px-6 sm:px-8 md:px-12 lg:px-16">
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-8 md:gap-12 mb-12 text-left">
                        <div className="col-span-2 md:col-span-2">
                            <div className="flex items-center justify-start gap-3 mb-4">
                                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                                    <Sparkles className="w-5 h-5 text-white" />
                                </div>
                                <span className="text-xl font-bold text-white">DayFlow</span>
                            </div>
                            <p className="text-base text-slate-400 mb-6 max-w-sm">
                                Modern HR management solution designed to help businesses of all sizes streamline their workforce operations.
                            </p>
                        </div>

                        <div className="col-span-1">
                            <h4 className="text-white font-semibold mb-4 text-base">Product</h4>
                            <ul className="space-y-3">
                                {["Features", "Pricing", "Integrations", "Changelog"].map((item) => (
                                    <li key={item}>
                                        <a href="#" className="hover:text-white transition text-base">{item}</a>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="col-span-1">
                            <h4 className="text-white font-semibold mb-4 text-base">Company</h4>
                            <ul className="space-y-3">
                                {["About", "Blog", "Careers", "Contact"].map((item) => (
                                    <li key={item}>
                                        <a href="#" className="hover:text-white transition text-base">{item}</a>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="col-span-2 md:col-span-1">
                            <h4 className="text-white font-semibold mb-4 text-base">Legal</h4>
                            <ul className="space-y-3 md:space-y-3 grid grid-cols-2 md:block gap-3 md:gap-0">
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
        </>
    );
}
