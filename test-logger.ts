import { logger } from './lib/logger';

console.log('--- Testing Pino Logger ---');
logger.info('This is an info message', { test: true });
logger.warn('This is a warning message');
logger.error('This is an error message', new Error('Test error'));
logger.debug('This is a debug message'); // Should verify if this shows up based on env
logger.emailSent('test@example.com', 'Test Subject');
logger.emailFailed('test@example.com', new Error('SMTP Error'));
logger.apiRequest('GET', '/api/test', { userId: '123' });
console.log('--- Test Complete ---');
