"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
    ArrowRight,
    ArrowLeft,
    Check,
    Loader2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

// --- Types & Constants ---

const DEPARTMENTS = ["IT", "Design", "Product", "HR", "Marketing", "Analytics"];

interface FormData {
    fullName: string;
    dateOfBirth: Date | undefined;
    phone: string;
    address: string;
    joiningDate: Date | undefined;
    department: string;
    designation: string;
    managerId: string;
}

// --- Components ---

const FloatingLabelInput = ({
    id,
    label,
    value,
    onChange,
    type = "text",
    placeholder = "",
    autoFocus = false,
    className
}: {
    id: string;
    label: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
    type?: string;
    placeholder?: string;
    autoFocus?: boolean;
    className?: string;
}) => {
    const [isFocused, setIsFocused] = useState(false);
    const hasValue = value.length > 0;

    return (
        <div className={cn("relative group", className)}>
            <motion.label
                initial={false}
                animate={{
                    top: isFocused || hasValue ? -10 : 16,
                    fontSize: isFocused || hasValue ? 12 : 16,
                    color: isFocused ? "hsl(var(--primary))" : hasValue ? "hsl(var(--muted-foreground))" : "hsl(var(--muted-foreground))"
                }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="absolute left-4 pointer-events-none z-10 font-medium bg-background px-1"
            >
                {label}
            </motion.label>
            {type === "textarea" ? (
                <textarea
                    id={id}
                    value={value}
                    onChange={onChange}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    autoFocus={autoFocus}
                    className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 min-h-[120px] pt-4 resize-none"
                />
            ) : (
                <input
                    id={id}
                    type={type}
                    value={value}
                    onChange={onChange}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    autoFocus={autoFocus}
                    className="flex h-14 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 pt-4"
                />
            )}
        </div>
    );
};

// --- Main Page Component ---

export default function CompleteProfilePage() {
    const { data: session, update } = useSession();
    const router = useRouter();

    useEffect(() => {
        if (session?.user && (session.user as any).profileCompleted) {
            router.replace("/employee");
        }
    }, [session, router]);

    const [currentStep, setCurrentStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [direction, setDirection] = useState(0); // -1 for back, 1 for next
    const [managers, setManagers] = useState<{ id: string; fullName: string; designation: string }[]>([]);

    useEffect(() => {
        async function fetchManagers() {
            try {
                const res = await fetch("/api/public/managers");
                if (res.ok) {
                    const data = await res.json();
                    setManagers(data);
                }
            } catch (err) {
                console.error("Failed to fetch managers", err);
            }
        }
        fetchManagers();
    }, []);

    // Form data
    const [formData, setFormData] = useState<FormData>({
        fullName: "",
        dateOfBirth: undefined,
        phone: "",
        address: "",
        joiningDate: undefined,
        department: "",
        designation: "",
        managerId: ""
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    // Validate current step
    const validateStep = () => {
        const newErrors: Record<string, string> = {};

        switch (currentStep) {
            case 1:
                if (!formData.fullName || formData.fullName.trim().length < 2) {
                    newErrors.fullName = "Full name is required";
                }
                break;
            case 2:
                if (!formData.dateOfBirth) {
                    newErrors.dateOfBirth = "Date of birth is required";
                }
                break;
            case 3:
                if (!formData.phone || !/^[+\d\s()-]+$/.test(formData.phone)) {
                    newErrors.phone = "Valid phone number is required";
                }
                break;
            case 4:
                if (!formData.address || formData.address.trim().length < 10) {
                    newErrors.address = "Address must be at least 10 characters";
                }
                break;
            case 5:
                if (!formData.joiningDate) {
                    newErrors.joiningDate = "Joining date is required";
                }
                break;
            case 6:
                if (!formData.department) {
                    newErrors.department = "Select a department";
                }
                break;
            case 7:
                if (!formData.designation || formData.designation.trim().length < 2) {
                    newErrors.designation = "Designation is required";
                }
                break;
            case 8:
                // Manager is optional, but if we wanted to enforce it we would check here.
                break;
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleNext = () => {
        if (validateStep()) {
            setDirection(1);
            setCurrentStep(prev => Math.min(prev + 1, 8));
        }
    };

    const handleBack = () => {
        setDirection(-1);
        setCurrentStep(prev => Math.max(prev - 1, 1));
        setErrors({});
    };

    const handleSubmit = async () => {
        if (!validateStep()) return;

        setIsSubmitting(true);
        try {
            const res = await fetch("/api/employees/complete-profile", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...formData,
                    dateOfBirth: formData.dateOfBirth?.toISOString(),
                    joiningDate: formData.joiningDate?.toISOString()
                })
            });

            if (res.ok) {
                await update({ profileCompleted: true });
                router.refresh();
                router.push("/employee");
            } else {
                const data = await res.json();
                alert(data.error || "Failed to complete profile");
            }
        } catch (error) {
            console.error("Error completing profile:", error);
            alert("An error occurred. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Animation Variants
    const slideVariants = {
        enter: (direction: number) => ({
            x: direction > 0 ? 50 : -50,
            opacity: 0,
            scale: 0.95
        }),
        center: {
            zIndex: 1,
            x: 0,
            opacity: 1,
            scale: 1
        },
        exit: (direction: number) => ({
            zIndex: 0,
            x: direction < 0 ? 50 : -50,
            opacity: 0,
            scale: 0.95
        })
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background overflow-hidden font-sans text-foreground">
            {/* Main Card */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="w-full max-w-4xl px-4"
            >
                <Card className="shadow-2xl bg-background/40 backdrop-blur-2xl border-muted/20">
                    <div className="relative h-1 w-full bg-secondary/30 overflow-hidden rounded-t-xl">
                        <motion.div
                            className="h-full bg-primary transition-all duration-300 ease-in-out"
                            initial={{ width: 0 }}
                            animate={{ width: `${(currentStep / 8) * 100}%` }}
                        />
                    </div>

                    <CardHeader className="space-y-1 pb-2 pt-6">
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                    Step {currentStep} of 8
                                </span>
                                <CardTitle className="text-2xl font-bold tracking-tight">
                                    {currentStep === 1 && "Welcome Aboard"}
                                    {currentStep === 2 && "Basic Details"}
                                    {currentStep === 3 && "Contact Info"}
                                    {currentStep === 4 && "Resident Info"}
                                    {currentStep === 5 && "Employment"}
                                    {currentStep === 6 && "Department"}
                                    {currentStep === 7 && "Your Role"}
                                    {currentStep === 8 && "Reporting Manager"}
                                </CardTitle>
                            </div>
                        </div>
                        <CardDescription className="text-base pt-1">
                            {currentStep === 1 && "Let's start with your name."}
                            {currentStep === 2 && "When were you born?"}
                            {currentStep === 3 && "How can we reach you?"}
                            {currentStep === 4 && "Where do you currently reside?"}
                            {currentStep === 5 && "When did you join the team?"}
                            {currentStep === 6 && "Which department are you joining?"}
                            {currentStep === 7 && "What is your official designation?"}
                            {currentStep === 8 && "Who will you be reporting to?"}
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="min-h-[200px] pt-2 relative overflow-hidden">
                        <AnimatePresence mode="wait" custom={direction}>
                            <motion.div
                                key={currentStep}
                                custom={direction}
                                variants={slideVariants}
                                initial="enter"
                                animate="center"
                                exit="exit"
                                transition={{ x: { type: "spring", stiffness: 300, damping: 30 }, opacity: { duration: 0.2 } }}
                                className="space-y-4"
                            >
                                {/* Step 1: Full Name */}
                                {currentStep === 1 && (
                                    <div className="space-y-4">
                                        <FloatingLabelInput
                                            id="fullName"
                                            label="Full Name"
                                            value={formData.fullName}
                                            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                            autoFocus
                                        />
                                        {errors.fullName && <p className="text-destructive text-sm font-medium ml-1">{errors.fullName}</p>}
                                    </div>
                                )}

                                {/* Step 2: Date of Birth */}
                                {currentStep === 2 && (
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-3 gap-4">
                                            {/* Month Select */}
                                            <Select
                                                value={formData.dateOfBirth ? formData.dateOfBirth.getMonth().toString() : undefined}
                                                onValueChange={(monthStr) => {
                                                    const newDate = new Date(formData.dateOfBirth || new Date(1995, 0, 1));
                                                    newDate.setMonth(parseInt(monthStr));
                                                    setFormData({ ...formData, dateOfBirth: newDate });
                                                }}
                                            >
                                                <SelectTrigger className="h-14">
                                                    <SelectValue placeholder="Month" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {Array.from({ length: 12 }, (_, i) => (
                                                        <SelectItem key={i} value={i.toString()}>
                                                            {new Date(0, i).toLocaleString('default', { month: 'long' })}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>

                                            {/* Day Select */}
                                            <Select
                                                value={formData.dateOfBirth ? formData.dateOfBirth.getDate().toString() : undefined}
                                                onValueChange={(dayStr) => {
                                                    const newDate = new Date(formData.dateOfBirth || new Date(1995, 0, 1));
                                                    newDate.setDate(parseInt(dayStr));
                                                    setFormData({ ...formData, dateOfBirth: newDate });
                                                }}
                                            >
                                                <SelectTrigger className="h-14">
                                                    <SelectValue placeholder="Day" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                                                        <SelectItem key={day} value={day.toString()}>
                                                            {day}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>

                                            {/* Year Select */}
                                            <Select
                                                value={formData.dateOfBirth ? formData.dateOfBirth.getFullYear().toString() : undefined}
                                                onValueChange={(yearStr) => {
                                                    const newDate = new Date(formData.dateOfBirth || new Date(1995, 0, 1));
                                                    newDate.setFullYear(parseInt(yearStr));
                                                    setFormData({ ...formData, dateOfBirth: newDate });
                                                }}
                                            >
                                                <SelectTrigger className="h-14">
                                                    <SelectValue placeholder="Year" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {Array.from({ length: 100 }, (_, i) => new Date().getFullYear() - i).map((year) => (
                                                        <SelectItem key={year} value={year.toString()}>
                                                            {year}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        {errors.dateOfBirth && <p className="text-destructive text-sm font-medium ml-1">{errors.dateOfBirth}</p>}
                                    </div>
                                )}

                                {/* Step 3: Phone */}
                                {currentStep === 3 && (
                                    <div className="space-y-4">
                                        <FloatingLabelInput
                                            id="phone"
                                            label="Phone Number"
                                            value={formData.phone}
                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                            placeholder="+1 (555) 000-0000"
                                            autoFocus
                                        />
                                        {errors.phone && <p className="text-destructive text-sm font-medium ml-1">{errors.phone}</p>}
                                    </div>
                                )}

                                {/* Step 4: Address */}
                                {currentStep === 4 && (
                                    <div className="space-y-4">
                                        <FloatingLabelInput
                                            id="address"
                                            label="Full Address"
                                            value={formData.address}
                                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                            type="textarea"
                                            autoFocus
                                            className="h-32"
                                        />
                                        {errors.address && <p className="text-destructive text-sm font-medium ml-1">{errors.address}</p>}
                                    </div>
                                )}

                                {/* Step 5: Joining Date */}
                                {currentStep === 5 && (
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-3 gap-4">
                                            {/* Month Select */}
                                            <Select
                                                value={formData.joiningDate ? formData.joiningDate.getMonth().toString() : undefined}
                                                onValueChange={(monthStr) => {
                                                    const newDate = new Date(formData.joiningDate || new Date());
                                                    newDate.setMonth(parseInt(monthStr));
                                                    setFormData({ ...formData, joiningDate: newDate });
                                                }}
                                            >
                                                <SelectTrigger className="h-14">
                                                    <SelectValue placeholder="Month" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {Array.from({ length: 12 }, (_, i) => (
                                                        <SelectItem key={i} value={i.toString()}>
                                                            {new Date(0, i).toLocaleString('default', { month: 'long' })}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>

                                            {/* Day Select */}
                                            <Select
                                                value={formData.joiningDate ? formData.joiningDate.getDate().toString() : undefined}
                                                onValueChange={(dayStr) => {
                                                    const newDate = new Date(formData.joiningDate || new Date());
                                                    newDate.setDate(parseInt(dayStr));
                                                    setFormData({ ...formData, joiningDate: newDate });
                                                }}
                                            >
                                                <SelectTrigger className="h-14">
                                                    <SelectValue placeholder="Day" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                                                        <SelectItem key={day} value={day.toString()}>
                                                            {day}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>

                                            {/* Year Select */}
                                            <Select
                                                value={formData.joiningDate ? formData.joiningDate.getFullYear().toString() : undefined}
                                                onValueChange={(yearStr) => {
                                                    const newDate = new Date(formData.joiningDate || new Date());
                                                    newDate.setFullYear(parseInt(yearStr));
                                                    setFormData({ ...formData, joiningDate: newDate });
                                                }}
                                            >
                                                <SelectTrigger className="h-14">
                                                    <SelectValue placeholder="Year" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {Array.from({ length: 30 }, (_, i) => new Date().getFullYear() - i).map((year) => (
                                                        <SelectItem key={year} value={year.toString()}>
                                                            {year}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        {errors.joiningDate && <p className="text-destructive text-sm font-medium ml-1">{errors.joiningDate}</p>}
                                    </div>
                                )}

                                {/* Step 6: Department */}
                                {currentStep === 6 && (
                                    <div className="space-y-4">
                                        <Select value={formData.department} onValueChange={(value) => setFormData({ ...formData, department: value })}>
                                            <SelectTrigger className="h-12 text-base">
                                                <SelectValue placeholder="Select Department" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {DEPARTMENTS.map((dept) => (
                                                    <SelectItem key={dept} value={dept}>
                                                        {dept}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {errors.department && <p className="text-destructive text-sm font-medium ml-1">{errors.department}</p>}
                                    </div>
                                )}

                                {/* Step 7: Designation */}
                                {currentStep === 7 && (
                                    <div className="space-y-4">
                                        <FloatingLabelInput
                                            id="designation"
                                            label="Designation"
                                            value={formData.designation}
                                            onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                                            autoFocus
                                        />
                                        {errors.designation && <p className="text-destructive text-sm font-medium ml-1">{errors.designation}</p>}
                                    </div>
                                )}

                                {/* Step 8: Manager Selection */}
                                {currentStep === 8 && (
                                    <div className="space-y-4">
                                        <Select value={formData.managerId} onValueChange={(value) => setFormData({ ...formData, managerId: value })}>
                                            <SelectTrigger className="h-12 text-base">
                                                <SelectValue placeholder="Select Reporting Manager (Optional)" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {managers.length === 0 && (
                                                    <div className="p-2 text-sm text-muted-foreground text-center">No managers found</div>
                                                )}
                                                {managers.map((manager) => (
                                                    <SelectItem key={manager.id} value={manager.id}>
                                                        {manager.fullName} ({manager.designation})
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <p className="text-xs text-muted-foreground ml-1">
                                            If you don't see your manager, you can assign one later or ask HR.
                                        </p>
                                    </div>
                                )}

                            </motion.div>
                        </AnimatePresence>
                    </CardContent>

                    <CardFooter className="flex justify-between pt-6">
                        {currentStep > 1 && (
                            <Button
                                variant="ghost"
                                onClick={handleBack}
                                className="h-12 px-6"
                            >
                                <ArrowLeft className="mr-2 h-5 w-5" />
                                Back
                            </Button>
                        )}

                        <Button
                            onClick={currentStep === 8 ? handleSubmit : handleNext}
                            disabled={isSubmitting}
                            className={cn(
                                "flex-1 ml-auto h-12 text-lg font-semibold",
                                currentStep === 1 && "w-full"
                            )}
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                    Finalizing...
                                </>
                            ) : currentStep === 8 ? (
                                <>
                                    Complete Profile
                                    <Check className="ml-2 h-5 w-5" />
                                </>
                            ) : (
                                <>
                                    Continue
                                    <ArrowRight className="ml-2 h-5 w-5" />
                                </>
                            )}
                        </Button>
                    </CardFooter>
                </Card>
            </motion.div>
        </div>
    );
}
