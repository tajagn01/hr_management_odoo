import { z } from "zod";

/**
 * Environment Variable Validation Schema
 * Validates all required environment variables at startup
 * Prevents runtime errors from missing or invalid configuration
 */

const envSchema = z.object({
    // Database
    DATABASE_URL: z.string().url("DATABASE_URL must be a valid URL"),

    // Authentication
    AUTH_SECRET: z.string().min(32, "AUTH_SECRET must be at least 32 characters for security"),
    NEXTAUTH_URL: z.string().url("NEXTAUTH_URL must be a valid URL").optional(),

    // Cron Jobs
    CRON_SECRET: z.string().min(16, "CRON_SECRET must be at least 16 characters"),

    // OAuth (Optional)
    GOOGLE_CLIENT_ID: z.string().optional(),
    GOOGLE_CLIENT_SECRET: z.string().optional(),

    // Email (Optional)
    SMTP_HOST: z.string().optional(),
    SMTP_PORT: z.string().optional(),
    SMTP_USER: z.string().optional(),
    SMTP_PASS: z.string().optional(),
    SMTP_FROM: z.string().email().optional(),

    // Environment
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
});

// Validate environment variables
let env: z.infer<typeof envSchema>;

try {
    env = envSchema.parse(process.env);
} catch (error) {
    if (error instanceof z.ZodError) {
        console.error("❌ Invalid environment variables:");
        error.issues.forEach((err) => {
            console.error(`  - ${err.path.join(".")}: ${err.message}`);
        });
        console.error("\n💡 Please check your .env file and ensure all required variables are set correctly.");
        process.exit(1);
    }
    throw error;
}

export { env };
