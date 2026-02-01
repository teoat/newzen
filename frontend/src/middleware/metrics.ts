import { NextRequest, NextResponse } from 'next/server';
import { httpRequestDuration, httpRequestTotal, apiLatency } from '../lib/prometheus';

interface MetricsRequest extends NextRequest {
  metrics?: {
    startTime: number;
    method: string;
    route: string;
  };
}

function trackApiMetrics(
  req: MetricsRequest,
  response: NextResponse,
  duration: number
): void {
  const method = req.method || 'GET';
  const route = req.nextUrl?.pathname || '/';
  const statusCode = response.status || 200;

  const durationSeconds = duration / 1000;

  httpRequestDuration.observe({ method, route, status_code: statusCode }, durationSeconds);
  httpRequestTotal.inc({ method, route, status_code: statusCode });

  const labels = {
    endpoint: route,
    method,
    status: statusCode.toString()
  };
  apiLatency.observe(labels, durationSeconds);
}

function withMetrics(handler: (req: MetricsRequest) => Promise<NextResponse>): (req: MetricsRequest) => Promise<NextResponse> {
  return async (req: MetricsRequest): Promise<NextResponse> => {
    const startTime = Date.now();
    const method = req.method || 'GET';
    const route = req.nextUrl?.pathname || '/';

    try {
      const response = await handler(req);
      const duration = Date.now() - startTime;
      const statusCode = response.status || 200;

      const durationSeconds = duration / 1000;
      httpRequestDuration.observe({ method, route, status_code: statusCode }, durationSeconds);
      httpRequestTotal.inc({ method, route, status_code: statusCode });

      apiLatency.observe({ endpoint: route, method, status: statusCode.toString() }, durationSeconds);

      return response;
    } catch (error) {
      const duration = Date.now() - startTime;
      const durationSeconds = duration / 1000;
      const statusCode = 500;

      httpRequestDuration.observe({ method, route, status_code: statusCode }, durationSeconds);
      httpRequestTotal.inc({ method, route, status_code: statusCode });

      apiLatency.observe({ endpoint: route, method, status: statusCode.toString() }, durationSeconds);

      throw error;
    }
  };
}

export { trackApiMetrics, withMetrics, type MetricsRequest };
