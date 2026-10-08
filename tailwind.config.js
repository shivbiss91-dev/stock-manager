/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: {
          dark: '#05060A',
          light: '#F4F7FA',
        },
        panel: {
          dark: '#0B0D14',
          light: '#FFFFFF',
        },
        surface: {
          light: '#FFFFFF',
          'light-page': '#F4F7FA',
          'light-card': '#FFFFFF',
          dark: '#05060A',
          'dark-panel': '#0B0D14',
          'dark-card': '#12151D',
          'dark-card-end': '#181B25',
          'dark-input': '#1A1D26',
        },
        brand: {
          navy: '#0B1F3A',
          blue: '#3B5BFF',
          'blue-light': '#6079FF',
          orange: '#FF6B35',
          'orange-light': '#FF885A',
          teal: '#0E8F83',
          'teal-light': '#13B2A4',
        },
        accent: {
          blue: '#3B5BFF',
          'blue-hover': '#4E6BFF',
          orange: '#FF6B35',
          'orange-hover': '#FF7C4B',
        },
        template: {
          canvas: '#05060A',
          panel: '#0B0D14',
          cardStart: '#12151D',
          cardEnd: '#181B25',
          input: '#1A1D26',
          blue: '#3B5BFF',
          orange: '#FF6B35',
        },
        app: {
          text: '#F2F4F8',
          'text-secondary': '#9AA0AE',
          'text-muted': '#6B7280',
        },
        status: {
          success: '#2ECC71',
          warning: '#FFB020',
          danger: '#FF4D4F',
          info: '#3B5BFF',
        },
      },
      fontFamily: {
        sans: ['Mulish', 'Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      borderRadius: {
        'lg': '10px',
        'xl': '12px',
        '2xl': '16px',
        '3xl': '20px',
        'panel': '24px',
      },
      boxShadow: {
        'panel': '0 20px 40px -15px rgba(0, 0, 0, 0.7)',
        'glass-card': '0 8px 24px -4px rgba(0, 0, 0, 0.4), inset 0 1px 0 0 rgba(255, 255, 255, 0.08)',
        'glow-orange': '0 0 25px -4px rgba(255, 107, 53, 0.4)',
        'glow-blue': '0 0 25px -4px rgba(59, 91, 255, 0.4)',
        'glow-card': '0 0 20px -2px rgba(255, 107, 53, 0.25)',
      },
    },
  },
  plugins: [],
}
