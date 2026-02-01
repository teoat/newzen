import js from '@eslint/js';
import globals from 'globals';
import react from 'eslint-plugin-react';
import next from 'eslint-config-next';

const config = [
  {
    ignores: [
      '.next/**',
      'out/**',
      'build/**',
      'next-env.d.ts',
      'node_modules/**',
    ],
  },
  ...next,
  {
    rules: {
      // Prevent importing from .v2.ts files to avoid API version drift
      'no-restricted-imports': ['error', {
        patterns: [
          {
            group: ['*.v2', '**/*.v2', '*.v2.ts', '**/*.v2.ts'],
            message: 'Importing from .v2.ts files is prohibited. Use standardized API v1 interfaces instead.',
          },
        ],
      }],
      // FORENSIC PROTOCOL: No console logs of transaction or entity data
      'no-console': ['warn', { allow: ['error', 'warn', 'debug'] }],
      'react/no-unescaped-entities': 'error',
      'react-hooks/exhaustive-deps': 'error',
    },
  },
];

export default config;
