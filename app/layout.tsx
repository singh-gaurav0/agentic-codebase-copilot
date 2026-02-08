import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'
import { LoaderProvider } from './context/loader-context';
import { Toaster } from '@/components/ui/toaster';

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL("https://agentic-codebase-copilot.vercel.app"), // change to your real domain

  title: {
    default: "RepoMind – AI-Powered Codebase Assistant",
    template: "%s | RepoMind",
  },

  description:
    "RepoMind is an AI-powered codebase assistant that analyzes GitHub repositories, explains files and functions, generates tests, and helps developers understand code instantly.",

  keywords: [
    "AI code assistant",
    "GitHub AI",
    "codebase analysis",
    "developer tools",
    "RAG for code",
    "TypeScript AI",
    "AI for developers",
    "repository analyzer",
    "code explanation tool",
  ],

  authors: [{ name: "RepoMind Team" }],
  creator: "RepoMind",
  applicationName: "RepoMind",

  robots: {
    index: true,
    follow: true,
  },

  openGraph: {
    title: "RepoMind – AI-Powered Codebase Assistant",
    description:
      "Understand any GitHub repository instantly. Explain files, locate function definitions, generate tests, and explore code with AI.",
    url: "https://repomind.ai",
    siteName: "RepoMind",
    type: "website",
    images: [
      {
        url: "/og-image.png", // create this later
        width: 1200,
        height: 630,
        alt: "RepoMind AI Codebase Assistant",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "RepoMind – AI Codebase Assistant",
    description:
      "Upload a GitHub repo and instantly understand the code. AI-powered explanations, file discovery, and test generation.",
    images: ["/og-image.png"],
  },

  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
}


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html className="dark" lang="en">
      <body className={`font-sans antialiased`}>
        <LoaderProvider>
          {children}
        </LoaderProvider>
        <Toaster />
        <Analytics />
      </body>
    </html>
  )
}
