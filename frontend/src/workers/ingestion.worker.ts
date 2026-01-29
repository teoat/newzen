/**
 * Ingestion Web Worker
 * Handles CSV parsing and validation off the main thread
 * for non-blocking high-volume data processing
 */

export interface WorkerMessage {
  type: 'parse' | 'validate' | 'transform';
  payload: any;
}

export interface WorkerResponse {
  type: 'progress' | 'complete' | 'error';
  data?: any;
  error?: string;
  progress?: number;
}

// CSV Parser
function parseCSV(text: string): string[][] {
  const lines = text.split('\n');
  const result: string[][] = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    // Handle quoted fields with commas
    const fields: string[] = [];
    let currentField = '';
    let inQuotes = false;
    
    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
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

// Data Validator
function validateRow(row: string[], headers: string[]): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  // Check for required fields
  const requiredFields = ['date', 'description', 'amount'];
  for (const field of requiredFields) {
    const index = headers.findIndex(h => 
      h.toLowerCase().includes(field.toLowerCase())
    );
    if (index === -1) {
      errors.push(`Missing required column: ${field}`);
      continue;
    }
    if (!row[index] || row[index].trim() === '') {
      errors.push(`Empty ${field} field`);
    }
  }
  
  // Validate amount is numeric
  const amountIndex = headers.findIndex(h => 
    h.toLowerCase().includes('amount')
  );
  if (amountIndex !== -1 && row[amountIndex]) {
    const amount = row[amountIndex].replace(/[,$]/g, '');
    if (isNaN(parseFloat(amount))) {
      errors.push(`Invalid amount: ${row[amountIndex]}`);
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

// Transform row to transaction format
function transformRow(row: string[], headers: string[]): any {
  const transaction: any = {};
  
  headers.forEach((header, index) => {
    const key = header.toLowerCase().replace(/\s+/g, '_');
    let value = row[index];
    
    // Parse amount
    if (key.includes('amount') || key.includes('value')) {
      value = value.replace(/[,$]/g, '');
      transaction[key] = parseFloat(value) || 0;
    }
    // Parse date
    else if (key.includes('date')) {
      transaction[key] = new Date(value).toISOString();
    }
    // Regular field
    else {
      transaction[key] = value;
    }
  });
  
  return transaction;
}

// Main message handler
self.onmessage = (event: MessageEvent<WorkerMessage>) => {
  const { type, payload } = event.data;
  
  try {
    switch (type) {
      case 'parse': {
        const { text, chunkSize = 1000 } = payload;
        const rows = parseCSV(text);
        
        if (rows.length === 0) {
          self.postMessage({
            type: 'error',
            error: 'No data found in file'
          } as WorkerResponse);
          return;
        }
        
        const headers = rows[0];
        const dataRows = rows.slice(1);
        
        // Process in chunks to allow progress updates
        const totalRows = dataRows.length;
        let processed = 0;
        const results: any[] = [];
        const errors: any[] = [];
        
        for (let i = 0; i < dataRows.length; i += chunkSize) {
          const chunk = dataRows.slice(i, i + chunkSize);
          
          chunk.forEach((row, index) => {
            const rowNumber = i + index + 2; // +2 for header and 1-indexing
            
            // Validate
            const validation = validateRow(row, headers);
            if (!validation.valid) {
              errors.push({
                row: rowNumber,
                errors: validation.errors
              });
            } else {
              // Transform
              const transaction = transformRow(row, headers);
              transaction._rowNumber = rowNumber;
              results.push(transaction);
            }
          });
          
          processed += chunk.length;
          
          // Send progress update
          self.postMessage({
            type: 'progress',
            progress: Math.round((processed / totalRows) * 100)
          } as WorkerResponse);
        }
        
        // Send final results
        self.postMessage({
          type: 'complete',
          data: {
            headers,
            transactions: results,
            errors,
            stats: {
              totalRows: dataRows.length,
              validRows: results.length,
              invalidRows: errors.length
            }
          }
        } as WorkerResponse);
        
        break;
      }
      
      case 'validate': {
        const { rows, headers } = payload;
        const validationResults = rows.map((row: string[], index: number) => ({
          row: index + 1,
          ...validateRow(row, headers)
        }));
        
        self.postMessage({
          type: 'complete',
          data: validationResults
        } as WorkerResponse);
        
        break;
      }
      
      case 'transform': {
        const { rows, headers, mapping } = payload;
        const transformed = rows.map((row: string[]) => 
          transformRow(row, mapping || headers)
        );
        
        self.postMessage({
          type: 'complete',
          data: transformed
        } as WorkerResponse);
        
        break;
      }
      
      default:
        self.postMessage({
          type: 'error',
          error: `Unknown operation: ${type}`
        } as WorkerResponse);
    }
  } catch (error) {
    self.postMessage({
      type: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    } as WorkerResponse);
  }
};

// Export types for use in main thread
export {};
