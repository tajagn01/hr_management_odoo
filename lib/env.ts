import { z } from "zod";

// Define the schema for environment variables
const envSchema = z.object({
    // Database
    DATABASE_URL: z.string().url("DATABASE_URL must be a valid URL"),

    // Authentication
    AUTH_SECRET: z.string().min(32, "AUTH_SECRET must be at least 32 characters"),
    AUTH_URL: z.string().url("AUTH_URL must be a valid URL"),

    // Google OAuth
    GOOGLE_CLIENT_ID: z.string().min(1, "GOOGLE_CLIENT_ID is required"),
    GOOGLE_CLIENT_SECRET: z.string().min(1, "GOOGLE_CLIENT_SECRET is required"),

    // Socket.IO
    NEXT_PUBLIC_SOCKET_URL: z.string().url("NEXT_PUBLIC_SOCKET_URL must be a valid URL"),

    // SMTP (optional but recommended)
    SMTP_USER: z.string().email("SMTP_USER must be a valid email").optional(),
    SMTP_PASSWORD: z.string().optional(),
    SMTP_FROM: z.string().email("SMTP_FROM must be a valid email").optional(),
    SMTP_FROM_NAME: z.string().optional(),
    SMTP_HOST: z.string().optional(),
    SMTP_PORT: z.string().optional(),
    SMTP_SECURE: z.string().optional(),

    // Cron
    CRON_SECRET: z.string().min(32, "CRON_SECRET must be at least 32 characters"),

    // Node environment
    NODE_ENV: z.enum(["development", "production", "test"]).optional(),
});

export type Env = z.infer<typeof envSchema>;

// Validate environment variables
export function validateEnv(): Env {
    try {
        const env = envSchema.parse(process.env);
        return env;
    } catch (error) {
        if (error instanceof z.ZodError) {
            const errorMessages = error.issues.map((err: z.ZodIssue) => {
                return `  ❌ ${err.path.join(".")}: ${err.message}`;
            });

            console.error("\n🚨 Environment Variable Validation Failed:\n");
            console.error(errorMessages.join("\n"));
            console.error("\nPlease check your .env file and ensure all required variables are set correctly.\n");

            throw new Error("Invalid environment variables");
        }
        throw error;
    }
}

// Optional: Export validated env for type-safe access
let validatedEnv: Env | null = null;

export function getEnv(): Env {
    if (!validatedEnv) {
        validatedEnv = validateEnv();
    }
    return validatedEnv;
}
