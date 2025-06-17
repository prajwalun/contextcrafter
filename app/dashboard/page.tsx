"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Navigation } from "@/components/navigation"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useDashboardUpdates } from "@/hooks/use-dashboard-updates"
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
  RefreshCw,
  Database,
  Activity,
  Users,
} from "lucide-react"

interface KnowledgeBaseItem {
  id: number
  title: string
  content: string
  content_type: string
  author: string
  word_count: number
  source_url?: string
  extracted_at: string
  user_id: string
  team_id: string
}

interface ExtractionJob {
  id: number
  job_type: string
  source_identifier: string
  status: string
  progress: number
  items_extracted: number
  processing_time?: number
  error_message?: string
  created_at: string
  updated_at: string
  team_id: string
}

interface DashboardStats {
  total_items: number
  total_words: number
  sources_processed: number
  avg_processing_time: number
  content_types: Record<string, number>
  team_distribution: Record<string, number>
  total_teams: number
}

interface DashboardData {
  stats: DashboardStats
  recent_items: KnowledgeBaseItem[]
  recent_jobs: ExtractionJob[]
  database_connected: boolean
  last_updated: string
  view_type: string
  error?: string
  message?: string
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Add these state variables after the existing useState declarations
  const [jobsPage, setJobsPage] = useState(1)
  const [loadingMoreJobs, setLoadingMoreJobs] = useState(false)
  const [allJobsLoaded, setAllJobsLoaded] = useState(false)
  const [allJobs, setAllJobs] = useState<ExtractionJob[]>([])

  const fetchDashboardData = async (showRefreshing = false) => {
    try {
      if (showRefreshing) setIsRefreshing(true)
      if (!showRefreshing) setLoading(true)
      setError(null)

      console.log("🔄 Fetching GLOBAL dashboard data at:", new Date().toISOString())

      const timestamp = Date.now()
      const randomId = Math.random().toString(36).substring(7)

      // NO team_id parameter - fetch global data
      const response = await fetch(
        "/api/dashboard?" +
          new URLSearchParams({
            t: timestamp.toString(),
            r: randomId,
            force_refresh: "true",
          }),
        {
          method: "GET",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            "Cache-Control": "no-cache, no-store, must-revalidate",
            Pragma: "no-cache",
            Expires: "0",
          },
          cache: "no-store",
        },
      )

      console.log("📊 Dashboard response status:", response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.error("❌ Dashboard API error:", response.status, errorText)
        throw new Error(`Dashboard API failed: ${response.status} - ${errorText}`)
      }

      const dashboardData = await response.json()
      console.log("📈 GLOBAL dashboard data received:", {
        totalItems: dashboardData.stats?.total_items,
        totalTeams: dashboardData.stats?.total_teams,
        recentItems: dashboardData.recent_items?.length,
        recentJobs: dashboardData.recent_jobs?.length,
        databaseConnected: dashboardData.database_connected,
        viewType: dashboardData.view_type,
        hasError: !!dashboardData.error,
        timestamp: dashboardData.last_updated,
      })

      if (dashboardData.error) {
        console.warn("⚠️ Dashboard returned error:", dashboardData.error)
        setError(dashboardData.message || dashboardData.error)
      }

      setData(dashboardData)
      // Add this after setData(dashboardData):
      if (dashboardData.recent_jobs) {
        setAllJobs(dashboardData.recent_jobs.slice(0, 15))
        setJobsPage(1)
        setAllJobsLoaded(dashboardData.recent_jobs.length < 15)
      }
      setLastRefresh(new Date())
    } catch (err) {
      console.error("❌ Failed to fetch dashboard data:", err)
      const errorMessage = err instanceof Error ? err.message : "Failed to load dashboard data"
      setError(errorMessage)

      // Don't clear existing data on error, just show error message
      if (!data) {
        setData({
          stats: {
            total_items: 0,
            total_words: 0,
            sources_processed: 0,
            avg_processing_time: 0,
            content_types: {},
            team_distribution: {},
            total_teams: 0,
          },
          recent_items: [],
          recent_jobs: [],
          database_connected: false,
          last_updated: new Date().toISOString(),
          view_type: "global",
          error: errorMessage,
        })
      }
    } finally {
      setLoading(false)
      setIsRefreshing(false)
    }
  }

  // Add this function to load more jobs
  const loadMoreJobs = async () => {
    if (loadingMoreJobs || allJobsLoaded) return

    setLoadingMoreJobs(true)
    try {
      const response = await fetch(`/api/dashboard/jobs?page=${jobsPage + 1}&limit=15`, {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Cache-Control": "no-cache",
        },
      })

      if (response.ok) {
        const newJobsData = await response.json()
        if (newJobsData.jobs && newJobsData.jobs.length > 0) {
          setAllJobs((prev) => [...prev, ...newJobsData.jobs])
          setJobsPage((prev) => prev + 1)

          // Check if we've loaded all jobs
          if (newJobsData.jobs.length < 15) {
            setAllJobsLoaded(true)
          }
        } else {
          setAllJobsLoaded(true)
        }
      }
    } catch (error) {
      console.error("Failed to load more jobs:", error)
    } finally {
      setLoadingMoreJobs(false)
    }
  }

  // Use the dashboard updates hook for real-time updates when extractions complete
  useDashboardUpdates({
    onUpdate: () => fetchDashboardData(true),
  })

  // Initial load and visibility change handling
  useEffect(() => {
    // Initial load
    fetchDashboardData()

    // Refresh when the page becomes visible again
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log("🔄 Page became visible, refreshing global dashboard")
        fetchDashboardData(true)
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange)
    }
  }, []) // No dependencies - just run once

  const handleRefresh = () => {
    console.log("🔄 Manual refresh triggered")
    fetchDashboardData(true)
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

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString()
    } catch {
      return "Invalid date"
    }
  }

  if (loading && !data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
              <p className="text-muted-foreground">Loading global dashboard...</p>
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
            <h1 className="text-4xl font-bold text-foreground">Global Content Dashboard</h1>
            <p className="text-muted-foreground mt-2 text-lg">
              Monitor all content ingestion across all teams and users
            </p>
            <div className="flex items-center space-x-4 mt-2">
              <p className="text-sm text-muted-foreground">Last updated: {lastRefresh.toLocaleTimeString()}</p>
              <Badge variant="outline" className="text-blue-600 border-blue-600">
                <Globe className="h-3 w-3 mr-1" />
                Global View
              </Badge>
              {data?.database_connected && (
                <Badge variant="outline" className="text-green-600 border-green-600">
                  <Database className="h-3 w-3 mr-1" />
                  Connected
                </Badge>
              )}
              {!data?.database_connected && (
                <Badge variant="outline" className="text-red-600 border-red-600">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  Disconnected
                </Badge>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Button onClick={handleRefresh} variant="outline" size="lg" disabled={isRefreshing}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
              {isRefreshing ? "Refreshing..." : "Refresh"}
            </Button>
            <Button onClick={() => (window.location.href = "/")} size="lg">
              <Globe className="h-4 w-4 mr-2" />
              New Extraction
            </Button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Dashboard Error:</strong> {error}
              <br />
              <span className="text-sm">
                {data?.database_connected === false
                  ? "Database connection failed. Please check your Supabase configuration."
                  : "There was an issue loading the dashboard data."}
              </span>
            </AlertDescription>
          </Alert>
        )}

        {/* Connection Status */}
        {data && !data.database_connected && (
          <Alert>
            <Database className="h-4 w-4" />
            <AlertDescription>
              <strong>Database Status:</strong> Not connected. Dashboard may show limited or no data.
              <br />
              <span className="text-sm">
                Please ensure your Supabase environment variables are configured correctly.
              </span>
            </AlertDescription>
          </Alert>
        )}

        {/* Global Stats Cards */}
        {data && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            <Card className="border-0 shadow-xl bg-card/80 backdrop-blur-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Items</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{data.stats.total_items.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {data.stats.total_items === 0 ? "No extractions yet" : "Across all teams"}
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-xl bg-card/80 backdrop-blur-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Words</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{data.stats.total_words.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {data.stats.total_words === 0 ? "No content extracted" : "Global knowledge base"}
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-xl bg-card/80 backdrop-blur-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Teams</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{data.stats.total_teams}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {data.stats.total_teams === 0 ? "No teams active" : "Teams using the platform"}
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-xl bg-card/80 backdrop-blur-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Sources Processed</CardTitle>
                <Globe className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{data.stats.sources_processed}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {data.stats.sources_processed === 0 ? "No sources processed" : "Unique sources"}
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-xl bg-card/80 backdrop-blur-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Processing Time</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{data.stats.avg_processing_time}s</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {data.stats.avg_processing_time === 0 ? "No completed jobs" : "Per extraction job"}
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Content Types and Team Distribution */}
        {data &&
          (Object.keys(data.stats.content_types).length > 0 ||
            Object.keys(data.stats.team_distribution).length > 0) && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Content Types */}
              {Object.keys(data.stats.content_types).length > 0 && (
                <Card className="border-0 shadow-xl bg-card/80 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="text-xl">Content Types</CardTitle>
                    <CardDescription>Distribution by content type</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
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

              {/* Team Distribution */}
              {Object.keys(data.stats.team_distribution).length > 0 && (
                <Card className="border-0 shadow-xl bg-card/80 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="text-xl">Team Activity</CardTitle>
                    <CardDescription>Content by team</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                      {Object.entries(data.stats.team_distribution)
                        .sort(([, a], [, b]) => b - a)
                        .slice(0, 10)
                        .map(([teamId, count]) => (
                          <div key={teamId} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                            <div className="flex items-center space-x-3">
                              <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                                <Users className="h-4 w-4 text-blue-600" />
                              </div>
                              <span className="font-medium text-sm">{teamId}</span>
                            </div>
                            <Badge variant="secondary">{count} items</Badge>
                          </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

        {/* Recent Activity */}
        <Tabs defaultValue="items" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 h-12">
            <TabsTrigger value="items" className="h-10">
              Recent Items ({Math.min(data?.recent_items?.length || 0, 15)})
            </TabsTrigger>
            <TabsTrigger value="jobs" className="h-10">
              Extraction Jobs ({allJobs.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="items">
            <Card className="border-0 shadow-xl bg-card/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-xl">Recently Extracted Content</CardTitle>
                <CardDescription>Latest 15 items from all teams</CardDescription>
              </CardHeader>
              <CardContent>
                {data && data.recent_items.length > 0 ? (
                  <Table key={`items-${data.recent_items.length}-${data.last_updated}`}>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Team</TableHead>
                        <TableHead>Author</TableHead>
                        <TableHead>Words</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.recent_items.slice(0, 15).map((item) => (
                        <TableRow key={`${item.id}-${item.extracted_at}`}>
                          <TableCell className="font-medium max-w-xs">
                            <div className="truncate" title={item.title}>
                              {item.title}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">{item.content_type}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">
                              {item.team_id}
                            </Badge>
                          </TableCell>
                          <TableCell>{item.author}</TableCell>
                          <TableCell>{item.word_count.toLocaleString()}</TableCell>
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
                  <div className="text-center py-12 text-muted-foreground">
                    <FileText className="h-16 w-16 mx-auto mb-4 opacity-30" />
                    <h3 className="text-lg font-semibold mb-2">No Content Extracted Yet</h3>
                    <p className="mb-4">Start by extracting content from URLs or uploading PDF files.</p>
                    <Button onClick={() => (window.location.href = "/")} variant="outline">
                      <Globe className="h-4 w-4 mr-2" />
                      Start Extracting
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="jobs">
            <Card className="border-0 shadow-xl bg-card/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-xl">Extraction Jobs</CardTitle>
                <CardDescription>Processing history from all teams ({allJobs.length} loaded)</CardDescription>
              </CardHeader>
              <CardContent>
                {allJobs.length > 0 ? (
                  <div className="space-y-4">
                    <Table key={`jobs-${allJobs.length}-${data?.last_updated}`}>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Source</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Team</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Progress</TableHead>
                          <TableHead>Items</TableHead>
                          <TableHead>Time</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {allJobs.map((job) => (
                          <TableRow key={`${job.id}-${job.updated_at}`}>
                            <TableCell className="font-medium max-w-xs">
                              <div className="truncate" title={job.source_identifier}>
                                {job.source_identifier}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{job.job_type.toUpperCase()}</Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-xs">
                                {job.team_id}
                              </Badge>
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
                            <TableCell>{job.items_extracted || 0}</TableCell>
                            <TableCell>{job.processing_time ? `${job.processing_time}s` : "-"}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>

                    {/* Load More Button */}
                    {!allJobsLoaded && (
                      <div className="flex justify-center pt-4">
                        <Button
                          onClick={loadMoreJobs}
                          variant="outline"
                          size="lg"
                          disabled={loadingMoreJobs}
                          className="px-8"
                        >
                          {loadingMoreJobs ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Loading More...
                            </>
                          ) : (
                            <>
                              <Activity className="h-4 w-4 mr-2" />
                              Load More Jobs
                            </>
                          )}
                        </Button>
                      </div>
                    )}

                    {allJobsLoaded && allJobs.length > 15 && (
                      <div className="text-center pt-4">
                        <p className="text-sm text-muted-foreground">
                          All extraction jobs loaded ({allJobs.length} total)
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <Activity className="h-16 w-16 mx-auto mb-4 opacity-30" />
                    <h3 className="text-lg font-semibold mb-2">No Extraction Jobs Yet</h3>
                    <p className="mb-4">Extraction jobs will appear here once you start processing content.</p>
                    <Button onClick={() => (window.location.href = "/")} variant="outline">
                      <Globe className="h-4 w-4 mr-2" />
                      Start Extracting
                    </Button>
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
