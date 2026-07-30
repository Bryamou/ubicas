/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Tokens de marca Ubicas (lineamientos de diseño 14.2)
        brand: {
          DEFAULT: '#D6203F', // rojo Ubicas (primario)
          hover: '#A31431', // rojo oscuro (hover/activo)
          soft: '#FBF5F6', // rojo suave (fondo)
        },
        ink: {
          DEFAULT: 'oklch(22% 0.01 25)', // negro cálido (texto principal)
          light: 'oklch(48% 0.02 25)', // gris texto secundario
        },
        surface: {
          DEFAULT: '#FFFFFF',
          muted: 'oklch(98% 0.004 25)', // blanco cálido (fondo base)
        },
        border: {
          DEFAULT: '#E9E5E7',
        },
        success: {
          DEFAULT: 'oklch(55% 0.14 150)',
          soft: 'oklch(94% 0.05 150)',
        },
        warning: {
          DEFAULT: 'oklch(70% 0.14 75)',
          soft: 'oklch(94% 0.06 75)',
        },
        info: {
          DEFAULT: '#2563A8',
          soft: '#EAF2FB',
        },
      },
      fontFamily: {
        // Cuerpo de texto: sans-serif neutra
        sans: ['"Source Sans 3"', 'system-ui', 'sans-serif'],
        // Títulos H1/H2: sans-serif geométrica
        heading: ['"Work Sans"', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        input: '8px',
        card: '12px',
      },
      boxShadow: {
        soft: '0 2px 10px 0 rgba(29, 26, 28, 0.06)',
        card: '0 1px 3px 0 rgba(29, 26, 28, 0.08)',
      },
      maxWidth: {
        // Contenedor máximo de escritorio (14.4)
        content: '1280px',
      },
      spacing: {
        // Escala en base 4 (14.4): 4/8/12/16/24/32/48/64 ya cubiertos por
        // defecto en Tailwind (1,2,3,4,6,8,12,16). Sin overrides necesarios.
      },
    },
  },
  plugins: [],
};
