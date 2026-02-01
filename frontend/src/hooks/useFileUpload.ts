import { useState } from 'react';

interface FileUploadProgress {
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
}

export const useFileUpload = () => {
  const [uploads, setUploads] = useState<FileUploadProgress[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const uploadFile = async (file: File, endpoint: string): Promise<{ success: boolean; data?: any; error?: string }> => {
    // Create upload entry
    const uploadId = Math.random().toString(36).substr(2, 9);
    const uploadProgress: FileUploadProgress = {
      file,
      progress: 0,
      status: 'pending'
    };

    setUploads(prev => [...prev, uploadProgress]);
    setIsUploading(true);

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
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const data = JSON.parse(xhr.responseText);
            setUploads(prev => prev.map(upload => 
              upload.file === file 
                ? { ...upload, progress: 100, status: 'success' as const }
                : upload
            ));
            
            // Remove successful upload after delay
            setTimeout(() => {
              setUploads(prev => prev.filter(upload => upload.file !== file));
            }, 2000);
            
            resolve({ success: true, data });
          } catch (error) {
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
        setIsUploading(false);
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
      xhr.send(formData);
    });
  };

  const clearUploads = () => {
    setUploads([]);
    setIsUploading(false);
  };

  return { uploads, isUploading, uploadFile, clearUploads };
};