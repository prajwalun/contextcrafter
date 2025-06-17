import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

function createSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Missing Supabase environment variables")
  }

  return createClient(supabaseUrl, supabaseKey)
}

export async function GET(request: NextRequest) {
  console.log("📊 Jobs pagination API called")

  const url = new URL(request.url)
  const page = Number.parseInt(url.searchParams.get("page") || "1")
  const limit = Number.parseInt(url.searchParams.get("limit") || "15")
  const offset = (page - 1) * limit

  console.log("📄 Pagination params:", { page, limit, offset })

  try {
    const supabase = createSupabaseClient()

    // Get jobs with pagination - GLOBAL VIEW (no team filter)
    const {
      data: jobs,
      error: jobsError,
      count,
    } = await supabase
      .from("extraction_jobs")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)

    if (jobsError) {
      console.error("❌ Failed to fetch jobs:", jobsError)
      throw new Error(`Failed to fetch jobs: ${jobsError.message}`)
    }

    console.log("📋 Jobs fetched:", {
      page,
      jobsCount: jobs?.length || 0,
      totalCount: count,
      hasMore: (count || 0) > offset + limit,
    })

    return NextResponse.json({
      jobs: jobs || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        hasMore: (count || 0) > offset + limit,
        totalPages: Math.ceil((count || 0) / limit),
      },
      success: true,
    })
  } catch (error) {
    console.error("❌ Jobs pagination API failed:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to fetch jobs",
        jobs: [],
        pagination: { page, limit, total: 0, hasMore: false, totalPages: 0 },
        success: false,
      },
      { status: 500 },
    )
  }
}
