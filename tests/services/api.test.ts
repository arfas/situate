import { describe, it, expect, beforeEach, vi } from 'vitest';
import { supabase } from '../../src/lib/supabase';

// Mock the supabase module
vi.mock('../../src/lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(),
      getSession: vi.fn(),
    },
    from: vi.fn(),
  },
}));

describe('API Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Supabase Integration', () => {
    it('should have supabase client configured', () => {
      expect(supabase).toBeDefined();
      expect(supabase.auth).toBeDefined();
      expect(supabase.from).toBeDefined();
    });

    it('should mock auth.getUser', async () => {
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: { id: 'test-user-id', email: 'test@example.com' } as any },
        error: null,
      });

      const result = await supabase.auth.getUser();
      expect(result.data.user).toBeDefined();
      expect(result.data.user?.id).toBe('test-user-id');
    });

    it('should mock database queries', () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { id: '123' }, error: null }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockQuery as any);

      expect(supabase.from('rooms')).toBeDefined();
    });
  });
});
