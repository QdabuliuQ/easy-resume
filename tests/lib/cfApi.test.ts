import { describe, expect, it } from 'vitest';
import { cfApiBase, cfApiHeaders, cfApiSecret } from '@/lib/cfApi';

describe('cfApi', () => {
  it('reads base and secret from env', () => {
    process.env.CF_API_BASE_URL = 'https://cf.example/';
    process.env.CF_API_SECRET = 's1';
    expect(cfApiBase()).toBe('https://cf.example');
    expect(cfApiSecret()).toBe('s1');
    expect(cfApiHeaders({ 'Content-Type': 'application/json' })).toEqual({
      'Content-Type': 'application/json',
      'X-CF-Key': 's1',
    });
    delete process.env.CF_API_BASE_URL;
    delete process.env.CF_API_SECRET;
  });

  it('falls back to ADMIN_SECRET', () => {
    delete process.env.CF_API_SECRET;
    process.env.ADMIN_SECRET = 'admin';
    expect(cfApiSecret()).toBe('admin');
    delete process.env.ADMIN_SECRET;
  });
});
