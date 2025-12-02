import './globals.css'
import AppWrapper from '../components/AppWrapper'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'not.',
  description: 'Ein Volk, ein Reich, ein Führer 卐.',
  icons: {
    icon: [
      { url: '/icons/trollface.png', type: 'image/png' },
    ],
    apple: [
      { url: '/icons/trollface.png', type: 'image/png' },
    ],
    shortcut: '/icons/trollface.png',
  },
  openGraph: {
    title: 'not.',
    description: 'Ein Volk, ein Reich, ein Führer 卐',
    url: 'https://www.whyme.world',
    siteName: 'not.',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'not.',
    description: 'Ein Volk, ein Reich, ein Führer 卐.',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body className="bg-black text-white">
        <AppWrapper>
          {children}
        </AppWrapper>
      </body>
    </html>
  )
}
