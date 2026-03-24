/**
 * Base class for all Kloddy-related errors.
 */
export class KloddyError extends Error {
  constructor(message: string, public status?: number, public code?: string) {
    super(message);
    this.name = 'KloddyError';
    Object.setPrototypeOf(this, KloddyError.prototype);
  }
}

/**
 * Thrown when authentication fails.
 */
export class KloddyAuthError extends KloddyError {
  constructor(message: string) {
    super(message, 401, 'AUTH_FAILED');
    this.name = 'KloddyAuthError';
    Object.setPrototypeOf(this, KloddyAuthError.prototype);
  }
}

/**
 * Thrown when a resource (e.g., prompt, organization) is not found.
 */
export class KloddyNotFoundError extends KloddyError {
  constructor(message: string) {
    super(message, 404, 'NOT_FOUND');
    this.name = 'KloddyNotFoundError';
    Object.setPrototypeOf(this, KloddyNotFoundError.prototype);
  }
}

/**
 * Thrown when the API rate limit is exceeded.
 */
export class KloddyRateLimitError extends KloddyError {
  constructor(message: string) {
    super(message, 429, 'RATE_LIMIT_EXCEEDED');
    this.name = 'KloddyRateLimitError';
    Object.setPrototypeOf(this, KloddyRateLimitError.prototype);
  }
}
