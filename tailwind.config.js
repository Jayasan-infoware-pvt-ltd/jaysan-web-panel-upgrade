/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: '#2563eb',
                'primary-hover': '#1d4ed8',
                secondary: '#3f3f46',
                accent: '#2563eb',
                background: '#f8fafc',
                surface: '#ffffff',
                border: '#e4e4e7',
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
            },
            borderRadius: {
                DEFAULT: '8px',
            }
        },
    },
    plugins: [],
}
