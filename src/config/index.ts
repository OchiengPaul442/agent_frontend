export const config = {
  app: {
    name: process.env.NEXT_PUBLIC_APP_NAME || 'Air Quality AI Agent',
    description:
      process.env.NEXT_PUBLIC_APP_DESCRIPTION ||
      'Real-time air quality monitoring and AI-powered insights',
  },
  api: {
    baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000',
    version: 'v1',
  },
  theme: {
    primary: {
      50: '#fef2f2',
      100: '#fee2e2',
      200: '#fecaca',
      300: '#fca5a5',
      400: '#f87171',
      500: '#ef4444', // Primary color - Red
      600: '#dc2626',
      700: '#b91c1c',
      800: '#991b1b',
      900: '#7f1d1d',
      950: '#450a0a',
    },
    surface: {
      light: '#ffffff',
      dark: '#0f172a',
    },
  },
} as const;

export type Config = typeof config;
