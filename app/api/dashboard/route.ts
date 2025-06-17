import { type NextRequest, NextResponse } from "next/server"

// Mock data that always works
const getMockData = () => ({
  stats: {
    total_items: 12,
    total_words: 8450,
    sources_processed: 4,
    avg_processing_time: 6,
    content_types: {
      blog: 8,
      interview_guide: 2,
      book: 2,
    },
  },
  recent_items: [
    {
      id: 1,
      title: "Advanced System Design Patterns",
      content_type: "blog",
      author: "Sarah Chen",
      word_count: 245,
      source_url: "https://example.com/blog/system-design",
      extracted_at: new Date().toISOString(),
    },
    {
      id: 2,
      title: "Google Interview Guide - Technical Preparation",
      content_type: "interview_guide",
      author: "Interviewing.io Team",
      word_count: 456,
      extracted_at: new Date().toISOString(),
    },
    {
      id: 3,
      title: "Microservices Communication Patterns",
      content_type: "blog",
      author: "Mike Rodriguez",
      word_count: 198,
      source_url: "https://example.com/blog/microservices",
      extracted_at: new Date().toISOString(),
    },
  ],
  recent_jobs: [
    {
      id: 1,
      job_type: "url",
      source_identifier: "https://interviewing.io/blog",
      status: "completed",
      progress: 100,
      items_extracted: 5,
      processing_time: 8,
      created_at: new Date().toISOString(),
    },
    {
      id: 2,
      job_type: "pdf",
      source_identifier: "advanced-algorithms.pdf",
      status: "completed",
      progress: 100,
      items_extracted: 7,
      processing_time: 12,
      created_at: new Date().toISOString(),
    },
  ],
})

export async function GET(request: NextRequest) {
  // Always return mock data for now to ensure the dashboard works
  console.log("Dashboard API called - returning mock data")

  try {
    const mockData = getMockData()

    return NextResponse.json(mockData, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    })
  } catch (error) {
    // Even if mock data fails somehow, return a minimal response
    console.error("Even mock data failed:", error)

    return NextResponse.json(
      {
        stats: {
          total_items: 0,
          total_words: 0,
          sources_processed: 0,
          avg_processing_time: 0,
          content_types: {},
        },
        recent_items: [],
        recent_jobs: [],
      },
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      },
    )
  }
}
