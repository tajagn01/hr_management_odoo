import pino from 'pino';

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogContext {
    [key: string]: any;
}

const isDevelopment = process.env.NODE_ENV !== 'production';

const pinoLogger = pino({
    level: isDevelopment ? 'debug' : 'info',
    transport: isDevelopment
        ? {
            target: 'pino-pretty',
            options: {
                colorize: true,
                ignore: 'pid,hostname',
                translateTime: 'SYS:standard',
            },
        }
        : undefined,
    base: {
        env: process.env.NODE_ENV,
    },
});

class Logger {
    info(message: string, context?: LogContext): void {
        pinoLogger.info(context || {}, message);
    }

    warn(message: string, context?: LogContext): void {
        pinoLogger.warn(context || {}, message);
    }

    error(message: string, error?: Error | any, context?: LogContext): void {
        const errorContext = {
            ...context,
            ...(error && {
                error: error.message || error,
                stack: error.stack,
                code: error.code,
            }),
        };
        pinoLogger.error(errorContext, message);
    }

    debug(message: string, context?: LogContext): void {
        pinoLogger.debug(context || {}, message);
    }

    // Email-specific logging helpers
    emailSent(to: string, subject: string): void {
        this.info('Email sent successfully', { to, subject, category: 'email' });
    }

    emailFailed(to: string, error: any): void {
        this.error('Email sending failed', error, { to, category: 'email' });
    }

    // API-specific logging helpers
    apiRequest(method: string, path: string, context?: LogContext): void {
        this.debug(`API Request: ${method} ${path}`, { ...context, category: 'api', type: 'request' });
    }

    apiError(method: string, path: string, error: any, context?: LogContext): void {
        this.error(`API Error: ${method} ${path}`, error, { ...context, category: 'api', type: 'error' });
    }
}

// Export singleton instance
export const logger = new Logger();
