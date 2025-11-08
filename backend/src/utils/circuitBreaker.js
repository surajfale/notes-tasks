const logger = require('./logger');

/**
 * Circuit Breaker implementation for external service calls
 * Prevents cascading failures by temporarily blocking requests to failing services
 */
class CircuitBreaker {
  constructor(options = {}) {
    this.failureThreshold = options.failureThreshold || 5; // Number of failures before opening circuit
    this.successThreshold = options.successThreshold || 2; // Number of successes to close circuit
    this.timeout = options.timeout || 60000; // Time in ms to wait before trying again (1 minute default)
    this.name = options.name || 'CircuitBreaker';
    
    this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
    this.failureCount = 0;
    this.successCount = 0;
    this.nextAttempt = Date.now();
    this.lastError = null;
  }

  /**
   * Execute a function with circuit breaker protection
   * @param {Function} fn - Async function to execute
   * @returns {Promise<any>}
   */
  async execute(fn) {
    if (this.state === 'OPEN') {
      if (Date.now() < this.nextAttempt) {
        const error = new Error(`Circuit breaker is OPEN for ${this.name}. Service temporarily unavailable.`);
        error.circuitBreakerOpen = true;
        error.nextAttempt = this.nextAttempt;
        error.lastError = this.lastError;
        
        logger.warn(`Circuit breaker ${this.name} is OPEN`, {
          state: this.state,
          failureCount: this.failureCount,
          nextAttempt: new Date(this.nextAttempt).toISOString(),
          lastError: this.lastError
        });
        
        throw error;
      }
      
      // Transition to HALF_OPEN to test if service recovered
      this.state = 'HALF_OPEN';
      this.successCount = 0;
      
      logger.info(`Circuit breaker ${this.name} transitioning to HALF_OPEN`, {
        state: this.state
      });
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure(error);
      throw error;
    }
  }

  /**
   * Handle successful execution
   * @private
   */
  onSuccess() {
    this.failureCount = 0;
    this.lastError = null;

    if (this.state === 'HALF_OPEN') {
      this.successCount++;
      
      if (this.successCount >= this.successThreshold) {
        this.state = 'CLOSED';
        this.successCount = 0;
        
        logger.info(`Circuit breaker ${this.name} closed after successful recovery`, {
          state: this.state,
          successThreshold: this.successThreshold
        });
      }
    }
  }

  /**
   * Handle failed execution
   * @param {Error} error - Error that occurred
   * @private
   */
  onFailure(error) {
    this.failureCount++;
    this.lastError = error.message;

    logger.warn(`Circuit breaker ${this.name} recorded failure`, {
      state: this.state,
      failureCount: this.failureCount,
      failureThreshold: this.failureThreshold,
      error: error.message
    });

    if (this.state === 'HALF_OPEN') {
      // Failed during recovery attempt, go back to OPEN
      this.state = 'OPEN';
      this.nextAttempt = Date.now() + this.timeout;
      this.successCount = 0;
      
      logger.error(`Circuit breaker ${this.name} reopened after failed recovery attempt`, {
        state: this.state,
        nextAttempt: new Date(this.nextAttempt).toISOString()
      });
    } else if (this.failureCount >= this.failureThreshold) {
      // Too many failures, open the circuit
      this.state = 'OPEN';
      this.nextAttempt = Date.now() + this.timeout;
      
      logger.error(`Circuit breaker ${this.name} opened due to failure threshold`, {
        state: this.state,
        failureCount: this.failureCount,
        failureThreshold: this.failureThreshold,
        nextAttempt: new Date(this.nextAttempt).toISOString()
      });
    }
  }

  /**
   * Get current circuit breaker state
   * @returns {Object}
   */
  getState() {
    return {
      name: this.name,
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      failureThreshold: this.failureThreshold,
      successThreshold: this.successThreshold,
      nextAttempt: this.state === 'OPEN' ? new Date(this.nextAttempt).toISOString() : null,
      lastError: this.lastError
    };
  }

  /**
   * Manually reset the circuit breaker
   */
  reset() {
    this.state = 'CLOSED';
    this.failureCount = 0;
    this.successCount = 0;
    this.nextAttempt = Date.now();
    this.lastError = null;
    
    logger.info(`Circuit breaker ${this.name} manually reset`, {
      state: this.state
    });
  }

  /**
   * Check if circuit is open
   * @returns {boolean}
   */
  isOpen() {
    return this.state === 'OPEN' && Date.now() < this.nextAttempt;
  }
}

module.exports = CircuitBreaker;
