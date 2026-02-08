"use client"

import Lottie from "lottie-react"
import animationData from "@/public/loading.json"

interface Props {
  visible: boolean
}

export default function GlobalLoader({ visible }: Props) {
  if (!visible) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B0F14]/80 backdrop-blur-sm">
      <div className="w-40 h-40">
        <Lottie animationData={animationData} loop />
      </div>
    </div>
  )
}
