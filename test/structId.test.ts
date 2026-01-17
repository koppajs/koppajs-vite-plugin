
import { describe, it, expect } from 'vitest';
import { createStructIdFactory, normalizeStructSeed } from '../src/utils/structId';

describe('createStructIdFactory', () => {
  it('produces deterministic ids for a given seed', () => {
    const factory = createStructIdFactory('abc');
    expect(factory()).toMatch(/^s[a-z0-9]+-1$/);
    expect(factory()).toMatch(/^s[a-z0-9]+-2$/);
    expect(factory()).not.toBe(factory());
  });

  it('different seeds produce different prefixes', () => {
    const f1 = createStructIdFactory('foo');
    const f2 = createStructIdFactory('bar');
    expect(f1().split('-')[0]).not.toBe(f2().split('-')[0]);
  });

  it('ids are stable for same seed', () => {
    const f1 = createStructIdFactory('seed');
    const f2 = createStructIdFactory('seed');
    expect(f1()).toBe(f2());
    expect(f1()).toBe(f2());
  });
});

describe('normalizeStructSeed', () => {
  it('produces a stable string for same input', () => {
    const s1 = normalizeStructSeed('/foo/bar', '<div>hi</div>');
    const s2 = normalizeStructSeed('/foo/bar', '<div>hi</div>');
    expect(s1).toBe(s2);
  });

  it('different paths or templates yield different seeds', () => {
    const s1 = normalizeStructSeed('/foo/bar', '<div>hi</div>');
    const s2 = normalizeStructSeed('/foo/baz', '<div>hi</div>');
    const s3 = normalizeStructSeed('/foo/bar', '<div>bye</div>');
    expect(s1).not.toBe(s2);
    expect(s1).not.toBe(s3);
  });

  it('is fast for large templates', () => {
    const t = '<div>' + 'x'.repeat(10000) + '</div>';
    const s = normalizeStructSeed('/foo/bar', t);
    expect(typeof s).toBe('string');
    expect(s.length).toBeGreaterThan(0);
  });
});
