import debounce from 'lodash.debounce';

/**
 * A Least Recently Used (LRU) Cache implementation for optimizing search operations.
 */
export class LRUCache<T> {
  private readonly capacity: number;
  private readonly cache = new Map<string, T>();

  constructor(capacity: number = 100) {
    this.capacity = capacity;
  }

  get(key: string): T | undefined {
    const value = this.cache.get(key);
    if (value !== undefined) {
      // Move to the end to mark as recently used
      this.cache.delete(key);
      this.cache.set(key, value);
    }
    return value;
  }

  set(key: string, value: T): void {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.capacity) {
      // Remove the least recently used item (first item)
      const firstItem = this.cache.keys().next();
      if (!firstItem.done) {
        this.cache.delete(firstItem.value);
      }
    }
    this.cache.set(key, value);
  }

  clear(): void {
    this.cache.clear();
  }
}

/**
 * Creates a debounced version of a function.
 * @param func The function to debounce
 * @param delay The delay in milliseconds
 * @param options Optional configuration for the debounce behavior
 */
export function createDebouncedFunction<T extends (...args: any[]) => any>(
  func: T,
  delay: number,
  options?: { leading?: boolean; trailing?: boolean }
): (...args: Parameters<T>) => ReturnType<T> {
  const debouncedFn = debounce(func, delay, { leading: true, trailing: false, ...options });
  return function (...args: Parameters<T>): ReturnType<T> {
    const result = debouncedFn(...args);
    return result as ReturnType<T>;
  };
}

/**
 * A simple throttle implementation to limit the rate at which a function can fire.
 * @param func The function to throttle
 * @param limit The time limit in milliseconds
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => ReturnType<T> {
  let inThrottle = false;
  let lastResult: ReturnType<T>;

  return (...args: Parameters<T>): ReturnType<T> => {
    if (!inThrottle) {
      lastResult = func.apply(undefined, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
    return lastResult;
  };
}

/**
 * A memoization utility that caches function results.
 * @param fn The function to memoize
 * @param getKey Optional function to generate cache keys
 */
export function memoize<T extends (...args: any[]) => any>(
  fn: T,
  getKey?: (...args: Parameters<T>) => string
): T {
  const cache = new Map<string, ReturnType<T>>();
  
  return ((...args: Parameters<T>): ReturnType<T> => {
    const key = getKey ? getKey(...args) : JSON.stringify(args);
    
    if (cache.has(key)) {
      return cache.get(key)!;
    }
    
    const result = fn(...args);
    cache.set(key, result);
    return result;
  }) as T;
}

/**
 * Formats a number of seconds into a MM:SS display string.
 * @param seconds The number of seconds to format
 * @returns A string in MM:SS format
 */
export const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

/**
 * Implements exponential backoff strategy for retries.
 * @param attempt The current attempt number
 * @param baseDelay The base delay in milliseconds
 * @returns The calculated delay for the current attempt in milliseconds, capped at 30 seconds
 */
export const exponentialBackoff = (attempt: number, baseDelay: number = 1000): number => {
  return Math.min(baseDelay * Math.pow(2, attempt), 30000);
};