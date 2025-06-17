"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Navigation } from "@/components/navigation"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  FileText,
  Globe,
  Clock,
  ExternalLink,
  CheckCircle,
  AlertCircle,
  Loader2,
  TrendingUp,
  AlertTriangle,
} from "lucide-react"

interface KnowledgeBaseItem {
  id: number
  title: string
  content_type: string
  author: string
  word_count: number
  source_url?: string
  extracted_at: string
}

interface ExtractionJob {
  id: number
  job_type: string
  source_identifier: string
  status: string
  progress: number
  items_extracted: number
  processing_time?: number
  created_at: string
}

interface DashboardStats {
  total_items: number
  total_words: number
  sources_processed: number
  avg_processing_time: number
  content_types: Record<string, number>
}

interface DashboardData {
  stats: DashboardStats
  recent_items: KnowledgeBaseItem[]
  recent_jobs: ExtractionJob[]
  error?: string
  message?: string
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)

      console.log("Fetching dashboard data...")
      const response = await fetch("/api/dashboard", {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      })

      console.log("Response status:", response.status)
      console.log("Response headers:", response.headers.get("content-type"))

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const text = await response.text()
      console.log("Raw response:", text.substring(0, 200))

      let dashboardData
      try {
        dashboardData = JSON.parse(text)
      } catch (parseError) {
        console.error("JSON parse error:", parseError)
        throw new Error("Invalid JSON response from server")
      }

      if (dashboardData.error) {
        setError(dashboardData.message || dashboardData.error)
      }

      setData(dashboardData)
    } catch (err) {
      console.error("Failed to fetch dashboard data:", err)
      const errorMessage = err instanceof Error ? err.message : "Failed to load dashboard data"
      setError(errorMessage)

      // Set fallback data
      setData({
        stats: {
          total_items: 0,
          total_words: 0,
          sources_processed: 0,
          avg_processing_time: 0,
          content_types: {},
        },
        recent_items: [],
        recent_jobs: [],
      })
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "processing":
        return <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
      case "failed":
        return <AlertCircle className="h-4 w-4 text-red-600" />
      default:
        return <Clock className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      completed: "default",
      processing: "secondary",
      failed: "destructive",
      pending: "outline",
    } as const

    return <Badge variant={variants[status as keyof typeof variants] || "outline"}>{status}</Badge>
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
              <p className="text-muted-foreground">Loading dashboard...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <Navigation />

      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-foreground">Knowledge Base Dashboard</h1>
            <p className="text-muted-foreground mt-2 text-lg">Monitor your content ingestion pipeline performance</p>
          </div>
          <Button onClick={() => (window.location.href = "/")} size="lg">
            <Globe className="h-4 w-4 mr-2" />
            New Extraction
          </Button>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Dashboard Error:</strong> {error}
              <br />
              <span className="text-sm">Showing fallback data. Please check your database connection.</span>
            </AlertDescription>
          </Alert>
        )}

        {/* Stats Cards */}
        {data && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="border-0 shadow-xl bg-card/80 backdrop-blur-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Items</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{data.stats.total_items.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground mt-1">Across all content types</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-xl bg-card/80 backdrop-blur-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Words</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{data.stats.total_words.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground mt-1">Knowledge base content</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-xl bg-card/80 backdrop-blur-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Sources Processed</CardTitle>
                <Globe className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{data.stats.sources_processed}</div>
                <p className="text-xs text-muted-foreground mt-1">Unique sources extracted</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-xl bg-card/80 backdrop-blur-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Processing Time</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{data.stats.avg_processing_time}s</div>
                <p className="text-xs text-muted-foreground mt-1">Per extraction job</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Content Types Distribution */}
        {data && Object.keys(data.stats.content_types).length > 0 && (
          <Card className="border-0 shadow-xl bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-xl">Content Types Distribution</CardTitle>
              <CardDescription>Breakdown of content by type</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {Object.entries(data.stats.content_types).map(([type, count]) => (
                  <div key={type} className="text-center p-4 bg-muted/30 rounded-xl border">
                    <div className="text-2xl font-bold text-primary">{count}</div>
                    <div className="text-sm text-muted-foreground capitalize">{type.replace("_", " ")}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Activity */}
        <Tabs defaultValue="items" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 h-12">
            <TabsTrigger value="items" className="h-10">
              Recent Items
            </TabsTrigger>
            <TabsTrigger value="jobs" className="h-10">
              Extraction Jobs
            </TabsTrigger>
          </TabsList>

          <TabsContent value="items">
            <Card className="border-0 shadow-xl bg-card/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-xl">Recently Extracted Content</CardTitle>
                <CardDescription>Latest items added to your knowledge base</CardDescription>
              </CardHeader>
              <CardContent>
                {data && data.recent_items.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Author</TableHead>
                        <TableHead>Words</TableHead>
                        <TableHead>Extracted</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.recent_items.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium max-w-xs truncate">{item.title}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">{item.content_type}</Badge>
                          </TableCell>
                          <TableCell>{item.author}</TableCell>
                          <TableCell>{item.word_count.toLocaleString()}</TableCell>
                          <TableCell>{new Date(item.extracted_at).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              {item.source_url && (
                                <Button variant="ghost" size="sm" asChild>
                                  <a href={item.source_url} target="_blank" rel="noopener noreferrer">
                                    <ExternalLink className="h-3 w-3" />
                                  </a>
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No items extracted yet. Start by creating your first extraction!</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="jobs">
            <Card className="border-0 shadow-xl bg-card/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-xl">Extraction Jobs</CardTitle>
                <CardDescription>Processing history and status</CardDescription>
              </CardHeader>
              <CardContent>
                {data && data.recent_jobs.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Source</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Progress</TableHead>
                        <TableHead>Items</TableHead>
                        <TableHead>Time</TableHead>
                        <TableHead>Created</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.recent_jobs.map((job) => (
                        <TableRow key={job.id}>
                          <TableCell className="font-medium max-w-xs truncate">{job.source_identifier}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{job.job_type.toUpperCase()}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              {getStatusIcon(job.status)}
                              {getStatusBadge(job.status)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <div className="w-16 bg-muted rounded-full h-2">
                                <div
                                  className="bg-primary h-2 rounded-full transition-all"
                                  style={{ width: `${job.progress}%` }}
                                />
                              </div>
                              <span className="text-sm text-muted-foreground">{job.progress}%</span>
                            </div>
                          </TableCell>
                          <TableCell>{job.items_extracted}</TableCell>
                          <TableCell>{job.processing_time ? `${job.processing_time}s` : "-"}</TableCell>
                          <TableCell>{new Date(job.created_at).toLocaleDateString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No extraction jobs yet. Start by creating your first extraction!</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
