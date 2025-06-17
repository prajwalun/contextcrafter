"use client"

import { useEffect, useCallback } from "react"

interface DashboardUpdateHook {
  onUpdate: () => void
}

export function useDashboardUpdates({ onUpdate }: DashboardUpdateHook) {
  // Listen for extraction completion events
  useEffect(() => {
    const handleExtractionComplete = () => {
      console.log("🎉 Extraction completed, updating dashboard...")
      onUpdate()
    }

    // Listen for custom events from extraction pages
    window.addEventListener("extractionComplete", handleExtractionComplete)

    // Also listen for storage events (in case of multiple tabs)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "lastExtractionComplete") {
        console.log("🔄 Extraction completed in another tab, updating...")
        onUpdate()
      }
    }

    window.addEventListener("storage", handleStorageChange)

    return () => {
      window.removeEventListener("extractionComplete", handleExtractionComplete)
      window.removeEventListener("storage", handleStorageChange)
    }
  }, [onUpdate])

  // Trigger update when extraction completes
  const triggerUpdate = useCallback(() => {
    // Dispatch custom event
    window.dispatchEvent(new CustomEvent("extractionComplete"))

    // Set localStorage to notify other tabs
    localStorage.setItem("lastExtractionComplete", Date.now().toString())
  }, [])

  return { triggerUpdate }
}
