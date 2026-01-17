"use client";

import Link from "next/link";
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
    return (
        <>
            {/* Features Section */}
            <section id="features" className="py-20 sm:py-24 md:py-32 relative overflow-hidden">
                <div className="absolute inset-0 bg-slate-50 dark:bg-slate-950">
                    <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-100/20 via-transparent to-transparent dark:from-blue-900/20"></div>
                </div>

                <div className="container mx-auto px-6 sm:px-8 md:px-12 lg:px-16 relative">
                    <div className="text-center mb-16 animate-fade-in-up">
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
                    </div>

                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {features.map((feature, i) => (
                            <div key={i} className="animate-fade-in-up" style={{ animationDelay: `${i * 100}ms` }}>
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
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Pricing Section */}
            <section id="pricing" className="py-20 sm:py-24 md:py-32">
                <div className="container mx-auto px-6 sm:px-8 md:px-12 lg:px-16">
                    <div className="text-center mb-16 animate-fade-in-up">
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
                    </div>

                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
                        {plans.map((plan, i) => (
                            <div key={i} className="animate-fade-in-up" style={{ animationDelay: `${i * 100}ms` }}>
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
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* FAQ Section */}
            <section id="faq" className="py-20 sm:py-24 md:py-32">
                <div className="container mx-auto px-6 sm:px-8 md:px-12 lg:px-16 max-w-3xl">
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

            {/* CTA Section */}
            <section className="py-20 sm:py-24 md:py-32">
                <div className="container mx-auto px-6 sm:px-8 md:px-12 lg:px-16">
                    <div className="animate-fade-in-up">
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
                                        <Button size="lg" variant="outline" className="w-full sm:w-auto text-base font-semibold text-white border-2 border-white/50 hover:bg-white/20 hover:border-white/70 h-14 px-10">
                                            View Pricing
                                        </Button>
                                    </Link>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-slate-950 text-slate-400 py-16">
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
        </>
    );
}
