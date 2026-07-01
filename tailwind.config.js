/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ["class"],
    content: ["./index.html", "./src/**/*.{ts,tsx,js,jsx}"],
  theme: {
  	extend: {
      fontWeight: {
        // figma:app-design (yYgV3Jmz) — start
        "figma-normal": "400",
        // figma:app-design (yYgV3Jmz) — end
      },
      lineHeight: {
        // figma:app-design (yYgV3Jmz) — start
        "figma-19": "19px",
        "figma-29": "29px",
        "figma-58": "58px",
        "figma-62": "62px",
        "figma-108": "108px",
        "figma-153": "153px",
        // figma:app-design (yYgV3Jmz) — end
      },
      fontSize: {
        // figma:app-design (yYgV3Jmz) — start
        "figma-16": "16px",
        "figma-24": "24px",
        "figma-48": "48px",
        "figma-52": "52px",
        "figma-90": "90px",
        "figma-128": "128px",
        // figma:app-design (yYgV3Jmz) — end
      },
  		fontFamily: {
        // figma:app-design (yYgV3Jmz) — start
        "heading": ['"Inria Serif"', 'sans-serif'],
        "figma-inter": ['"Inter"', 'sans-serif'],
        "figma-sf-pro": ['"SF Pro"', 'sans-serif'],
        // figma:app-design (yYgV3Jmz) — end
      
  			inter: ['var(--font-inter)'],
  			serif: ['var(--font-serif)'],
  			inria: ['var(--font-inria)'],
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		colors: {
        // figma:app-design (yYgV3Jmz) — start
        "figma-primary": "hsl(var(--figma-primary))",
        "figma-secondary": "hsl(var(--figma-secondary))",
        "figma-accent": "hsl(var(--figma-accent))",
        "figma-muted": "hsl(var(--figma-muted))",
        "figma-surface": "hsl(var(--figma-surface))",
        "figma-border": "hsl(var(--figma-border))",
        "figma-highlight": "hsl(var(--figma-highlight))",
        "figma-text-1": "hsl(var(--figma-text-1))",
        // figma:app-design (yYgV3Jmz) — end
      
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			},
  			sidebar: {
  				DEFAULT: 'hsl(var(--sidebar-background))',
  				foreground: 'hsl(var(--sidebar-foreground))',
  				primary: 'hsl(var(--sidebar-primary))',
  				'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
  				accent: 'hsl(var(--sidebar-accent))',
  				'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
  				border: 'hsl(var(--sidebar-border))',
  				ring: 'hsl(var(--sidebar-ring))'
  			}
  		},
  		keyframes: {
  			'accordion-down': {
  				from: {
  					height: '0'
  				},
  				to: {
  					height: 'var(--radix-accordion-content-height)'
  				}
  			},
  			'accordion-up': {
  				from: {
  					height: 'var(--radix-accordion-content-height)'
  				},
  				to: {
  					height: '0'
  				}
  			}
  		},
  		animation: {
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out'
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
}