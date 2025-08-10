import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { Roboto } from 'next/font/google'
import './globals.css'

const roboto = Roboto({
  weight: ['400', '700'], // You can specify other weights if needed
  subsets: ['latin'],
  variable: '--font-roboto', // Define a CSS variable for the font
})

export const metadata: Metadata = {
  title: 'v0 App',
  description: 'Created with v0',
  generator: 'v0.dev',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <style>{`
html {
  font-family: ${GeistSans.style.fontFamily};
  --font-sans: ${GeistSans.variable};
  --font-mono: ${GeistMono.variable};
  --font-roboto: ${roboto.style.fontFamily}; // Apply the Roboto font variable
}
        `}</style>
      </head>
      <body className={`${roboto.className}`}>{children}</body>
    </html>
  )
}
