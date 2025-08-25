import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  prefix: '',
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      colors: {
        // Colores del sistema original (migrados de CustomTkinter)
        comedor: {
          primary: '#1f2937',    // bg principal oscuro
          secondary: '#374151',  // bg secundario
          accent: '#3b82f6',     // azul acento
          success: '#10b981',    // verde éxito
          error: '#ef4444',      // rojo error
          warning: '#f59e0b',    // amarillo warning
          info: '#3b82f6',       // azul info
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        // Animaciones para el kiosco
        'scan-line': {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(200vh)' },
        },
        'pulse-success': {
          '0%, 100%': { backgroundColor: 'rgb(34, 197, 94)' },
          '50%': { backgroundColor: 'rgb(74, 222, 128)' },
        },
        'pulse-error': {
          '0%, 100%': { backgroundColor: 'rgb(239, 68, 68)' },
          '50%': { backgroundColor: 'rgb(248, 113, 113)' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'scan-line': 'scan-line 2s linear infinite',
        'pulse-success': 'pulse-success 1s ease-in-out infinite',
        'pulse-error': 'pulse-error 1s ease-in-out infinite',
      },
      // Responsive específico para kiosco
      screens: {
        'kiosco': '1366px',
        'kiosco-xl': '1920px',
        'kiosco-4k': '3840px',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
} satisfies Config

export default config