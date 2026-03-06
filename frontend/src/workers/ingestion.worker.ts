/**
 * Ingestion Web Worker
 * Handles CSV parsing and validation off the main thread
 * for non-blocking high-volume data processing
 */

export interface IngestionPayload {
  text?: string;
  chunkSize?: number;
  file: File;
  projectId: string;
  options?: {
    delimiter?: string;
    encoding?: string;
    hasHeader?: boolean;
  };
}

export interface WorkerMessage {
  type: 'parse' | 'validate' | 'transform';
  payload: IngestionPayload;
}

export interface ParsedRow {
  [key: string]: string | number | boolean | null;
}

export interface WorkerResponse {
  type: 'progress' | 'complete' | 'error';
  data?: {
    rows: ParsedRow[];
    headers: string[];
    rowCount: number;
  };
  error?: string;
  progress?: number;
}

// Auto-detect delimiter from first line of CSV
function detectDelimiter(firstLine: string): string {
  // Count occurrences of common delimiters (outside quotes)
  const delimiters = [',', ';', '\t', '|'];
  const counts: Record<string, number> = {};
  
  let inQuotes = false;
  for (const char of firstLine) {
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (!inQuotes && delimiters.includes(char)) {
      counts[char] = (counts[char] || 0) + 1;
    }
  }
  
  // Return delimiter with highest count, default to comma
  let maxDelimiter = ',';
  let maxCount = 0;
  for (const [delim, count] of Object.entries(counts)) {
    if (count > maxCount) {
      maxCount = count;
      maxDelimiter = delim;
    }
  }
  return maxDelimiter;
}

// Robust CSV Parser with auto-delimiter detection
function parseCSV(text: string): string[][] {
  const lines = text.split(/\r?\n/);
  const result: string[][] = [];
  
  if (lines.length === 0) return result;
  
  // Auto-detect delimiter from first non-empty line
  const firstNonEmpty = lines.find(l => l.trim()) || '';
  const delimiter = detectDelimiter(firstNonEmpty);
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const fields: string[] = [];
    let currentField = '';
    let inQuotes = false;
    
    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === delimiter && !inQuotes) {
        fields.push(currentField.trim());
        currentField = '';
      } else {
        currentField += char;
      }
    }
    fields.push(currentField.trim());
    result.push(fields);
  }
  return result;
}

// Transform row to a generic object using raw headers
// ZENITH V3: No column limiting. We capture all fields even if they exceed header count.
function transformToRaw(row: string[], headers: string[]): ParsedRow {
  const data: ParsedRow = {};
  
  headers.forEach((header, index) => {
    const value = row[index]?.trim() || '';
    // Try to parse as number
    if (value && !isNaN(Number(value))) {
      data[header] = Number(value);
    } else if (value.toLowerCase() === 'true') {
      data[header] = true;
    } else if (value.toLowerCase() === 'false') {
      data[header] = false;
    } else if (value === '') {
      data[header] = null;
    } else {
      data[header] = value;
    }
  });
  
  return data;
}

self.onmessage = (event: MessageEvent<WorkerMessage>) => {
  const { type, payload } = event.data;
  
  try {
    switch (type) {
       case 'parse': {
        const { text = '', chunkSize = 500 } = payload;
        const rows = parseCSV(text);
        
        if (rows.length === 0) {
          self.postMessage({ type: 'error', error: 'No data found in file' });
          return;
        }
        
        const headers = rows[0];
        const dataRows = rows.slice(1);
        const totalRows = dataRows.length;
        const results: ParsedRow[] = [];
        
        for (let i = 0; i < dataRows.length; i += chunkSize) {
          const chunk = dataRows.slice(i, i + chunkSize);
          chunk.forEach((row, idx) => {
            const transaction = transformToRaw(row, headers);
            transaction._rowNumber = i + idx + 2;
            results.push(transaction);
          });
          
          self.postMessage({
            type: 'progress',
            progress: Math.min(100, Math.round(((i + chunk.length) / totalRows) * 100))
          });
        }
        
        self.postMessage({
          type: 'complete',
          data: {
            headers,
            transactions: results,
            stats: { totalRows, validRows: results.length, invalidRows: 0 }
          }
        });
        break;
      }
      default:
        self.postMessage({ type: 'error', error: `Unknown op: ${type}` });
    }
  } catch (error) {
    self.postMessage({
      type: 'error',
      error: error instanceof Error ? error.message : 'Worker Parse Crash'
    });
  }
};
