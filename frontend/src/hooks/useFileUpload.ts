import { useState } from 'react';
import { logger } from '../lib/logger';

interface FileUploadProgress {
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
  response?: Record<string, unknown>;
}

interface UploadResult {
  success: boolean;
  data?: Record<string, unknown>;
  error?: string;
}

export const useFileUpload = () => {
  const [uploads, setUploads] = useState<FileUploadProgress[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const uploadFile = async (file: File, endpoint: string): Promise<UploadResult> => {
    // Create upload entry
    const uploadProgress: FileUploadProgress = {
      file,
      progress: 0,
      status: 'pending'
    };

    setUploads(prev => [...prev, uploadProgress]);
    setIsUploading(true);

    // Simulate "real" upload time for small files to prevent UI flicker
    const startTime = Date.now();

    return new Promise((resolve) => {
      const formData = new FormData();
      formData.append('file', file);

      const xhr = new XMLHttpRequest();

      // Progress tracking
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          setUploads(prev => prev.map(upload => 
            upload.file === file 
              ? { ...upload, progress, status: 'uploading' as const }
              : upload
          ));
        }
      });

      // Completion
      xhr.addEventListener('load', () => {
        // Enforce minimum visual duration
        const duration = Date.now() - startTime;
        const minDuration = 500;
        
        setTimeout(() => {
            if (xhr.status >= 200 && xhr.status < 300) {
              try {
                const data = JSON.parse(xhr.responseText);
                setUploads(prev => prev.map(upload => 
                  upload.file === file 
                    ? { ...upload, progress: 100, status: 'success' as const, response: data }
                    : upload
                ));
                
                // Remove successful upload after delay
                setTimeout(() => {
                  setUploads(prev => prev.filter(upload => upload.file !== file));
                }, 3000);
                
                resolve({ success: true, data });
              } catch (error) {
                logger.error('Upload JSON Parse Error', { error: String(error) });
                setUploads(prev => prev.map(upload => 
                  upload.file === file 
                    ? { ...upload, status: 'error' as const, error: 'Failed to process response' }
                    : upload
                ));
                resolve({ success: false, error: 'Failed to process response' });
              }
            } else {
              setUploads(prev => prev.map(upload => 
                upload.file === file 
                  ? { ...upload, status: 'error' as const, error: `Upload failed with status ${xhr.status}` }
                  : upload
              ));
              resolve({ success: false, error: `Upload failed with status ${xhr.status}` });
            }
            // Only set isUploading to false if no other uploads are pending/uploading
            setUploads(current => {
                const pending = current.filter(u => u.file !== file && (u.status === 'pending' || u.status === 'uploading'));
                if (pending.length === 0) setIsUploading(false);
                return current;
            });
        }, Math.max(0, minDuration - duration));
      });

      // Error handling
      xhr.addEventListener('error', () => {
        setUploads(prev => prev.map(upload => 
          upload.file === file 
            ? { ...upload, status: 'error' as const, error: 'Network error occurred' }
            : upload
        ));
        resolve({ success: false, error: 'Network error occurred' });
        setIsUploading(false);
      });

      xhr.open('POST', endpoint);
      // Add Authorization if needed (assuming token is in cookie or accessible via auth mechanism)
      // For now, we rely on browser cookies if using same-origin or credentials
      xhr.withCredentials = true; 
      xhr.send(formData);
    });
  };

  const clearUploads = () => {
    setUploads([]);
    setIsUploading(false);
  };

  return { uploads, isUploading, uploadFile, clearUploads };
};