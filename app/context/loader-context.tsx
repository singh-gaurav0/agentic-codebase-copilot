"use client"

import { createContext, useContext, useState } from "react"
import GlobalLoader from "@/components/global-loader"

type LoaderContextType = {
  show: () => void
  hide: () => void
}

const LoaderContext = createContext<LoaderContextType | null>(null)

export function LoaderProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [visible, setVisible] = useState(false)

  return (
    <LoaderContext.Provider
      value={{
        show: () => setVisible(true),
        hide: () => setVisible(false),
      }}
    >
      {children}
      <GlobalLoader visible={visible} />
    </LoaderContext.Provider>
  )
}

export function useLoader() {
  const context = useContext(LoaderContext)
  if (!context) {
    throw new Error("useLoader must be used within LoaderProvider")
  }
  return context
}
