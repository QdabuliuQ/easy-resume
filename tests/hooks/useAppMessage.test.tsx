import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

const message = {
  success: vi.fn(),
  error: vi.fn(),
  warning: vi.fn(),
};

vi.mock('antd', () => ({
  App: {
    useApp: () => ({ message }),
  },
}));

import { useAppMessage } from '@/hooks/useAppMessage';

describe('useAppMessage', () => {
  it('returns message api from antd App context', () => {
    const { result } = renderHook(() => useAppMessage());
    expect(result.current).toBe(message);
  });
});
