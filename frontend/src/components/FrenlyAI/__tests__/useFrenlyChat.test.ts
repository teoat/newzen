import { vi, describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useFrenlyChat } from '../useFrenlyWidget';
import { authenticatedFetch } from '../../../lib/api';
import { useFileUpload } from '../../../hooks/useFileUpload';

// Mock dependencies
vi.mock('../../../lib/api', () => ({
  authenticatedFetch: vi.fn(),
}));

vi.mock('../../../hooks/useFileUpload', () => ({
  useFileUpload: vi.fn(() => ({
    uploads: [],
    uploadFile: vi.fn(),
  })),
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

  it('should initialize with a welcome message', () => {
    const { result } = renderHook(() => useFrenlyChat());
    expect(result.current.messages).toHaveLength(1);
    expect(result.current.messages[0].role).toBe('ai');
  });

  it('should add user message and fetch AI response', async () => {
    const mockResponse = {
      response: 'Hello investigator!',
      sql: 'SELECT * FROM test',
      data: [],
      suggested_actions: []
    };

    (authenticatedFetch as any).mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    });

    const { result } = renderHook(() => useFrenlyChat());

    act(() => {
      result.current.setInput('Hello AI');
    });

    await act(async () => {
      await result.current.handleSend();
    });

    expect(result.current.messages).toHaveLength(3);
    expect(result.current.messages[1].text).toBe('Hello AI');
    expect(result.current.messages[2].text).toBe('Hello investigator!');
    expect(result.current.messages[2].sql).toBe('SELECT * FROM test');
  });

  it('should handle file upload and send to AI', async () => {
    const mockUploadFile = vi.fn().mockResolvedValue({
        success: true,
        data: { file_url: 'http://example.com/file.pdf' }
    });
    
    (useFileUpload as any).mockReturnValue({
        uploads: [],
        uploadFile: mockUploadFile,
    });

    (authenticatedFetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ response: 'Analyzed document' }),
    });

    const { result } = renderHook(() => useFrenlyChat());

    const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
    
    act(() => {
      result.current.handleFileSelect([file]);
    });

    await act(async () => {
      await result.current.handleSend();
    });

    expect(mockUploadFile).toHaveBeenCalled();
    expect(authenticatedFetch).toHaveBeenCalledWith(
        '/api/v1/ai/assist',
        expect.objectContaining({
            body: expect.any(FormData)
        })
    );
    expect(result.current.messages[result.current.messages.length - 1].text).toBe('Analyzed document');
  });

  it('should handle errors gracefully', async () => {
    (authenticatedFetch as any).mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useFrenlyChat());

    act(() => {
      result.current.setInput('Broken query');
    });

    await act(async () => {
      await result.current.handleSend();
    });

    expect(result.current.messages[result.current.messages.length - 1].text).toContain('error processing your request');
    expect(result.current.isLoading).toBe(false);
  });
});
