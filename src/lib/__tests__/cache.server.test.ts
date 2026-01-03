/**
 * Unit tests for cache.server.ts
 * Tests caching functionality
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { CacheTTL, cache, getOrCompute } from '../cache.server'

describe('cache.server.ts', () => {
  beforeEach(() => {
    cache.clear()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('SimpleCache.get/set', () => {
    it('should store and retrieve values', () => {
      cache.set('key1', 'value1', 60000)

      expect(cache.get('key1')).toBe('value1')
    })

    it('should return null for non-existent keys', () => {
      expect(cache.get('nonexistent')).toBeNull()
    })

    it('should expire values after TTL', () => {
      cache.set('key1', 'value1', 1000)

      expect(cache.get('key1')).toBe('value1')

      vi.advanceTimersByTime(1001)

      expect(cache.get('key1')).toBeNull()
    })

    it('should handle different data types', () => {
      cache.set('string', 'hello', 60000)
      cache.set('number', 42, 60000)
      cache.set('boolean', true, 60000)
      cache.set('object', { foo: 'bar' }, 60000)
      cache.set('array', [1, 2, 3], 60000)

      expect(cache.get('string')).toBe('hello')
      expect(cache.get('number')).toBe(42)
      expect(cache.get('boolean')).toBe(true)
      expect(cache.get('object')).toEqual({ foo: 'bar' })
      expect(cache.get('array')).toEqual([1, 2, 3])
    })

    it('should handle null and undefined values', () => {
      cache.set('null', null, 60000)
      cache.set('undefined', undefined, 60000)

      expect(cache.get('null')).toBeNull()
      expect(cache.get('undefined')).toBeUndefined()
    })

    it('should overwrite existing keys', () => {
      cache.set('key1', 'value1', 60000)
      cache.set('key1', 'value2', 60000)

      expect(cache.get('key1')).toBe('value2')
    })
  })

  describe('SimpleCache.has', () => {
    it('should return true for existing keys', () => {
      cache.set('key1', 'value1', 60000)

      expect(cache.has('key1')).toBe(true)
    })

    it('should return false for non-existent keys', () => {
      expect(cache.has('nonexistent')).toBe(false)
    })

    it('should return false for expired keys', () => {
      cache.set('key1', 'value1', 1000)

      expect(cache.has('key1')).toBe(true)

      vi.advanceTimersByTime(1001)

      expect(cache.has('key1')).toBe(false)
    })
  })

  describe('SimpleCache.delete', () => {
    it('should remove specific key', () => {
      cache.set('key1', 'value1', 60000)
      cache.set('key2', 'value2', 60000)

      cache.delete('key1')

      expect(cache.get('key1')).toBeNull()
      expect(cache.get('key2')).toBe('value2')
    })

    it('should handle deleting non-existent keys', () => {
      expect(() => cache.delete('nonexistent')).not.toThrow()
    })
  })

  describe('SimpleCache.invalidate', () => {
    it('should remove keys matching pattern', () => {
      cache.set('user:1:profile', 'data1', 60000)
      cache.set('user:1:settings', 'data2', 60000)
      cache.set('user:2:profile', 'data3', 60000)
      cache.set('team:1:members', 'data4', 60000)

      cache.invalidate('user:1')

      expect(cache.get('user:1:profile')).toBeNull()
      expect(cache.get('user:1:settings')).toBeNull()
      expect(cache.get('user:2:profile')).toBe('data3')
      expect(cache.get('team:1:members')).toBe('data4')
    })

    it('should not affect non-matching keys', () => {
      cache.set('key1', 'value1', 60000)
      cache.set('key2', 'value2', 60000)
      cache.set('other', 'value3', 60000)

      cache.invalidate('key')

      expect(cache.get('key1')).toBeNull()
      expect(cache.get('key2')).toBeNull()
      expect(cache.get('other')).toBe('value3')
    })

    it('should handle pattern with no matches', () => {
      cache.set('key1', 'value1', 60000)

      expect(() => cache.invalidate('nomatch')).not.toThrow()
      expect(cache.get('key1')).toBe('value1')
    })
  })

  describe('SimpleCache.clear', () => {
    it('should remove all entries', () => {
      cache.set('key1', 'value1', 60000)
      cache.set('key2', 'value2', 60000)
      cache.set('key3', 'value3', 60000)

      cache.clear()

      expect(cache.get('key1')).toBeNull()
      expect(cache.get('key2')).toBeNull()
      expect(cache.get('key3')).toBeNull()
    })

    it('should allow new entries after clear', () => {
      cache.set('key1', 'value1', 60000)
      cache.clear()
      cache.set('key2', 'value2', 60000)

      expect(cache.get('key2')).toBe('value2')
    })
  })

  describe('SimpleCache.getStats', () => {
    it('should return cache statistics', () => {
      cache.set('key1', 'value1', 60000)
      cache.set('key2', 'value2', 60000)

      const stats = cache.getStats()

      expect(stats.size).toBe(2)
      expect(stats.keys).toContain('key1')
      expect(stats.keys).toContain('key2')
    })

    it('should reflect current cache state', () => {
      cache.set('key1', 'value1', 60000)
      expect(cache.getStats().size).toBe(1)

      cache.set('key2', 'value2', 60000)
      expect(cache.getStats().size).toBe(2)

      cache.delete('key1')
      expect(cache.getStats().size).toBe(1)
    })
  })

  describe('SimpleCache.periodicCleanup', () => {
    it('should remove expired entries', () => {
      cache.set('key1', 'value1', 1000)
      cache.set('key2', 'value2', 60000)

      vi.advanceTimersByTime(1001)

      // Trigger cleanup by accessing cache
      cache.get('key2')

      const stats = cache.getStats()
      expect(stats.size).toBe(1)
      expect(stats.keys).toContain('key2')
    })

    it('should not run too frequently', () => {
      cache.set('key1', 'value1', 60000)

      // Multiple gets should not trigger multiple cleanups
      cache.get('key1')
      cache.get('key1')
      cache.get('key1')

      // Should still work normally
      expect(cache.get('key1')).toBe('value1')
    })
  })

  describe('getOrCompute', () => {
    it('should return cached value if exists', async () => {
      cache.set('key1', 'cached', 60000)

      const compute = vi.fn().mockResolvedValue('computed')
      const result = await getOrCompute('key1', 60000, compute)

      expect(result).toBe('cached')
      expect(compute).not.toHaveBeenCalled()
    })

    it('should compute and cache if not exists', async () => {
      const compute = vi.fn().mockResolvedValue('computed')
      const result = await getOrCompute('key1', 60000, compute)

      expect(result).toBe('computed')
      expect(compute).toHaveBeenCalled()
      expect(cache.get('key1')).toBe('computed')
    })

    it('should handle async compute functions', async () => {
      const compute = vi.fn().mockImplementation(async () => {
        await new Promise((resolve) => setTimeout(resolve, 100))
        return 'async result'
      })

      const result = await getOrCompute('key1', 60000, compute)

      expect(result).toBe('async result')
      expect(cache.get('key1')).toBe('async result')
    })

    it('should handle compute errors', async () => {
      const compute = vi.fn().mockRejectedValue(new Error('Compute failed'))

      await expect(getOrCompute('key1', 60000, compute)).rejects.toThrow(
        'Compute failed',
      )
      expect(cache.get('key1')).toBeNull()
    })

    it('should cache computed value with correct TTL', async () => {
      const compute = vi.fn().mockResolvedValue('computed')

      await getOrCompute('key1', 1000, compute)

      expect(cache.get('key1')).toBe('computed')

      vi.advanceTimersByTime(1001)

      expect(cache.get('key1')).toBeNull()
    })
  })

  describe('CacheTTL presets', () => {
    it('should have REALTIME preset (30 seconds)', () => {
      expect(CacheTTL.REALTIME).toBe(30000)
    })

    it('should have SHORT preset (1 minute)', () => {
      expect(CacheTTL.SHORT).toBe(60000)
    })

    it('should have MEDIUM preset (5 minutes)', () => {
      expect(CacheTTL.MEDIUM).toBe(300000)
    })

    it('should have LONG preset (15 minutes)', () => {
      expect(CacheTTL.LONG).toBe(900000)
    })

    it('should have VERY_LONG preset (1 hour)', () => {
      expect(CacheTTL.VERY_LONG).toBe(3600000)
    })
  })

  describe('Edge cases', () => {
    it('should handle very large values', () => {
      const largeArray = new Array(10000).fill('data')
      cache.set('large', largeArray, 60000)

      expect(cache.get('large')).toEqual(largeArray)
    })

    it('should handle many keys', () => {
      for (let i = 0; i < 1000; i++) {
        cache.set(`key${i}`, `value${i}`, 60000)
      }

      expect(cache.getStats().size).toBe(1000)
      expect(cache.get('key500')).toBe('value500')
    })

    it('should handle rapid expiration', () => {
      for (let i = 0; i < 100; i++) {
        cache.set(`key${i}`, `value${i}`, 100)
      }

      vi.advanceTimersByTime(101)

      for (let i = 0; i < 100; i++) {
        expect(cache.get(`key${i}`)).toBeNull()
      }
    })
  })
})
