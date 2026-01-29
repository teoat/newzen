# CSV Web Worker Integration Guide

## Overview

The CSV Web Worker has been implemented to prevent UI blocking during large file parsing operations in the Ingestion page.

## Files Created

- `frontend/src/workers/csvParser.worker.ts` - Web Worker implementation
- `frontend/src/hooks/useCSVWorker.ts` - React hook for worker management

## Integration Example

### Before (Main Thread Blocking)

```tsx
Papa.parse(file, {
    header: true,
    complete: (results) => {
        setPreviewData(results.data);
    }
});
```

### After (Web Worker - Non-Blocking)

```tsx
import { useCSVWorker } from '@/hooks/useCSVWorker';

const { parseCSV, terminate } = useCSVWorker();

// Parse file
parseCSV(
    file,
    true, // preview mode
    (result) => {
        setPreviewData(result.data);
        setHeaders(result.meta.fields || []);
    },
    (error) => {
        console.error('Parse failed:', error);
    }
);

// Cleanup on unmount
useEffect(() => {
    return () => terminate();
}, [terminate]);
```

## Benefits

1. **Non-Blocking UI**: Large CSV files (>10MB) no longer freeze the interface
2. **Better UX**: Users can interact with other parts of the app during parsing
3. **Performance**: Parallel processing capability for multiple files
4. **Graceful Degradation**: Falls back to main thread if Worker fails

## Usage in IngestionPage

To integrate into the existing ingestion flow:

1. Import the hook:

```tsx
import { useCSVWorker } from '@/hooks/useCSVWorker';
```

1. Replace the existing `Papa.parse` calls in the `handleFileDrop` function

2. Add cleanup in the component's useEffect cleanup function

## Performance Metrics (Expected)

- **Small files (<1MB)**: Negligible difference
- **Medium files (1-10MB)**: ~30% improvement in perceived performance
- **Large files (>10MB)**: ~80% improvement, UI remains responsive

## Browser Compatibility

- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Full support (15+)
- Fallback: Main thread parsing if Worker creation fails
