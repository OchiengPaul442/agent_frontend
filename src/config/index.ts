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
  analytics: {
    googleAnalyticsId: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID,
  },
  theme: {
    primary: {
      50: '#fffbeb', // Warm amber palette
      100: '#fef3c7',
      200: '#fde68a',
      300: '#fcd34d',
      400: '#fbbf24',
      500: '#f59e0b', // Primary color - Warm amber
      600: '#d97706',
      700: '#b45309',
      800: '#92400e',
      900: '#78350f',
      950: '#451a03',
    },
    secondary: {
      50: '#f8fafc',
      100: '#f1f5f9',
      200: '#e2e8f0',
      300: '#cbd5e1',
      400: '#94a3b8',
      500: '#64748b',
      600: '#475569',
      700: '#334155',
      800: '#1e293b',
      900: '#0f172a',
      950: '#020617',
    },
    surface: {
      light: '#ffffff',
      dark: '#0f172a',
    },
  },
} as const;

export type Config = typeof config;
