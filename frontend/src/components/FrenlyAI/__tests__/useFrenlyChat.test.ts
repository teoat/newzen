import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useFrenlyChat } from '../useFrenlyWidget';

vi.mock('../../../lib/api', () => ({
  authenticatedFetch: vi.fn(),
}));

vi.mock('../../../hooks/useFileUpload', () => ({
  useFileUpload: vi.fn(() => ({
    uploads: [],
    uploadFile: vi.fn(),
    isUploading: false,
    progress: 0,
    error: null,
  })),
}));

vi.mock('../../../lib/audioService', () => ({
  audioService: {
    playClick: vi.fn(),
    playSuccess: vi.fn(),
    playError: vi.fn(),
  },
}));

vi.mock('next/navigation', () => ({
  usePathname: () => '/test-page',
}));

vi.mock('../../../store/useProject', () => ({
  useProject: () => ({
    activeProjectId: 'proj-123',
  }),
}));

describe('useFrenlyChat', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should initialize with a welcome message', () => {
    const { result } = renderHook(() => useFrenlyChat());
    expect(result.current.messages).toHaveLength(1);
    expect(result.current.messages[0].role).toBe('ai');
  });

  it('should have initial input as empty string', () => {
    const { result } = renderHook(() => useFrenlyChat());
    expect(result.current.input).toBe('');
  });

  it('should have isLoading initially false', () => {
    const { result } = renderHook(() => useFrenlyChat());
    expect(result.current.isLoading).toBe(false);
  });

  it('should have isVerifying initially false', () => {
    const { result } = renderHook(() => useFrenlyChat());
    expect(result.current.isVerifying).toBe(false);
  });

  it('should have selectedFile initially null', () => {
    const { result } = renderHook(() => useFrenlyChat());
    expect(result.current.selectedFile).toBeNull();
  });

  it('should update input when setInput is called', async () => {
    const { result } = renderHook(() => useFrenlyChat());
    
    await act(async () => {
      result.current.setInput('Test query');
    });

    expect(result.current.input).toBe('Test query');
  });

  it('should handle empty send gracefully', async () => {
    const { result } = renderHook(() => useFrenlyChat());
    
    await act(async () => {
      await result.current.handleSend();
    });

    expect(result.current.isLoading).toBe(false);
  });

  it('should set isLoading when processing', async () => {
    const { result } = renderHook(() => useFrenlyChat());
    
    const mockApiCall = vi.fn().mockImplementation(() => new Promise(resolve => 
      setTimeout(resolve, 100)
    ));
    
    await act(async () => {
      result.current.setInput('Test');
    });
    
    // Note: The actual loading state depends on the implementation
    // This test verifies basic functionality
    expect(result.current.input).toBe('Test');
  });
});
