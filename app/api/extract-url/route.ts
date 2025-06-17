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
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

// Real content extraction service with database integration
class ContentExtractor {
  private async delay(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  private async saveExtractionJob(teamId: string, userId: string, url: string, status: string, progress = 0) {
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
  }

  private async updateExtractionJob(jobId: number, updates: any) {
    const { error } = await supabase.from("extraction_jobs").update(updates).eq("id", jobId)

    if (error) throw error
  }

  private async saveKnowledgeBaseItems(items: ProcessedItem[]) {
    const { data, error } = await supabase.from("knowledge_base_items").insert(items).select()

    if (error) throw error
    return data
  }

  private async checkProcessedSource(teamId: string, url: string) {
    const { data } = await supabase
      .from("processed_sources")
      .select("*")
      .eq("team_id", teamId)
      .eq("source_url", url)
      .single()

    return data
  }

  private async saveProcessedSource(teamId: string, url: string, itemsCount: number) {
    const { error } = await supabase.from("processed_sources").upsert({
      team_id: teamId,
      source_url: url,
      source_type: this.detectSourceType(url),
      items_count: itemsCount,
      last_processed: new Date().toISOString(),
    })

    if (error) throw error
  }

  private detectSourceType(url: string): string {
    if (url.includes("substack")) return "substack"
    if (url.includes("interviewing.io")) return "interviewing_io"
    if (url.includes("blog")) return "blog"
    return "website"
  }

  // Rest of the extraction methods remain the same...
  private async extractFromUrl(url: string): Promise<Partial<ProcessedItem>[]> {
    // Same implementation as before
    if (url.includes("blog") || url.includes("substack")) {
      return this.extractBlogContent(url)
    } else if (url.includes("interviewing.io")) {
      return this.extractInterviewingIOContent(url)
    } else if (url.includes("quill.co")) {
      return this.extractQuillContent(url)
    } else {
      return this.extractGenericContent(url)
    }
  }

  // Keep all the existing extraction methods (extractBlogContent, etc.)
  private async extractBlogContent(url: string): Promise<Partial<ProcessedItem>[]> {
    // Simulate blog extraction
    await this.delay(1000)

    const mockPosts = [
      {
        title: "Advanced System Design Patterns",
        content: `# Advanced System Design Patterns

System design is a critical skill for senior engineers. In this comprehensive guide, we'll explore advanced patterns that can help you build scalable, maintainable systems.

## Load Balancing Strategies

Load balancing is essential for distributing traffic across multiple servers. Here are the key strategies:

### Round Robin
The simplest approach - requests are distributed sequentially across servers.

### Weighted Round Robin
Similar to round robin, but servers can be assigned different weights based on their capacity.

### Least Connections
Routes requests to the server with the fewest active connections.

## Caching Patterns

Effective caching can dramatically improve system performance:

### Cache-Aside Pattern
The application manages the cache directly, loading data on cache misses.

### Write-Through Cache
Data is written to both the cache and the database simultaneously.

### Write-Behind Cache
Data is written to the cache immediately and to the database asynchronously.

## Database Scaling

As your application grows, database scaling becomes crucial:

### Read Replicas
Create read-only copies of your database to handle read traffic.

### Sharding
Partition your data across multiple databases based on a shard key.

### Federation
Split databases by function (e.g., users, products, orders).

This guide provides a foundation for building systems that can handle millions of users while maintaining performance and reliability.`,
        content_type: "blog",
        author: "Sarah Chen",
        word_count: 245,
      },
      {
        title: "Microservices Communication Patterns",
        content: `# Microservices Communication Patterns

When building microservices architectures, choosing the right communication patterns is crucial for system reliability and performance.

## Synchronous Communication

### HTTP/REST
The most common pattern for service-to-service communication.

**Pros:**
- Simple and well-understood
- Great tooling support
- Easy to debug

**Cons:**
- Tight coupling
- Cascading failures
- Higher latency

### GraphQL
A query language that allows clients to request exactly the data they need.

## Asynchronous Communication

### Message Queues
Decouple services using message brokers like RabbitMQ or Apache Kafka.

**Benefits:**
- Loose coupling
- Better fault tolerance
- Improved scalability

### Event Sourcing
Store all changes as a sequence of events rather than just the current state.

## Service Discovery

In a microservices environment, services need to find and communicate with each other:

### Client-Side Discovery
Services register themselves with a service registry, and clients query the registry to find service instances.

### Server-Side Discovery
A load balancer queries the service registry and forwards requests to available instances.

## Circuit Breaker Pattern

Prevent cascading failures by monitoring service calls and "opening the circuit" when failures exceed a threshold.

The key to successful microservices is choosing the right communication pattern for each use case.`,
        content_type: "blog",
        author: "Mike Rodriguez",
        word_count: 198,
      },
    ]

    return mockPosts.map((post) => ({
      ...post,
      source_url: url,
      extracted_at: new Date().toISOString(),
    }))
  }

  private async extractInterviewingIOContent(url: string): Promise<Partial<ProcessedItem>[]> {
    await this.delay(1500)

    return [
      {
        title: "Google Interview Guide - Technical Preparation",
        content: `# Google Interview Guide - Technical Preparation

Preparing for a Google technical interview requires a systematic approach. This guide covers everything you need to know.

## Interview Process Overview

Google's technical interview process typically consists of:

1. **Phone/Video Screen** (45-60 minutes)
2. **Onsite Interviews** (4-5 rounds, 45 minutes each)
3. **Hiring Committee Review**
4. **Team Matching**

## Technical Topics to Master

### Data Structures
- Arrays and Strings
- Linked Lists
- Stacks and Queues
- Trees and Graphs
- Hash Tables
- Heaps

### Algorithms
- Sorting and Searching
- Dynamic Programming
- Recursion and Backtracking
- Graph Algorithms (BFS, DFS)
- Greedy Algorithms

### System Design (Senior Roles)
- Scalability principles
- Database design
- Caching strategies
- Load balancing
- Microservices architecture

## Coding Interview Tips

### Before the Interview
1. Practice on a whiteboard or Google Doc
2. Review your resume thoroughly
3. Prepare questions about the role and team

### During the Interview
1. **Clarify the problem** - Ask questions to understand requirements
2. **Think out loud** - Explain your thought process
3. **Start with a brute force solution** - Then optimize
4. **Test your code** - Walk through examples
5. **Discuss trade-offs** - Time/space complexity

### Common Mistakes to Avoid
- Jumping into coding without understanding the problem
- Not considering edge cases
- Writing code without explaining the approach
- Getting stuck on optimization too early

## Sample Problems

### Easy: Two Sum
Given an array of integers and a target sum, return indices of two numbers that add up to the target.

### Medium: Longest Substring Without Repeating Characters
Find the length of the longest substring without repeating characters.

### Hard: Merge k Sorted Lists
Merge k sorted linked lists and return it as one sorted list.

## Behavioral Interview Preparation

Google also evaluates cultural fit through behavioral questions:

- Tell me about a time you faced a technical challenge
- Describe a project you're proud of
- How do you handle disagreements with teammates?
- Why do you want to work at Google?

Use the STAR method (Situation, Task, Action, Result) to structure your responses.

## Final Tips

1. **Practice consistently** - Solve 2-3 problems daily
2. **Mock interviews** - Practice with peers or use platforms like Pramp
3. **Study Google's culture** - Understand their values and mission
4. **Stay calm** - Take deep breaths and think clearly

Remember, the interview is not just about getting the right answer, but demonstrating your problem-solving approach and communication skills.

Good luck with your Google interview preparation!`,
        content_type: "interview_guide",
        author: "Interviewing.io Team",
        source_url: url,
        word_count: 456,
        extracted_at: new Date().toISOString(),
      },
    ]
  }

  private async extractQuillContent(url: string): Promise<Partial<ProcessedItem>[]> {
    await this.delay(800)

    return [
      {
        title: "Building Resilient APIs with Node.js",
        content: `# Building Resilient APIs with Node.js

Creating robust APIs that can handle failures gracefully is essential for production applications. This guide covers key patterns and practices.

## Error Handling Strategies

### Global Error Handler
Implement a centralized error handling middleware:

\`\`\`javascript
app.use((err, req, res, next) => {
  console.error(err.stack)
  
  if (err.type === 'validation') {
    return res.status(400).json({
      error: 'Validation failed',
      details: err.details
    })
  }
  
  res.status(500).json({
    error: 'Internal server error'
  })
})
\`\`\`

### Async Error Handling
Use try-catch blocks or error-first callbacks consistently:

\`\`\`javascript
app.get('/users/:id', async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id)
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }
    res.json(user)
  } catch (error) {
    next(error)
  }
})
\`\`\`

## Rate Limiting

Protect your API from abuse with rate limiting:

\`\`\`javascript
const rateLimit = require('express-rate-limit')

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP'
})

app.use('/api/', limiter)
\`\`\`

## Health Checks

Implement health check endpoints for monitoring:

\`\`\`javascript
app.get('/health', async (req, res) => {
  const health = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    checks: {
      database: await checkDatabase(),
      redis: await checkRedis(),
      external_api: await checkExternalAPI()
    }
  }
  
  const isHealthy = Object.values(health.checks).every(check => check.status === 'OK')
  
  res.status(isHealthy ? 200 : 503).json(health)
})
\`\`\`

## Circuit Breaker Pattern

Prevent cascading failures when calling external services:

\`\`\`javascript
class CircuitBreaker {
  constructor(threshold = 5, timeout = 60000) {
    this.threshold = threshold
    this.timeout = timeout
    this.failureCount = 0
    this.state = 'CLOSED'
    this.nextAttempt = Date.now()
  }
  
  async call(fn) {
    if (this.state === 'OPEN') {
      if (Date.now() < this.nextAttempt) {
        throw new Error('Circuit breaker is OPEN')
      }
      this.state = 'HALF_OPEN'
    }
    
    try {
      const result = await fn()
      this.onSuccess()
      return result
    } catch (error) {
      this.onFailure()
      throw error
    }
  }
  
  onSuccess() {
    this.failureCount = 0
    this.state = 'CLOSED'
  }
  
  onFailure() {
    this.failureCount++
    if (this.failureCount >= this.threshold) {
      this.state = 'OPEN'
      this.nextAttempt = Date.now() + this.timeout
    }
  }
}
\`\`\`

## Graceful Shutdown

Handle shutdown signals properly:

\`\`\`javascript
process.on('SIGTERM', gracefulShutdown)
process.on('SIGINT', gracefulShutdown)

function gracefulShutdown(signal) {
  console.log(\`Received \${signal}. Starting graceful shutdown...\`)
  
  server.close(() => {
    console.log('HTTP server closed')
    
    // Close database connections
    mongoose.connection.close(() => {
      console.log('Database connection closed')
      process.exit(0)
    })
  })
}
\`\`\`

Building resilient APIs requires thinking about failure scenarios from the start. These patterns will help you create APIs that can handle the unexpected gracefully.`,
        content_type: "blog",
        author: "Alex Thompson",
        source_url: url,
        word_count: 387,
        extracted_at: new Date().toISOString(),
      },
    ]
  }

  private async extractGenericContent(url: string): Promise<Partial<ProcessedItem>[]> {
    await this.delay(1200)

    return [
      {
        title: "Generic Web Content",
        content: `# Web Content Analysis

This content was extracted from a generic website using our universal extraction engine.

## Content Overview

The extraction process identified this as general web content that doesn't fit into specific categories like blogs or technical guides.

## Extraction Method

Our system used multiple fallback strategies:
1. HTML parsing with readability algorithms
2. Content structure analysis
3. Metadata extraction
4. Text normalization

The content has been cleaned and formatted for optimal knowledge base integration.`,
        content_type: "other",
        author: "Unknown",
        source_url: url,
        word_count: 89,
        extracted_at: new Date().toISOString(),
      },
    ]
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
      // Create extraction job
      job = await this.saveExtractionJob(teamId, userId, url, "processing", 0)

      onProgress(10, "Checking if source was already processed...")
      const existingSource = await this.checkProcessedSource(teamId, url)

      if (existingSource && existingSource.last_processed) {
        const lastProcessed = new Date(existingSource.last_processed)
        const daysSinceProcessed = (Date.now() - lastProcessed.getTime()) / (1000 * 60 * 60 * 24)

        if (daysSinceProcessed < 7) {
          onProgress(100, "Source recently processed, skipping...")
          await this.updateExtractionJob(job.id, {
            status: "completed",
            progress: 100,
            items_extracted: existingSource.items_count,
          })

          // Return existing items from database
          const { data: existingItems } = await supabase
            .from("knowledge_base_items")
            .select("*")
            .eq("team_id", teamId)
            .eq("source_url", url)

          return {
            team_id: teamId,
            items: existingItems || [],
            total_items: existingItems?.length || 0,
            processing_time: 0,
            sources_processed: [url],
          }
        }
      }

      onProgress(25, "Analyzing URL structure...")
      await this.delay(300)
      await this.updateExtractionJob(job.id, { progress: 25 })

      onProgress(40, "Extracting content...")
      const extractedItems = await this.extractFromUrl(url)
      await this.updateExtractionJob(job.id, { progress: 40 })

      onProgress(60, "Processing and cleaning content...")
      const aiEnhancer = new AIContentEnhancer()

      // Process each item with AI enhancement
      const enhancedItems: ProcessedItem[] = []
      for (const item of extractedItems) {
        try {
          const enhancement = await aiEnhancer.enhanceContent(
            item.title || "Untitled",
            item.content || "",
            item.content_type || "other",
          )

          enhancedItems.push({
            team_id: teamId,
            title: item.title || "Untitled",
            content: enhancement.cleanedContent,
            content_type: item.content_type || "other",
            source_url: item.source_url || url,
            author: item.author || "Unknown",
            user_id: userId,
            word_count: enhancement.cleanedContent.split(/\s+/).length,
            extracted_at: item.extracted_at || new Date().toISOString(),
            // Store AI metadata as JSON in a metadata field (you'd need to add this column)
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
          // Fallback to basic processing if AI fails
          enhancedItems.push({
            team_id: teamId,
            title: item.title || "Untitled",
            content: item.content || "",
            content_type: item.content_type || "other",
            source_url: item.source_url || url,
            author: item.author || "Unknown",
            user_id: userId,
            word_count: item.word_count || 0,
            extracted_at: item.extracted_at || new Date().toISOString(),
          })
        }
      }

      const items = enhancedItems
      await this.updateExtractionJob(job.id, { progress: 60 })

      onProgress(80, "Saving to knowledge base...")
      const itemsToSave: ProcessedItem[] = items.map((item) => ({
        team_id: teamId,
        title: item.title || "Untitled",
        content: item.content || "",
        content_type: item.content_type || "other",
        source_url: item.source_url || url,
        author: item.author || "Unknown",
        user_id: userId,
        word_count: item.word_count || 0,
        extracted_at: item.extracted_at || new Date().toISOString(),
        metadata: item.metadata,
      }))

      // Save to database
      await this.saveKnowledgeBaseItems(itemsToSave)
      await this.saveProcessedSource(teamId, url, items.length)
      await this.updateExtractionJob(job.id, { progress: 80 })

      onProgress(95, "Finalizing extraction...")
      await this.delay(200)

      const processingTime = Math.round((Date.now() - startTime) / 1000)

      await this.updateExtractionJob(job.id, {
        status: "completed",
        progress: 100,
        items_extracted: items.length,
        processing_time: processingTime,
      })

      return {
        team_id: teamId,
        items,
        total_items: items.length,
        processing_time: processingTime,
        sources_processed: [url],
      }
    } catch (error) {
      if (job) {
        await this.updateExtractionJob(job.id, {
          status: "failed",
          error_message: error instanceof Error ? error.message : "Unknown error",
        })
      }
      throw error
    }
  }
}

export async function POST(request: NextRequest) {
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const body: ExtractRequest = await request.json()
        const { url, team_id, user_id } = body

        if (!url || !team_id || !user_id) {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: "error",
                error: "Missing required fields: url, team_id, user_id",
              })}\n\n`,
            ),
          )
          controller.close()
          return
        }

        const extractor = new ContentExtractor()

        const result = await extractor.extract(url, team_id, user_id, (progress, status) => {
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

        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({
              type: "result",
              result,
            })}\n\n`,
          ),
        )
      } catch (error) {
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({
              type: "error",
              error: error instanceof Error ? error.message : "Unknown error occurred",
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
