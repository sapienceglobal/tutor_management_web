/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        container: {
            center: true,
            padding: "2rem",
            screens: {
                "2xl": "1400px",
            },
        },
        extend: {
            colors: {
                border: "hsl(var(--border))",
                input: "hsl(var(--input))",
                ring: "hsl(var(--ring))",
                background: "hsl(var(--background))",
                foreground: "hsl(var(--foreground))",
                primary: {
                    DEFAULT: "hsl(var(--primary))",
                    foreground: "hsl(var(--primary-foreground))",
                },
                secondary: {
                    DEFAULT: "hsl(var(--secondary))",
                    foreground: "hsl(var(--secondary-foreground))",
                },
                destructive: {
                    DEFAULT: "hsl(var(--destructive))",
                    foreground: "hsl(var(--destructive-foreground))",
                },
                muted: {
                    DEFAULT: "hsl(var(--muted))",
                    foreground: "hsl(var(--muted-foreground))",
                },
                accent: {
                    DEFAULT: "hsl(var(--accent))",
                    foreground: "hsl(var(--accent-foreground))",
                },
                popover: {
                    DEFAULT: "hsl(var(--popover))",
                    foreground: "hsl(var(--popover-foreground))",
                },
                card: {
                    DEFAULT: "hsl(var(--card))",
                    foreground: "hsl(var(--card-foreground))",
                },
                // Bizdire Theme Colors
                bizdire: {
                    blue: "#0F172A", // Deep Navy Blue (Header)
                    orange: "#F97316", // Vibrant Orange (Buttons/Highlights)
                    light: "#F8FAFC", // Light Background
                },
                // Custom Student Dashboard Colors (LearnIQ Theme)
                student: {
                    bg: "#F8FAFC", // Slate 50
                    card: "#FFFFFF",
                    accent: "#F97316", // Orange 500 (Updated from Indigo)
                    text: "#1E293B", // Slate 800
                    muted: "#64748B", // Slate 500
                    success: "#10B981", // Emerald 500
                    warning: "#F59E0B", // Amber 500
                    error: "#EF4444", // Red 500
                },
                pastel: {
                    purple: "#E0E7FF", // Indigo 100
                    green: "#D1FAE5", // Emerald 100
                    blue: "#DBEAFE", // Blue 100
                    red: "#FEE2E2", // Red 100
                    yellow: "#FEF3C7", // Amber 100
                    orange: "#FFEDD5", // Orange 100
                    teal: "#CCFBF1", // Teal 100
                }
            },
            borderRadius: {
                lg: "var(--radius)",
                md: "calc(var(--radius) - 2px)",
                sm: "calc(var(--radius) - 4px)",
            },
            keyframes: {
                "shimmer": {
                    "0%": {
                        "background-position": "200% center"
                    },
                    "100%": {
                        "background-position": "-200% center"
                    }
                },
                "slide-in": {
                    "0%": { transform: "translateX(-20px)", opacity: 0 },
                    "100%": { transform: "translateX(0)", opacity: 1 }
                },
                "accordion-down": {
                    from: { height: 0 },
                    to: { height: "var(--radix-accordion-content-height)" },
                },
                "accordion-up": {
                    from: { height: "var(--radix-accordion-content-height)" },
                    to: { height: 0 },
                },
            },
            animation: {
                "accordion-down": "accordion-down 0.2s ease-out",
                "accordion-up": "accordion-up 0.2s ease-out",
                "shimmer": "shimmer 3s linear infinite",
                "slide-in": "slide-in 0.5s ease-out forwards",
            },
        },
    },
    plugins: [],
};
