import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

function validateEnvironmentVariables() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  console.log("🔍 Environment validation:")
  console.log("NEXT_PUBLIC_SUPABASE_URL exists:", !!supabaseUrl)
  console.log("SUPABASE_SERVICE_ROLE_KEY exists:", !!supabaseKey)

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Missing Supabase environment variables")
  }

  // Validate URL format
  try {
    new URL(supabaseUrl)
    console.log("✅ Supabase URL format is valid")
  } catch (error) {
    console.error("❌ Invalid Supabase URL format:", supabaseUrl)
    throw new Error(`Invalid Supabase URL format: ${supabaseUrl}`)
  }

  // Validate key format (should start with 'eyJ' for JWT)
  if (!supabaseKey.startsWith("eyJ")) {
    console.warn("⚠️ Supabase service role key doesn't look like a JWT token")
  }

  return { supabaseUrl, supabaseKey }
}

export async function GET(request: NextRequest) {
  console.log("📊 Dashboard API called at:", new Date().toISOString())

  // Get optional parameters for debugging
  const url = new URL(request.url)
  const forceRefresh = url.searchParams.get("force_refresh")
  const timestamp = url.searchParams.get("t")

  console.log("🔄 Force refresh:", forceRefresh)
  console.log("⏰ Timestamp:", timestamp)

  try {
    const databaseData = await getDatabaseData() // No team_id parameter
    console.log("✅ Using real database data - GLOBAL VIEW")

    return NextResponse.json(databaseData, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache, no-store, must-revalidate, max-age=0",
        Pragma: "no-cache",
        Expires: "0",
        "Last-Modified": new Date().toUTCString(),
        ETag: `"${Date.now()}"`,
      },
    })
  } catch (error) {
    console.error("❌ Dashboard API failed completely:", error)

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Dashboard data unavailable",
        database_connected: false,
        message: "Unable to fetch dashboard data. Please check your database connection.",
      },
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache, no-store, must-revalidate",
        },
      },
    )
  }
}

async function getDatabaseData() {
  console.log("🔍 Dashboard API: Fetching GLOBAL data from all teams")
  console.log("🕐 Request time:", new Date().toISOString())

  const { supabaseUrl, supabaseKey } = validateEnvironmentVariables()
  const supabase = createClient(supabaseUrl, supabaseKey)

  console.log("🧪 Testing Supabase connection...")
  const { data: testData, error: testError } = await supabase.from("knowledge_base_items").select("count").limit(1)

  if (testError) {
    console.error("❌ Supabase connection test failed:", testError)
    throw new Error(`Supabase connection failed: ${testError.message}`)
  }

  console.log("✅ Supabase connection successful!")

  // Get ALL items from ALL teams - GLOBAL VIEW
  console.log("📊 Fetching ALL knowledge base items from ALL teams")
  const { data: items, error: itemsError } = await supabase
    .from("knowledge_base_items")
    .select("*")
    // NO team_id filter - get everything
    .order("extracted_at", { ascending: false })
    .limit(100) // Increased limit for global view

  if (itemsError) {
    console.error("❌ Failed to fetch items:", itemsError)
    throw new Error(`Failed to fetch items: ${itemsError.message}`)
  }

  console.log("📋 Total items found across ALL teams:", items?.length || 0)
  if (items && items.length > 0) {
    console.log("📝 Most recent item:", {
      id: items[0].id,
      title: items[0].title?.substring(0, 50) + "...",
      content_type: items[0].content_type,
      team_id: items[0].team_id,
      extracted_at: items[0].extracted_at,
    })
  }

  // Get ALL extraction jobs from ALL teams - GLOBAL VIEW
  console.log("📊 Fetching ALL extraction jobs from ALL teams")
  const { data: jobs, error: jobsError } = await supabase
    .from("extraction_jobs")
    .select("*")
    // NO team_id filter - get everything
    .order("created_at", { ascending: false })
    .limit(100) // Increased limit for global view

  if (jobsError) {
    console.error("❌ Failed to fetch jobs:", jobsError)
    throw new Error(`Failed to fetch jobs: ${jobsError.message}`)
  }

  console.log("📋 Total jobs found across ALL teams:", jobs?.length || 0)
  if (jobs && jobs.length > 0) {
    console.log("📝 Most recent job:", {
      id: jobs[0].id,
      job_type: jobs[0].job_type,
      status: jobs[0].status,
      team_id: jobs[0].team_id,
      created_at: jobs[0].created_at,
    })
  }

  // Calculate GLOBAL stats
  const totalItems = items?.length || 0
  const totalWords = items?.reduce((sum, item) => sum + (item.word_count || 0), 0) || 0
  const contentTypes =
    items?.reduce(
      (acc, item) => {
        acc[item.content_type] = (acc[item.content_type] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    ) || {}

  // Calculate unique sources across all teams
  const uniqueSources = new Set(items?.map((item) => item.source_url).filter(Boolean)).size

  // Calculate team distribution
  const teamDistribution =
    items?.reduce(
      (acc, item) => {
        acc[item.team_id] = (acc[item.team_id] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    ) || {}

  const avgProcessingTime = jobs?.length
    ? Math.round(jobs.reduce((sum, job) => sum + (job.processing_time || 0), 0) / jobs.length)
    : 0

  const result = {
    stats: {
      total_items: totalItems,
      total_words: totalWords,
      sources_processed: uniqueSources,
      avg_processing_time: avgProcessingTime,
      content_types: contentTypes,
      team_distribution: teamDistribution, // New: show which teams are active
      total_teams: Object.keys(teamDistribution).length, // New: total number of teams
    },
    recent_items: items?.slice(0, 50) || [], // Show more items for global view
    recent_jobs: jobs?.slice(0, 50) || [], // Show more jobs for global view
    database_connected: true,
    last_updated: new Date().toISOString(),
    view_type: "global", // Indicate this is a global view
  }

  console.log("📈 Final GLOBAL dashboard stats:", {
    totalItems: result.stats.total_items,
    totalWords: result.stats.total_words,
    sourcesProcessed: result.stats.sources_processed,
    totalTeams: result.stats.total_teams,
    contentTypes: Object.keys(result.stats.content_types).length,
    recentItems: result.recent_items.length,
    recentJobs: result.recent_jobs.length,
  })

  return result
}
