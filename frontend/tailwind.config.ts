import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        space: {
          950: '#020811',
          900: '#060D1A',
          800: '#0A1628',
          700: '#0F1F3D',
          600: '#152643',
          500: '#1B3058',
        },
        cyber: {
          DEFAULT: '#00CFFF',
          dim:     '#0098BB',
          bright:  '#4DDFFF',
          glow:    'rgba(0, 207, 255, 0.15)',
        },
        neon: {
          green:  '#00E5A0',
          purple: '#A78BFA',
          amber:  '#FBB040',
          red:    '#FF4757',
          pink:   '#F472B6',
          lime:   '#84CC16',
        },
      },
      fontFamily: {
        mono: ['ui-monospace', 'JetBrains Mono', 'Fira Code', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Inter', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'grid-subtle': `
          linear-gradient(rgba(0,207,255,0.04) 1px, transparent 1px),
          linear-gradient(90deg, rgba(0,207,255,0.04) 1px, transparent 1px)
        `,
        'grid-strong': `
          linear-gradient(rgba(0,207,255,0.08) 1px, transparent 1px),
          linear-gradient(90deg, rgba(0,207,255,0.08) 1px, transparent 1px)
        `,
        'radial-glow': 'radial-gradient(ellipse at 50% 0%, rgba(0,207,255,0.12) 0%, transparent 70%)',
        'card-gradient': 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)',
        'sidebar-gradient': 'linear-gradient(180deg, #060D1A 0%, #030710 100%)',
      },
      backgroundSize: {
        'grid': '40px 40px',
      },
      boxShadow: {
        'cyber':        '0 0 0 1px rgba(0,207,255,0.2), 0 4px 24px rgba(0,207,255,0.08)',
        'cyber-hover':  '0 0 0 1px rgba(0,207,255,0.5), 0 8px 32px rgba(0,207,255,0.16)',
        'cyber-active': '0 0 0 1px rgba(0,207,255,0.8), 0 0 24px rgba(0,207,255,0.3)',
        'neon-green':   '0 0 0 1px rgba(0,229,160,0.4), 0 0 16px rgba(0,229,160,0.15)',
        'neon-red':     '0 0 0 1px rgba(255,71,87,0.4), 0 0 16px rgba(255,71,87,0.15)',
        'neon-amber':   '0 0 0 1px rgba(251,176,64,0.4), 0 0 16px rgba(251,176,64,0.15)',
        'neon-purple':  '0 0 0 1px rgba(167,139,250,0.4), 0 0 16px rgba(167,139,250,0.15)',
        'inner-glow':   'inset 0 1px 0 rgba(255,255,255,0.06)',
        'panel':        '0 0 0 1px rgba(0,207,255,0.08), 0 24px 64px rgba(0,0,0,0.6)',
      },
      animation: {
        'pulse-cyber':  'pulseCyber 3s ease-in-out infinite',
        'pulse-dot':    'pulseDot 2s ease-in-out infinite',
        'fade-in':      'fadeIn 0.4s ease-out',
        'slide-up':     'slideUp 0.4s ease-out',
        'slide-in-left':'slideInLeft 0.3s ease-out',
        'scan-line':    'scanLine 6s linear infinite',
        'shimmer':      'shimmer 2s linear infinite',
        'count-up':     'countUp 0.8s ease-out',
        'border-flow':  'borderFlow 4s linear infinite',
        'float':        'float 6s ease-in-out infinite',
      },
      keyframes: {
        pulseCyber: {
          '0%, 100%': { opacity: '0.6', transform: 'scale(1)' },
          '50%':      { opacity: '1',   transform: 'scale(1.02)' },
        },
        pulseDot: {
          '0%, 100%': { boxShadow: '0 0 0 0 currentColor' },
          '50%':      { boxShadow: '0 0 0 6px transparent' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        slideInLeft: {
          from: { opacity: '0', transform: 'translateX(-16px)' },
          to:   { opacity: '1', transform: 'translateX(0)' },
        },
        scanLine: {
          '0%':   { transform: 'translateY(-100%)', opacity: '0' },
          '10%':  { opacity: '1' },
          '90%':  { opacity: '1' },
          '100%': { transform: 'translateY(800px)', opacity: '0' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        countUp: {
          from: { opacity: '0', transform: 'translateY(8px) scale(0.95)' },
          to:   { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        borderFlow: {
          '0%':   { backgroundPosition: '0% 50%' },
          '100%': { backgroundPosition: '200% 50%' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%':      { transform: 'translateY(-6px)' },
        },
      },
      borderRadius: {
        'panel': '2px',
      },
    },
  },
  plugins: [],
};

export default config;
