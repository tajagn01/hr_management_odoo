import { NextRequest, NextResponse } from "next/server";

interface RateLimitConfig {
    windowMs: number; // Time window in milliseconds
    maxRequests: number; // Maximum number of requests per window
}

interface RateLimitEntry {
    count: number;
    resetTime: number;
}

// In-memory store for rate limiting
// In production, consider using Redis or similar
const rateLimitStore = new Map<string, RateLimitEntry>();

// Cleanup old entries every 10 minutes
setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of rateLimitStore.entries()) {
        if (entry.resetTime < now) {
            rateLimitStore.delete(key);
        }
    }
}, 10 * 60 * 1000);

/**
 * Get client identifier from request
 * Uses IP address or fallback to a header
 */
function getClientIdentifier(request: NextRequest): string {
    // Try to get real IP from headers (for proxies/load balancers)
    const forwardedFor = request.headers.get("x-forwarded-for");
    if (forwardedFor) {
        return forwardedFor.split(",")[0].trim();
    }

    const realIp = request.headers.get("x-real-ip");
    if (realIp) {
        return realIp;
    }

    // Fallback to unknown if no IP headers found
    return "unknown";
}

/**
 * Rate limiter middleware
 * Returns null if request is allowed, or NextResponse with 429 status if rate limited
 */
export function rateLimit(
    request: NextRequest,
    config: RateLimitConfig,
    identifier?: string
): NextResponse | null {
    const clientId = identifier || getClientIdentifier(request);
    const key = `${clientId}:${request.nextUrl.pathname}`;
    const now = Date.now();

    const entry = rateLimitStore.get(key);

    if (!entry) {
        // First request from this client
        rateLimitStore.set(key, {
            count: 1,
            resetTime: now + config.windowMs,
        });
        return null; // Allow request
    }

    if (entry.resetTime < now) {
        // Window has expired, reset
        rateLimitStore.set(key, {
            count: 1,
            resetTime: now + config.windowMs,
        });
        return null; // Allow request
    }

    if (entry.count >= config.maxRequests) {
        // Rate limit exceeded
        const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
        return NextResponse.json(
            {
                error: "Too many requests. Please try again later.",
                retryAfter,
            },
            {
                status: 429,
                headers: {
                    "Retry-After": retryAfter.toString(),
                    "X-RateLimit-Limit": config.maxRequests.toString(),
                    "X-RateLimit-Remaining": "0",
                    "X-RateLimit-Reset": entry.resetTime.toString(),
                },
            }
        );
    }

    // Increment count
    entry.count++;
    rateLimitStore.set(key, entry);

    return null; // Allow request
}

/**
 * Preset rate limit configurations
 */
export const RateLimitPresets = {
    // Strict: For sensitive operations like login, registration
    strict: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        maxRequests: 5,
    },
    // Moderate: For OTP verification, password reset
    moderate: {
        windowMs: 10 * 60 * 1000, // 10 minutes
        maxRequests: 10,
    },
    // Lenient: For general API endpoints
    lenient: {
        windowMs: 1 * 60 * 1000, // 1 minute
        maxRequests: 60,
    },
    // OTP Resend: Very strict for resending OTPs
    otpResend: {
        windowMs: 1 * 60 * 1000, // 1 minute
        maxRequests: 1, // Only 1 request per minute
    },
};
