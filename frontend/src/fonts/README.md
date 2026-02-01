# Font Management

This directory should contain font files for the Geist font family.

## Required Files:
- `GeistVF.woff` - Variable font for Geist Sans
- `GeistMonoVF.woff` - Variable font for Geist Mono

## Font Installation:
1. Download fonts from: https://vercel.com/font/geist
2. Copy the `.woff` files to this directory
3. Ensure proper font loading in layout.tsx

## Alternative Fix:
If fonts are not available, modify `layout.tsx` to use system fonts:

```typescript
const geistSans = localFont({
  src: "./fonts/GeistVF.woff",  // Remove this line if missing
  variable: "--font-geist-sans",
  weight: "100 900",
  display: 'swap',
})

// Or use system fonts:
const geistSans = Inter.style({ 
  subsets: ['latin'],
  variable: '--font-inter',
})
```