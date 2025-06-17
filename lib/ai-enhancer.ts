import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"

interface ContentEnhancement {
  cleanedContent: string
  extractedMetadata: {
    summary: string
    keyTopics: string[]
    difficulty: "beginner" | "intermediate" | "advanced"
    estimatedReadTime: number
  }
  suggestedTags: string[]
}

export class AIContentEnhancer {
  private isEnabled: boolean

  constructor() {
    this.isEnabled = !!process.env.OPENAI_API_KEY
  }

  async enhanceContent(title: string, content: string, contentType: string): Promise<ContentEnhancement> {
    if (!this.isEnabled) {
      // Fallback to basic processing when AI is not available
      return this.basicEnhancement(title, content, contentType)
    }

    try {
      // AI-powered content cleaning and enhancement
      const { text: cleanedContent } = await generateText({
        model: openai("gpt-4o-mini"),
        system: `You are a content processing expert. Clean and format the provided content for a knowledge base:

1. Remove any navigation elements, ads, or irrelevant content
2. Fix formatting issues and improve readability
3. Ensure proper markdown structure
4. Keep all technical content and code examples intact
5. Return only the cleaned content, no explanations`,
        prompt: `Clean and format this ${contentType} content:

Title: ${title}

Content:
${content}`,
      })

      // Extract metadata using AI
      const { text: metadataJson } = await generateText({
        model: openai("gpt-4o-mini"),
        system: `You are a content analysis expert. Analyze the content and return a JSON object with:
- summary: A 2-3 sentence summary
- keyTopics: Array of 3-5 main topics/concepts
- difficulty: "beginner", "intermediate", or "advanced"
- estimatedReadTime: Reading time in minutes

Return only valid JSON, no explanations.`,
        prompt: `Analyze this content:

Title: ${title}
Content: ${cleanedContent.substring(0, 2000)}...`,
      })

      // Generate relevant tags
      const { text: tagsJson } = await generateText({
        model: openai("gpt-4o-mini"),
        system: `Generate 5-8 relevant tags for this content. Return as JSON array of strings. Focus on:
- Technical concepts
- Programming languages/frameworks
- Industry topics
- Skill levels

Return only a JSON array, no explanations.`,
        prompt: `Generate tags for: ${title}\n\nContent type: ${contentType}\n\nKey topics: ${content.substring(0, 500)}...`,
      })

      let extractedMetadata
      let suggestedTags

      try {
        extractedMetadata = JSON.parse(metadataJson)
      } catch {
        extractedMetadata = this.generateBasicMetadata(title, cleanedContent, contentType)
      }

      try {
        suggestedTags = JSON.parse(tagsJson)
      } catch {
        suggestedTags = this.generateBasicTags(title, contentType)
      }

      return {
        cleanedContent,
        extractedMetadata,
        suggestedTags,
      }
    } catch (error) {
      console.error("AI enhancement failed, falling back to basic processing:", error)
      return this.basicEnhancement(title, content, contentType)
    }
  }

  private basicEnhancement(title: string, content: string, contentType: string): ContentEnhancement {
    // Basic content cleaning without AI
    const cleanedContent = this.basicContentCleaning(content)

    return {
      cleanedContent,
      extractedMetadata: this.generateBasicMetadata(title, cleanedContent, contentType),
      suggestedTags: this.generateBasicTags(title, contentType),
    }
  }

  private basicContentCleaning(content: string): string {
    return (
      content
        // Remove excessive whitespace
        .replace(/\n\s*\n\s*\n/g, "\n\n")
        // Remove common navigation patterns
        .replace(/^(Home|About|Contact|Menu|Navigation)$/gm, "")
        // Clean up common artifacts
        .replace(/\[?\d+\]?\s*shares?/gi, "")
        .replace(/Click here to .*/gi, "")
        .replace(/Read more\.{3}/gi, "")
        .trim()
    )
  }

  private generateBasicMetadata(title: string, content: string, contentType: string) {
    const wordCount = content.split(/\s+/).length
    const estimatedReadTime = Math.ceil(wordCount / 200) // 200 words per minute

    // Basic topic extraction from title and content
    const keyTopics = this.extractBasicTopics(title + " " + content)

    // Determine difficulty based on content complexity
    const difficulty = this.determineDifficulty(content)

    return {
      summary: `${contentType} about ${title.toLowerCase()}. Contains ${wordCount} words covering various technical concepts.`,
      keyTopics,
      difficulty,
      estimatedReadTime,
    }
  }

  private extractBasicTopics(text: string): string[] {
    const commonTechTerms = [
      "javascript",
      "python",
      "react",
      "node",
      "api",
      "database",
      "algorithm",
      "system design",
      "microservices",
      "docker",
      "kubernetes",
      "aws",
      "cloud",
      "machine learning",
      "ai",
      "data",
      "security",
      "performance",
      "testing",
      "frontend",
      "backend",
      "fullstack",
      "devops",
      "architecture",
    ]

    const lowerText = text.toLowerCase()
    return commonTechTerms.filter((term) => lowerText.includes(term)).slice(0, 5)
  }

  private determineDifficulty(content: string): "beginner" | "intermediate" | "advanced" {
    const advancedTerms = ["architecture", "scalability", "optimization", "distributed", "microservices"]
    const intermediateTerms = ["framework", "library", "api", "database", "deployment"]

    const lowerContent = content.toLowerCase()
    const advancedCount = advancedTerms.filter((term) => lowerContent.includes(term)).length
    const intermediateCount = intermediateTerms.filter((term) => lowerContent.includes(term)).length

    if (advancedCount >= 2) return "advanced"
    if (intermediateCount >= 2) return "intermediate"
    return "beginner"
  }

  private generateBasicTags(title: string, contentType: string): string[] {
    const baseTags = [contentType]

    // Add tags based on title keywords
    const titleLower = title.toLowerCase()

    if (titleLower.includes("javascript") || titleLower.includes("js")) baseTags.push("JavaScript")
    if (titleLower.includes("python")) baseTags.push("Python")
    if (titleLower.includes("react")) baseTags.push("React")
    if (titleLower.includes("node")) baseTags.push("Node.js")
    if (titleLower.includes("system design")) baseTags.push("System Design")
    if (titleLower.includes("interview")) baseTags.push("Interview Prep")
    if (titleLower.includes("algorithm")) baseTags.push("Algorithms")
    if (titleLower.includes("api")) baseTags.push("API Development")

    return baseTags.slice(0, 6)
  }

  isAIEnabled(): boolean {
    return this.isEnabled
  }
}
