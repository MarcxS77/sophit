import type { Metadata } from 'next'
import './globals.css'
import { SplashProvider } from '@/components/SplashProvider'

export const metadata: Metadata = {
  title: 'Sophit — Saúde & Performance',
  description: 'Plataforma SaaS para profissionais de saúde e fitness',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head />
      <body className="min-h-screen bg-background font-sans antialiased">
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const theme = localStorage.getItem('theme')
                if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                  document.documentElement.classList.add('dark')
                }
              } catch (_) {}
            `,
          }}
        />
        <SplashProvider>
          {children}
        </SplashProvider>
      </body>
    </html>
  )
}
