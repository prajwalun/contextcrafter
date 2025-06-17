import type { NextRequest } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { AIContentEnhancer } from "@/lib/ai-enhancer"

interface ExtractRequest {
  url: string
  team_id: string
  user_id: string
}

interface ProcessedItem {
  title: string
  content: string
  content_type: string
  source_url?: string
  author: string
  user_id: string
  word_count: number
  extracted_at: string
  team_id: string
  metadata?: string
}

interface ProcessingResult {
  team_id: string
  items: ProcessedItem[]
  total_items: number
  processing_time: number
  sources_processed: string[]
}

// Database client setup
function createSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.error("❌ Supabase environment variables not configured")
    throw new Error("Database not configured - missing Supabase environment variables")
  }

  try {
    return createClient(supabaseUrl, supabaseKey)
  } catch (error) {
    console.error("❌ Failed to create Supabase client:", error)
    throw new Error("Failed to connect to database")
  }
}

// Real content extraction service
class ContentExtractor {
  private async delay(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  private async saveExtractionJob(teamId: string, userId: string, url: string, status: string, progress = 0) {
    const supabase = createSupabaseClient()

    try {
      const { data, error } = await supabase
        .from("extraction_jobs")
        .insert({
          team_id: teamId,
          user_id: userId,
          job_type: "url",
          source_identifier: url,
          status,
          progress,
        })
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error("❌ Failed to save extraction job:", error)
      throw error
    }
  }

  private async updateExtractionJob(jobId: number, updates: any) {
    const supabase = createSupabaseClient()

    try {
      const { error } = await supabase.from("extraction_jobs").update(updates).eq("id", jobId)
      if (error) throw error
    } catch (error) {
      console.error("❌ Failed to update extraction job:", error)
      throw error
    }
  }

  private async saveKnowledgeBaseItems(items: ProcessedItem[]) {
    const supabase = createSupabaseClient()

    try {
      console.log("💾 Saving", items.length, "items to knowledge base...")

      // Remove metadata field if it doesn't exist in the database
      const itemsToSave = items.map((item) => {
        const { metadata, ...itemWithoutMetadata } = item
        return itemWithoutMetadata
      })

      const { data, error } = await supabase.from("knowledge_base_items").insert(itemsToSave).select()

      if (error) {
        console.error("❌ Database insert error:", error)
        throw error
      }
      console.log("✅ Knowledge base items saved:", data?.length)
      return data
    } catch (error) {
      console.error("❌ Failed to save knowledge base items:", error)
      throw error
    }
  }

  private async realWebScraping(url: string): Promise<Partial<ProcessedItem>[]> {
    console.log("🌐 Starting real web scraping for:", url)

    try {
      // Use a real web scraping service or library
      // For now, I'll simulate a real extraction that can fail
      const response = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; ContextCrafter/1.0; +https://contextcrafter.com/bot)",
        },
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch URL: ${response.status} ${response.statusText}`)
      }

      const html = await response.text()

      if (!html || html.length < 100) {
        throw new Error("URL returned empty or insufficient content")
      }

      // Basic HTML parsing (in production, use a proper library like Cheerio)
      const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
      const title = titleMatch ? titleMatch[1].trim() : "Extracted Content"

      // Extract text content (basic implementation)
      const textContent = html
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim()

      if (textContent.length < 200) {
        throw new Error("Extracted content is too short - may not be a valid article")
      }

      // Determine content type based on URL
      let contentType = "article"
      if (url.includes("blog")) contentType = "blog"
      if (url.includes("substack")) contentType = "newsletter"
      if (url.includes("docs")) contentType = "documentation"

      const wordCount = textContent.split(/\s+/).length

      return [
        {
          title: title,
          content: textContent.substring(0, 5000), // Limit content length
          content_type: contentType,
          source_url: url,
          author: "Web Author", // In production, extract from meta tags
          word_count: wordCount,
          extracted_at: new Date().toISOString(),
        },
      ]
    } catch (error) {
      console.error("❌ Real web scraping failed:", error)
      throw new Error(`Web scraping failed: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  async extract(
    url: string,
    teamId: string,
    userId: string,
    onProgress: (progress: number, status: string) => void,
  ): Promise<ProcessingResult> {
    const startTime = Date.now()
    let job: any

    try {
      console.log("🚀 Starting REAL URL extraction for:", url)
      console.log("📋 Parameters:", { teamId, userId })

      // Validate URL
      try {
        new URL(url)
      } catch {
        throw new Error("Invalid URL format")
      }

      // Create extraction job
      onProgress(5, "Creating extraction job...")
      job = await this.saveExtractionJob(teamId, userId, url, "processing", 5)

      onProgress(15, "Fetching content from URL...")
      await this.delay(500)
      await this.updateExtractionJob(job.id, { progress: 15 })

      onProgress(30, "Extracting and parsing content...")
      const extractedItems = await this.realWebScraping(url)
      await this.updateExtractionJob(job.id, { progress: 30 })

      if (!extractedItems || extractedItems.length === 0) {
        throw new Error("No content could be extracted from the URL")
      }

      onProgress(50, "Processing content with AI...")
      const aiEnhancer = new AIContentEnhancer()

      // Process each item with AI enhancement
      const enhancedItems: ProcessedItem[] = []
      for (const item of extractedItems) {
        try {
          const enhancement = await aiEnhancer.enhanceContent(
            item.title || "Untitled",
            item.content || "",
            item.content_type || "article",
          )

          enhancedItems.push({
            team_id: teamId,
            title: item.title || "Untitled",
            content: enhancement.cleanedContent,
            content_type: item.content_type || "article",
            source_url: item.source_url || url,
            author: item.author || "Unknown",
            user_id: userId,
            word_count: enhancement.cleanedContent.split(/\s+/).length,
            extracted_at: item.extracted_at || new Date().toISOString(),
            metadata: JSON.stringify({
              summary: enhancement.extractedMetadata.summary,
              keyTopics: enhancement.extractedMetadata.keyTopics,
              difficulty: enhancement.extractedMetadata.difficulty,
              estimatedReadTime: enhancement.extractedMetadata.estimatedReadTime,
              suggestedTags: enhancement.suggestedTags,
              aiEnhanced: aiEnhancer.isAIEnabled(),
            }),
          })
        } catch (error) {
          console.warn("⚠️ AI enhancement failed, using basic processing:", error)
          // Fallback to basic processing if AI fails
          enhancedItems.push({
            team_id: teamId,
            title: item.title || "Untitled",
            content: item.content || "",
            content_type: item.content_type || "article",
            source_url: item.source_url || url,
            author: item.author || "Unknown",
            user_id: userId,
            word_count: item.word_count || 0,
            extracted_at: item.extracted_at || new Date().toISOString(),
          })
        }
      }

      await this.updateExtractionJob(job.id, { progress: 70 })

      onProgress(85, "Saving to knowledge base...")
      await this.saveKnowledgeBaseItems(enhancedItems)
      await this.updateExtractionJob(job.id, { progress: 85 })

      onProgress(95, "Finalizing extraction...")
      await this.delay(200)

      const processingTime = Math.round((Date.now() - startTime) / 1000)

      await this.updateExtractionJob(job.id, {
        status: "completed",
        progress: 100,
        items_extracted: enhancedItems.length,
        processing_time: processingTime,
      })

      const result = {
        team_id: teamId,
        items: enhancedItems,
        total_items: enhancedItems.length,
        processing_time: processingTime,
        sources_processed: [url],
      }

      console.log("🎉 URL extraction completed successfully!")
      console.log("📊 Final result:", {
        items: result.total_items,
        processingTime: result.processing_time + "s",
        totalWords: result.items.reduce((sum, item) => sum + item.word_count, 0),
      })

      // Trigger dashboard update
      console.log("🔔 Triggering dashboard update...")
      // This will be picked up by the dashboard's real-time updates

      return result
    } catch (error) {
      console.error("❌ URL extraction failed:", error)

      if (job) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error"
        console.log("📝 Marking job as failed:", job.id, errorMessage)
        await this.updateExtractionJob(job.id, {
          status: "failed",
          error_message: errorMessage,
        })
      }
      throw error
    }
  }
}

export async function POST(request: NextRequest) {
  console.log("🔍 Environment check:")
  console.log("OPENAI_API_KEY:", !!process.env.OPENAI_API_KEY)
  console.log("SUPABASE_URL:", !!process.env.NEXT_PUBLIC_SUPABASE_URL)
  console.log("SUPABASE_KEY:", !!process.env.SUPABASE_SERVICE_ROLE_KEY)

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const body: ExtractRequest = await request.json()
        const { url, team_id, user_id } = body

        console.log("🌐 URL extraction request:", { url, team_id, user_id })

        if (!url || !team_id || !user_id) {
          const errorMsg = "Missing required fields: url, team_id, user_id"
          console.error("❌", errorMsg)
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: "error",
                error: errorMsg,
              })}\n\n`,
            ),
          )
          controller.close()
          return
        }

        const extractor = new ContentExtractor()

        const result = await extractor.extract(url, team_id, user_id, (progress, status) => {
          console.log(`📊 Progress: ${progress}% - ${status}`)
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: "progress",
                progress,
                status,
              })}\n\n`,
            ),
          )
        })

        console.log("✅ URL extraction completed:", {
          totalItems: result.total_items,
          processingTime: result.processing_time,
        })

        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({
              type: "result",
              result,
            })}\n\n`,
          ),
        )
      } catch (error) {
        console.error("❌ URL extraction API error:", error)
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({
              type: "error",
              error: error instanceof Error ? error.message : "URL extraction failed",
            })}\n\n`,
          ),
        )
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  })
}
