import { describe, it, expect } from 'vitest';

describe('VITE_POS_V2_URL env', () => {
  it('should be set and contain a URL', () => {
    const url = process.env.VITE_POS_V2_URL;
    expect(url).toBeDefined();
    expect(url).toMatch(/^https?:\/\//);
  });
});
