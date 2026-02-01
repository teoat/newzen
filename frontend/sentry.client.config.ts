import { initSentry } from './src/lib/sentry';

initSentry();

export const SENTRY_CONFIG = {
  tracePropagationTargets: [
    /^\//,
    /^https:\/\/[^\/]+\.vercel\.app\//,
    process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8200',
  ],
};
