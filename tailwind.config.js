/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      colors: {
        'brain-green': '#00ff88',
        'brain-blue': '#00ccff',
        'brain-orange': '#ffaa00',
        'brain-red': '#ff0000',
        'brain-purple': '#8b5cf6',
        'neural-blue': '#3b82f6',
        'seizure-red': '#ef4444',
        'artifact-orange': '#f59e0b',
        'normal-green': '#10b981'
      },
      fontFamily: {
        'sans': ['Inter', 'system-ui', 'sans-serif'],
        'mono': ['Fira Code', 'Monaco', 'Cascadia Code', 'monospace']
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'pulse-fast': 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-slow': 'bounce 2s infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'float': 'float 3s ease-in-out infinite',
        'rotate-slow': 'rotate 8s linear infinite',
        'pulse-red': 'pulse-red 1.5s ease-in-out infinite',
        'pulse-orange': 'pulse-orange 1.5s ease-in-out infinite'
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 20px rgba(59, 130, 246, 0.5)' },
          '100%': { boxShadow: '0 0 40px rgba(59, 130, 246, 0.8)' }
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' }
        },
        'pulse-red': {
          '0%, 100%': { backgroundColor: '#ef4444', opacity: 1 },
          '50%': { backgroundColor: '#dc2626', opacity: 0.8 }
        },
        'pulse-orange': {
          '0%, 100%': { backgroundColor: '#f59e0b', opacity: 1 },
          '50%': { backgroundColor: '#d97706', opacity: 0.8 }
        }
      },
      backgroundImage: {
        'gradient-brain': 'linear-gradient(135deg, #1a1a2e 0%, #0f3460 50%, #16213e 100%)',
        'gradient-seizure': 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
        'gradient-normal': 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem'
      },
      borderRadius: {
        '4xl': '2rem'
      },
      boxShadow: {
        'glow': '0 0 20px rgba(59, 130, 246, 0.3)',
        'glow-red': '0 0 20px rgba(239, 68, 68, 0.3)',
        'glow-green': '0 0 20px rgba(16, 185, 129, 0.3)',
        'inner-brain': 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.6)'
      }
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
    // Custom plugin for brain visualization
    function({ addUtilities }) {
      const newUtilities = {
        '.glass-morphism': {
          background: 'rgba(31, 41, 55, 0.8)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(75, 85, 99, 0.3)',
        },
        '.neural-border': {
          border: '1px solid transparent',
          background: 'linear-gradient(#111827, #111827) padding-box, linear-gradient(45deg, #3b82f6, #8b5cf6) border-box',
        },
        '.brain-gradient-text': {
          background: 'linear-gradient(135deg, #00ff88 0%, #00ccff 50%, #8b5cf6 100%)',
          '-webkit-background-clip': 'text',
          '-webkit-text-fill-color': 'transparent',
          'background-clip': 'text'
        }
      }
      addUtilities(newUtilities)
    }
  ],
}
