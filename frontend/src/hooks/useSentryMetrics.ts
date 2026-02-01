'use client';

import { useCallback } from 'react';
import * as Sentry from '@sentry/react';

interface MetricsParams {
  name: string;
  op?: string;
  tags?: Record<string, string | number | boolean>;
}

interface ApiCallOptions extends MetricsParams {
  url: string;
  method?: string;
  body?: BodyInit | null;
  headers?: Record<string, string>;
}

export function useSentryMetrics() {
  const trackApiCall = useCallback(async <T = unknown>({
    name,
    op = 'http.client',
    tags = {},
    url,
    method = 'GET',
    body = null,
    headers = {},
  }: ApiCallOptions): Promise<T> => {
    const transaction = Sentry.startInactiveSpan({
      name,
      op,
      attributes: {
        'http.method': method,
        'http.url': url,
        ...tags,
      },
    });

    const startTime = Date.now();
    const sentryTags = { ...tags, operation: op };

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        body,
      });

      const duration = Date.now() - startTime;

      transaction.setAttribute('http.status_code', response.status);
      transaction.setAttribute('http.duration', duration);

      if (!response.ok) {
        (transaction as any).setStatus({ code: 2 }); // 2 = Error
        Sentry.captureMessage(`${method} ${url} returned ${response.status}`, {
          level: 'warning',
          tags: Object.fromEntries(
            Object.entries(sentryTags).map(([k, v]) => [k, String(v)])
          ),
        });
      } else {
        (transaction as any).setStatus({ code: 1 }); // 1 = Ok
      }

      transaction.end();

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return response.json() as Promise<T>;
    } catch (error) {
      const duration = Date.now() - startTime;
      transaction.setAttribute('http.duration', duration);
      (transaction as any).setStatus({ code: 2 }); // 2 = Error
      transaction.end();

      Sentry.captureException(error, {
        tags: Object.fromEntries(
          Object.entries(sentryTags).map(([k, v]) => [k, String(v)])
        ),
        extra: {
          url,
          method,
          duration,
        },
      });

      throw error;
    }
  }, []);

  const startSpan = useCallback((params: MetricsParams) => {
    return Sentry.startInactiveSpan({
      name: params.name,
      op: params.op,
      attributes: params.tags,
    });
  }, []);

  return {
    trackApiCall,
    startSpan,
  };
}
