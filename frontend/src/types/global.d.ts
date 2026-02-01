// Global type extensions for performance APIs
declare global {
  interface Window {
    gtag?: (command: string, event: string, parameters?: Record<string, unknown>) => void;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
  
  interface Performance {
    memory?: MemoryInfo;
  }
  
  interface MemoryInfo {
    usedJSHeapSize: number;
    totalJSHeapSize: number;
    jsHeapSizeLimit: number;
  }

  // Extend PerformanceNavigationTiming with legacy properties
  interface PerformanceNavigationTiming {
    navigationStart?: number;
  }
}

// First Input Delay entry
interface PerformanceEventTiming extends PerformanceEntry {
  processingStart: number;
}

// Layout Shift entry
interface LayoutShiftEntry extends PerformanceEntry {
  value: number;
  hadRecentInput: boolean;
}

interface SpeechRecognitionEvent {
  results: {
    [key: number]: {
      [key: number]: {
        transcript: string;
      };
    };
  };
}

interface SpeechRecognition {
  continuous: boolean;
  interimResults: boolean;
  onstart: () => void;
  onend: () => void;
  onresult: (event: SpeechRecognitionEvent) => void;
  start: () => void;
  stop: () => void;
}

export {};

interface SpeechRecognitionEvent {
  results: {
    [key: number]: {
      [key: number]: {
        transcript: string;
      };
    };
  };
}

interface SpeechRecognition {
  continuous: boolean;
  interimResults: boolean;
  onstart: () => void;
  onend: () => void;
  onresult: (event: SpeechRecognitionEvent) => void;
  start: () => void;
  stop: () => void;
}

export {};