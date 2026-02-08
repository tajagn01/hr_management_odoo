import { NextRequest, NextResponse } from 'next/server';

/**
 * API Versioning Middleware
 * Handles API version routing and deprecation warnings
 */

export const API_VERSIONS = {
    V1: 'v1',
    CURRENT: 'v1',
} as const;

export type ApiVersion = typeof API_VERSIONS[keyof typeof API_VERSIONS];

/**
 * Extract API version from request path
 * Example: /api/v1/employees -> 'v1'
 */
export function getApiVersion(request: NextRequest): ApiVersion | null {
    const pathname = request.nextUrl.pathname;
    const versionMatch = pathname.match(/\/api\/(v\d+)\//);

    if (versionMatch) {
        return versionMatch[1] as ApiVersion;
    }

    return null;
}

/**
 * Check if API version is deprecated
 */
export function isDeprecated(version: ApiVersion): boolean {
    // Currently no deprecated versions
    // In future: return version === 'v0';
    return false;
}

/**
 * Get deprecation warning message
 */
export function getDeprecationWarning(version: ApiVersion): string | null {
    if (!isDeprecated(version)) return null;

    return `API version ${version} is deprecated. Please migrate to ${API_VERSIONS.CURRENT}.`;
}

/**
 * Add versioning headers to response
 */
export function addVersionHeaders(
    response: NextResponse,
    version: ApiVersion
): NextResponse {
    response.headers.set('X-API-Version', version);
    response.headers.set('X-API-Current-Version', API_VERSIONS.CURRENT);

    const deprecationWarning = getDeprecationWarning(version);
    if (deprecationWarning) {
        response.headers.set('X-API-Deprecation-Warning', deprecationWarning);
        response.headers.set('Deprecation', 'true');
    }

    return response;
}

/**
 * Validate API version
 */
export function validateApiVersion(version: ApiVersion | null): {
    valid: boolean;
    error?: string;
} {
    if (!version) {
        return { valid: false, error: 'API version not specified' };
    }

    const validVersions = Object.values(API_VERSIONS);
    if (!validVersions.includes(version)) {
        return {
            valid: false,
            error: `Invalid API version. Supported versions: ${validVersions.join(', ')}`,
        };
    }

    return { valid: true };
}

/**
 * Wrapper for versioned API handlers
 */
export function withApiVersion<T extends (...args: any[]) => Promise<NextResponse>>(
    handler: T,
    options?: {
        requireVersion?: boolean;
        minVersion?: ApiVersion;
    }
): T {
    return (async (request: NextRequest, ...args: any[]) => {
        const version = getApiVersion(request);

        // Validate version if required
        if (options?.requireVersion) {
            const validation = validateApiVersion(version);
            if (!validation.valid) {
                return NextResponse.json(
                    { error: validation.error },
                    { status: 400 }
                );
            }
        }

        // Execute handler
        const response = await handler(request, ...args);

        // Add version headers
        if (version) {
            return addVersionHeaders(response, version);
        }

        return response;
    }) as T;
}
