import { NextResponse } from 'next/server';

/**
 * Kubernetes Health Check Endpoint
 * Returns 200 OK when the frontend runner is active.
 */
export async function GET() {
  return NextResponse.json(
    { 
      status: 'healthy', 
      service: 'Zenith Frontend',
      timestamp: new Date().toISOString() 
    },
    { status: 200 }
  );
}
