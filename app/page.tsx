"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Navigation } from "@/components/navigation"
import { toast } from "@/hooks/use-toast"
import {
  Globe,
  FileText,
  Download,
  CheckCircle,
  AlertCircle,
  Loader2,
  Copy,
  ExternalLink,
  BookOpen,
  Rss,
  FileUp,
  Check,
  Sparkles,
  Zap,
  Shield,
  Upload,
  X,
} from "lucide-react"

interface ProcessedItem {
  title: string
  content: string
  content_type: string
  source_url?: string
  author: string
  user_id: string
  word_count: number
  extracted_at: string
}

interface ProcessingResult {
  team_id: string
  items: ProcessedItem[]
  total_items: number
  processing_time: number
  sources_processed: string[]
}

export default function ContentIngestionPipeline() {
  const [activeTab, setActiveTab] = useState("url")
  const [url, setUrl] = useState("")
  const [teamId, setTeamId] = useState("") // Always start empty
  const [userId, setUserId] = useState("") // Always start empty
  const [file, setFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState<ProcessingResult | null>(null)
  const [error, setError] = useState("")
  const [processingStatus, setProcessingStatus] = useState("")
  const [copied, setCopied] = useState(false)

  // Only get from URL params if explicitly provided, don't use localStorage
  useEffect(() => {
    // Always start with clean state - no URL parameter reading
  }, [])

  // Simple handlers - no localStorage
  const handleTeamIdChange = (value: string) => {
    setTeamId(value)
    // Don't update URL or localStorage
  }

  const handleUserIdChange = (value: string) => {
    setUserId(value)
    // Don't update URL or localStorage
  }

  const handleUrlSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!url.trim() || !teamId.trim() || !userId.trim()) {
      toast({
        title: "Missing Information",
        description: "Please fill in Team ID, User ID, and URL",
        variant: "destructive",
      })
      return
    }

    setIsProcessing(true)
    setProgress(0)
    setError("")
    setResult(null)
    setProcessingStatus("Initializing extraction...")

    try {
      const response = await fetch("/api/extract-url", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: url.trim(),
          team_id: teamId.trim(),
          user_id: userId.trim(),
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value)
          const lines = chunk.split("\n")

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              try {
                const data = JSON.parse(line.slice(6))

                if (data.type === "progress") {
                  setProgress(data.progress)
                  setProcessingStatus(data.status)
                } else if (data.type === "result") {
                  setResult(data.result)
                  setProgress(100)
                  setProcessingStatus("Extraction completed!")
                  toast({
                    title: "Extraction Complete!",
                    description: `Successfully extracted ${data.result.total_items} items`,
                  })
                } else if (data.type === "error") {
                  throw new Error(data.error)
                }
              } catch (e) {
                // Skip invalid JSON lines
              }
            }
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
      toast({
        title: "Extraction Failed",
        description: err instanceof Error ? err.message : "An error occurred",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file || !teamId.trim() || !userId.trim()) {
      toast({
        title: "Missing Information",
        description: "Please fill in Team ID, User ID, and select a file",
        variant: "destructive",
      })
      return
    }

    setIsProcessing(true)
    setProgress(0)
    setError("")
    setResult(null)
    setProcessingStatus("Processing PDF...")

    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("team_id", teamId.trim())
      formData.append("user_id", userId.trim())

      console.log("📤 Sending PDF processing request...")
      console.log("File:", file.name, file.size, "bytes")
      console.log("Team ID:", teamId)
      console.log("User ID:", userId)

      const response = await fetch("/api/extract-pdf", {
        method: "POST",
        body: formData,
      })

      console.log("📥 Response status:", response.status)
      console.log("📥 Response headers:", response.headers.get("content-type"))

      if (!response.ok) {
        const errorText = await response.text()
        console.error("❌ Response error:", errorText)
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`)
      }

      // Check if response is actually a stream
      if (!response.body) {
        throw new Error("No response body received")
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()

      console.log("📖 Reading response stream...")
      let buffer = ""
      let hasReceivedData = false

      while (true) {
        const { done, value } = await reader.read()

        if (done) {
          console.log("📖 Stream ended")
          break
        }

        hasReceivedData = true
        const chunk = decoder.decode(value, { stream: true })
        buffer += chunk
        console.log("📦 Received chunk:", chunk.substring(0, 100) + "...")

        // Process complete lines
        const lines = buffer.split("\n")
        buffer = lines.pop() || "" // Keep incomplete line in buffer

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const jsonStr = line.slice(6).trim()
              if (jsonStr) {
                const data = JSON.parse(jsonStr)
                console.log("📊 Parsed data:", data.type, data)

                if (data.type === "progress") {
                  setProgress(data.progress)
                  setProcessingStatus(data.status)
                  console.log(`📊 Progress: ${data.progress}% - ${data.status}`)
                } else if (data.type === "result") {
                  console.log("✅ Processing complete! Result:", data.result)
                  console.log("📋 Result details:", {
                    totalItems: data.result.total_items,
                    items: data.result.items?.length,
                    processingTime: data.result.processing_time,
                  })

                  setResult(data.result)
                  setProgress(100)
                  setProcessingStatus("PDF processing completed!")

                  toast({
                    title: "PDF Processing Complete!",
                    description: `Successfully extracted ${data.result.total_items} chapters`,
                  })
                } else if (data.type === "error") {
                  console.error("❌ Processing error:", data.error)
                  throw new Error(data.error)
                }
              }
            } catch (parseError) {
              console.warn("⚠️ Failed to parse line:", line, parseError)
            }
          }
        }
      }

      // Process any remaining buffer
      if (buffer.trim()) {
        console.log("📦 Final buffer:", buffer)
      }

      // Check if we received any data at all
      if (!hasReceivedData) {
        throw new Error("No data received from server")
      }

      // If we got here but no result was set, something went wrong
      if (!result) {
        console.error("❌ Stream completed but no result received")
        throw new Error("Processing completed but no result was returned")
      }
    } catch (err) {
      console.error("❌ PDF processing failed:", err)
      setError(err instanceof Error ? err.message : "An error occurred")
      toast({
        title: "PDF Processing Failed",
        description: err instanceof Error ? err.message : "An error occurred",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const downloadResult = () => {
    if (!result) return

    const blob = new Blob([JSON.stringify(result, null, 2)], {
      type: "application/json",
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `knowledge-base-${result.team_id}-${Date.now()}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    toast({
      title: "Download Started",
      description: "Your knowledge base export is downloading",
    })
  }

  const copyToClipboard = async () => {
    if (!result) return

    try {
      await navigator.clipboard.writeText(JSON.stringify(result, null, 2))
      setCopied(true)
      toast({
        title: "Copied to Clipboard",
        description: "Knowledge base data copied successfully",
      })

      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      toast({
        title: "Copy Failed",
        description: "Failed to copy to clipboard",
        variant: "destructive",
      })
    }
  }

  const removeFile = () => {
    setFile(null)
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <Navigation />

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-12">
        {/* Hero Section */}
        <div className="text-center space-y-6 py-12">
          <div className="flex items-center justify-center space-x-4">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl blur-lg opacity-20"></div>
              <div className="relative p-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl">
                <BookOpen className="h-10 w-10 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent">
                ContextCrafter
              </h1>
              <div className="flex items-center justify-center space-x-2 mt-2">
                <Badge variant="secondary" className="text-xs">
                  <Sparkles className="h-3 w-3 mr-1" />
                  AI-Powered
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  <Zap className="h-3 w-3 mr-1" />
                  Production Ready
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  <Shield className="h-3 w-3 mr-1" />
                  Enterprise Grade
                </Badge>
              </div>
            </div>
          </div>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Transform any content source into structured knowledge. Extract from blogs, websites, PDFs, and more with
            intelligent processing and enterprise-grade reliability.
          </p>
        </div>

        {/* Main Interface */}
        <Card className="shadow-2xl border-0 bg-card/80 backdrop-blur-xl">
          <CardHeader className="pb-8">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-3xl font-bold">Content Ingestion Pipeline</CardTitle>
                <CardDescription className="text-lg mt-2">
                  Extract and normalize content from any source into your knowledge base
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-8">
            {/* Configuration */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-muted/30 rounded-xl border">
              <div className="space-y-3">
                <Label htmlFor="team-id" className="text-sm font-medium">
                  Team ID
                </Label>
                <Input
                  id="team-id"
                  value={teamId}
                  onChange={(e) => handleTeamIdChange(e.target.value)}
                  placeholder="Enter your team ID"
                  className="h-11"
                />
              </div>
              <div className="space-y-3">
                <Label htmlFor="user-id" className="text-sm font-medium">
                  User ID
                </Label>
                <Input
                  id="user-id"
                  value={userId}
                  onChange={(e) => handleUserIdChange(e.target.value)}
                  placeholder="Enter your user ID"
                  className="h-11"
                />
              </div>
            </div>

            {/* Input Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 h-14 p-1">
                <TabsTrigger value="url" className="flex items-center space-x-3 h-12">
                  <Globe className="h-5 w-5" />
                  <span className="font-medium">URL/Website</span>
                </TabsTrigger>
                <TabsTrigger value="pdf" className="flex items-center space-x-3 h-12">
                  <FileText className="h-5 w-5" />
                  <span className="font-medium">PDF Upload</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="url" className="space-y-6 mt-8">
                <form onSubmit={handleUrlSubmit} className="space-y-6">
                  <div className="space-y-3">
                    <Label htmlFor="url" className="text-base font-medium">
                      Website URL or Blog
                    </Label>
                    <div className="flex space-x-3">
                      <Input
                        id="url"
                        type="url"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder="https://interviewing.io/blog or https://quill.co/blog"
                        className="flex-1 h-12 text-base"
                        disabled={isProcessing}
                      />
                      <Button
                        type="submit"
                        disabled={isProcessing || !url.trim() || !teamId.trim() || !userId.trim()}
                        className="px-8 h-12 font-medium"
                        size="lg"
                      >
                        {isProcessing ? (
                          <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                          <>
                            <Rss className="h-5 w-5 mr-2" />
                            Extract
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground bg-muted/30 p-4 rounded-lg">
                    <strong>Supported sources:</strong> Individual articles, blog homepages, Substack newsletters,
                    technical documentation, and most websites with intelligent content detection.
                  </div>
                </form>
              </TabsContent>

              <TabsContent value="pdf" className="space-y-6 mt-8">
                <div className="space-y-6">
                  <div className="space-y-4">
                    <Label className="text-base font-medium">PDF Document</Label>

                    {/* File Upload Area - Apple/Google Style */}
                    <div className="relative">
                      {!file ? (
                        <div className="border-2 border-dashed border-muted-foreground/25 rounded-xl p-8 text-center hover:border-muted-foreground/50 transition-colors">
                          <div className="flex flex-col items-center space-y-4">
                            <div className="p-4 bg-muted/30 rounded-full">
                              <Upload className="h-8 w-8 text-muted-foreground" />
                            </div>
                            <div className="space-y-2">
                              <p className="text-lg font-medium">Choose a PDF file</p>
                              <p className="text-sm text-muted-foreground">
                                Drag and drop your file here, or click to browse
                              </p>
                            </div>
                            <Button
                              type="button"
                              variant="outline"
                              className="relative overflow-hidden"
                              disabled={isProcessing}
                            >
                              <FileUp className="h-4 w-4 mr-2" />
                              Browse Files
                              <input
                                type="file"
                                accept=".pdf"
                                onChange={(e) => setFile(e.target.files?.[0] || null)}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                disabled={isProcessing}
                              />
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="border border-border rounded-xl p-6 bg-muted/20">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                                <FileText className="h-6 w-6 text-blue-600" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-foreground truncate">{file.name}</p>
                                <p className="text-sm text-muted-foreground">{formatFileSize(file.size)}</p>
                              </div>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={removeFile}
                              disabled={isProcessing}
                              className="text-muted-foreground hover:text-foreground"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Process Button - Clean and Professional */}
                    {file && (
                      <div className="flex justify-center pt-4">
                        <Button
                          onClick={handleFileUpload}
                          disabled={isProcessing || !teamId.trim() || !userId.trim()}
                          size="lg"
                          className="px-12 h-12 font-medium bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg"
                        >
                          {isProcessing ? (
                            <>
                              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                              Processing...
                            </>
                          ) : (
                            <>
                              <Sparkles className="h-5 w-5 mr-2" />
                              Process PDF
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </div>

                  <div className="text-sm text-muted-foreground bg-muted/30 p-4 rounded-lg">
                    <strong>Supported formats:</strong> Technical books, guides, documentation with automatic chapter
                    detection and intelligent content splitting.
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            {/* Processing Status */}
            {isProcessing && (
              <Card className="border-primary/20 bg-primary/5">
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <Loader2 className="h-5 w-5 animate-spin text-primary" />
                      <span className="font-medium text-primary">{processingStatus}</span>
                    </div>
                    <div className="space-y-2">
                      <Progress value={progress} className="h-3" />
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>{progress}% complete</span>
                        <span>Processing...</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Error Display */}
            {error && (
              <Alert variant="destructive" className="border-destructive/20">
                <AlertCircle className="h-5 w-5" />
                <AlertDescription className="text-base">{error}</AlertDescription>
              </Alert>
            )}

            {/* Results */}
            {result && (
              <Card className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/20">
                <CardHeader className="pb-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="h-6 w-6 text-green-600" />
                      <CardTitle className="text-green-800 dark:text-green-400 text-xl">Processing Complete</CardTitle>
                    </div>
                    <div className="flex space-x-3">
                      <Button
                        variant="outline"
                        size="lg"
                        onClick={copyToClipboard}
                        className="border-green-300 text-green-700 hover:bg-green-100 dark:border-green-700 dark:text-green-400 dark:hover:bg-green-900/20"
                      >
                        {copied ? (
                          <>
                            <Check className="h-4 w-4 mr-2" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="h-4 w-4 mr-2" />
                            Copy JSON
                          </>
                        )}
                      </Button>
                      <Button size="lg" onClick={downloadResult} className="bg-green-600 hover:bg-green-700 text-white">
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Summary Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-white dark:bg-card rounded-xl border">
                      <div className="text-3xl font-bold text-green-600">{result.total_items}</div>
                      <div className="text-sm text-muted-foreground font-medium">Items Extracted</div>
                    </div>
                    <div className="text-center p-4 bg-white dark:bg-card rounded-xl border">
                      <div className="text-3xl font-bold text-blue-600">
                        {result.items.reduce((sum, item) => sum + item.word_count, 0).toLocaleString()}
                      </div>
                      <div className="text-sm text-muted-foreground font-medium">Total Words</div>
                    </div>
                    <div className="text-center p-4 bg-white dark:bg-card rounded-xl border">
                      <div className="text-3xl font-bold text-purple-600">{result.sources_processed.length}</div>
                      <div className="text-sm text-muted-foreground font-medium">Sources</div>
                    </div>
                    <div className="text-center p-4 bg-white dark:bg-card rounded-xl border">
                      <div className="text-3xl font-bold text-orange-600">{result.processing_time}s</div>
                      <div className="text-sm text-muted-foreground font-medium">Processing Time</div>
                    </div>
                  </div>

                  {/* Extracted Items Preview */}
                  <div className="space-y-4">
                    <h4 className="font-semibold text-green-800 dark:text-green-400 text-lg">
                      Extracted Content Preview
                    </h4>
                    <ScrollArea className="h-80 w-full border rounded-xl bg-white dark:bg-card">
                      <div className="p-6 space-y-6">
                        {result.items.map((item, index) => (
                          <div key={index} className="border-b pb-4 last:border-b-0">
                            <div className="flex items-start justify-between mb-3">
                              <h5 className="font-semibold text-foreground line-clamp-2 flex-1 pr-4">{item.title}</h5>
                              <Badge variant="secondary" className="shrink-0">
                                {item.content_type}
                              </Badge>
                            </div>
                            <p className="text-muted-foreground line-clamp-3 mb-3 leading-relaxed">
                              {item.content.substring(0, 200)}...
                            </p>
                            <div className="flex items-center justify-between text-sm text-muted-foreground">
                              <span className="font-medium">By {item.author || "Unknown"}</span>
                              <div className="flex items-center space-x-4">
                                <span>{item.word_count.toLocaleString()} words</span>
                                {item.source_url && (
                                  <a
                                    href={item.source_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center space-x-1 text-primary hover:text-primary/80 transition-colors"
                                  >
                                    <ExternalLink className="h-3 w-3" />
                                    <span>Source</span>
                                  </a>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>

        {/* Features Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card className="border-0 shadow-xl bg-card/80 backdrop-blur-sm hover:shadow-2xl transition-all duration-300">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto p-4 bg-blue-100 dark:bg-blue-900/20 rounded-2xl w-fit mb-4">
                <Globe className="h-8 w-8 text-blue-600" />
              </div>
              <CardTitle className="text-xl">Universal Extraction</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-muted-foreground leading-relaxed">
                Works with any website, blog, or content source using intelligent fallback strategies and adaptive
                content detection.
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-xl bg-card/80 backdrop-blur-sm hover:shadow-2xl transition-all duration-300">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto p-4 bg-green-100 dark:bg-green-900/20 rounded-2xl w-fit mb-4">
                <Sparkles className="h-8 w-8 text-green-600" />
              </div>
              <CardTitle className="text-xl">AI-Powered Processing</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-muted-foreground leading-relaxed">
                Advanced content cleaning, metadata extraction, and format normalization with machine learning
                enhancement.
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-xl bg-card/80 backdrop-blur-sm hover:shadow-2xl transition-all duration-300">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto p-4 bg-purple-100 dark:bg-purple-900/20 rounded-2xl w-fit mb-4">
                <Shield className="h-8 w-8 text-purple-600" />
              </div>
              <CardTitle className="text-xl">Enterprise Ready</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-muted-foreground leading-relaxed">
                Built for production with extensible architecture, comprehensive monitoring, and enterprise-grade
                security.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
