/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Primary Colors
        'primary': '#6366F1', // Cosmic purple (indigo-500)
        'secondary': '#8B5CF6', // Complementary violet (violet-500)
        'accent': '#F59E0B', // Warm amber (amber-500)
        
        // Background Colors
        'background': '#0F0F23', // Deep space navy (slate-900)
        'surface': '#1E1B4B', // Translucent panel base (indigo-900)
        
        // Text Colors
        'text-primary': '#F8FAFC', // Near-white (slate-50)
        'text-secondary': '#CBD5E1', // Muted silver (slate-300)
        
        // Status Colors
        'success': '#10B981', // Ethereal green (emerald-500)
        'warning': '#F59E0B', // Warm amber (amber-500)
        'error': '#EF4444', // Vibrant red (red-500)
        
        // Glassmorphism Colors
        'glass-primary': 'rgba(99, 102, 241, 0.2)', // Primary with 20% opacity
        'glass-surface': 'rgba(30, 27, 75, 0.6)', // Surface with 60% opacity
        'glass-border': 'rgba(255, 255, 255, 0.1)', // White with 10% opacity
        'glass-highlight': 'rgba(255, 255, 255, 0.05)', // White with 5% opacity
      },
      fontFamily: {
        'heading': ['Inter', 'sans-serif'], // Modern geometric sans-serif (inter)
        'body': ['Inter', 'sans-serif'], // Consistent with headings (inter)
        'caption': ['Inter', 'sans-serif'], // Visual consistency (inter)
        'data': ['JetBrains Mono', 'monospace'], // Monospace alignment (jetbrains-mono)
      },
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],
        'base': ['1rem', { lineHeight: '1.5rem' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
        '5xl': ['3rem', { lineHeight: '1' }],
        '6xl': ['3.75rem', { lineHeight: '1' }],
      },
      borderRadius: {
        'xl': '16px', // Panel radius
        '2xl': '24px', // Message bubble radius
      },
      backdropBlur: {
        'md': '12px',
        'lg': '16px',
        'xl': '20px',
      },
      animation: {
        'drift': 'drift 15s infinite linear',
        'float': 'float 20s infinite ease-in-out',
        'fade-in': 'fadeIn 300ms cubic-bezier(0.4, 0, 0.2, 1)',
        'slide-up': 'slideUp 300ms cubic-bezier(0.4, 0, 0.2, 1)',
      },
      keyframes: {
        drift: {
          '0%': {
            transform: 'translateX(-100vw) rotate(0deg)',
          },
          '100%': {
            transform: 'translateX(100vw) rotate(360deg)',
          },
        },
        float: {
          '0%, 100%': {
            transform: 'translateY(0px) scale(1)',
          },
          '50%': {
            transform: 'translateY(-20px) scale(1.05)',
          },
        },
        fadeIn: {
          '0%': {
            opacity: '0',
          },
          '100%': {
            opacity: '1',
          },
        },
        slideUp: {
          '0%': {
            opacity: '0',
            transform: 'translateY(20px)',
          },
          '100%': {
            opacity: '1',
            transform: 'translateY(0)',
          },
        },
      },
      boxShadow: {
        'glass': '0 8px 32px rgba(99, 102, 241, 0.25), 0 1px 0px rgba(255, 255, 255, 0.1) inset',
        'glass-hover': '0 8px 24px rgba(99, 102, 241, 0.25), 0 1px 0px rgba(255, 255, 255, 0.1) inset',
        'glass-button': '0 4px 16px rgba(99, 102, 241, 0.25), 0 1px 0px rgba(255, 255, 255, 0.1) inset',
      },
      zIndex: {
        'background': '0',
        'bubbles': '10',
        'interface': '20',
        'overlay': '30',
        'modal': '40',
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}