# ContextCrafter - Universal Content Ingestion Pipeline

A robust, scalable content ingestion system that transforms any content source into structured knowledge base format. Built for production use with enterprise-grade reliability and Apple/Google-level user experience.

## 🚀 Features

### Universal Content Extraction

- **Multi-source Support**: Blogs, websites, PDFs, Substack, technical documentation
- **Intelligent Fallbacks**: Multiple extraction strategies with automatic failover
- **Smart Content Detection**: Automatically identifies content type and structure
- **Chapter-aware PDF Processing**: Intelligently splits books and documents

### Production-Ready Architecture

- **Scalable Design**: Built on Next.js 15 with modern React patterns
- **Real-time Processing**: Server-sent events for live progress updates
- **Error Resilience**: Comprehensive error handling and recovery
- **Database Integration**: PostgreSQL schema for knowledge base storage

### Enterprise UX

- **Clean Interface**: Apple/Google-inspired design system
- **Progress Tracking**: Real-time extraction progress with detailed status
- **Batch Processing**: Handle multiple sources efficiently
- **Export Options**: JSON download and clipboard integration

## 🏗️ Architecture

### Core Components

1. **Ingestion Pipeline**

   - URL Parser with site-type detection
   - Content Extractor with pluggable strategies
   - PDF Processor with chapter detection
   - Metadata Enrichment with AI fallbacks

2. **Smart Extractor Module**

   - Generic extractors: newspaper3k, readability, trafilatura
   - Specialized extractors: Substack, interviewing.io, technical blogs
   - Fallback hierarchy for maximum reliability
   - AI-powered content cleaning

3. **Normalization Layer**
   - Standardized JSON output format
   - Markdown content formatting
   - Metadata extraction and validation
   - Word count and content analysis

### Tech Stack

| Component          | Technology                                 |
| ------------------ | ------------------------------------------ |
| Frontend           | Next.js 15, React, TypeScript              |
| UI Framework       | Tailwind CSS, shadcn/ui                    |
| Backend            | Next.js API Routes, Server Actions         |
| Database           | PostgreSQL with optimized indexes          |
| Content Processing | Python scripts with PyMuPDF, BeautifulSoup |
| Deployment         | Vercel, Railway, or Docker                 |

## 📋 API Reference

### Extract URL Content

\`\`\`typescript
POST /api/extract-url
Content-Type: application/json

{
"url": "https://interviewing.io/blog",
"team_id": "aline123",
"user_id": "user_001"
}
\`\`\`

### Extract PDF Content

\`\`\`typescript
POST /api/extract-pdf
Content-Type: multipart/form-data

file: [PDF file]
team_id: "aline123"
user_id: "user_001"
\`\`\`

### Response Format

\`\`\`json
{
"team_id": "aline123",
"items": [
{
"title": "Advanced System Design Patterns",
"content": "# Advanced System Design Patterns\\n\\nSystem design is...",
"content_type": "blog",
"source_url": "https://example.com/article",
"author": "Sarah Chen",
"user_id": "user_001",
"word_count": 245,
"extracted_at": "2024-01-15T10:30:00Z"
}
],
"total_items": 15,
"processing_time": 8,
"sources_processed": ["https://interviewing.io/blog"]
}
\`\`\`

## 🛠️ Installation & Setup

### Local Development

1. **Clone and Install**
   \`\`\`bash
   git clone https://github.com/prajwalun/contextcrafter
   cd contextcrafter
   npm install
   \`\`\`

2. **Run Database Scripts**
   \`\`\`bash

   # Create tables

   psql $DATABASE_URL -f scripts/create-knowledge-base.sql

   # Seed sample data

   psql $DATABASE_URL -f scripts/seed-sample-data.sql
   \`\`\`

3. **Start Development Server**
   \`\`\`bash
   npm run dev
   \`\`\`

### Docker Deployment

\`\`\`dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package\*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
\`\`\`

## 🎯 Use Cases

### Technical Content Curation

- **Engineering Blogs**: Automatically ingest company engineering blogs
- **Documentation**: Extract and organize technical documentation
- **Research Papers**: Process academic papers and technical reports

### Knowledge Base Building

- **Customer Support**: Build comprehensive FAQ and help systems
- **Training Materials**: Organize educational content and courses
- **Company Wiki**: Centralize institutional knowledge

### Content Analysis

- **Competitive Intelligence**: Monitor competitor content and insights
- **Trend Analysis**: Track industry trends and emerging topics
- **Content Audit**: Analyze existing content for gaps and opportunities

## 🔧 Customization

### Adding New Extractors

\`\`\`python
class CustomExtractor(ContentExtractor):
def can_extract(self, url: str) -> bool:
return 'custom-site.com' in url.lower()

    def extract(self, url: str, html: str) -> List[ExtractedContent]:
        # Custom extraction logic
        return [ExtractedContent(...)]

\`\`\`

### Custom Content Types

\`\`\`sql
ALTER TABLE knowledge_base_items
DROP CONSTRAINT knowledge_base_items_content_type_check;

ALTER TABLE knowledge_base_items
ADD CONSTRAINT knowledge_base_items_content_type_check
CHECK (content_type IN ('blog', 'podcast_transcript', 'call_transcript',
'linkedin_post', 'reddit_comment', 'book',
'interview_guide', 'documentation', 'research_paper', 'other'));
\`\`\`

## 📊 Performance & Scaling

### Optimization Features

- **Concurrent Processing**: Parallel extraction for multiple sources
- **Caching Layer**: Redis integration for frequently accessed content
- **Rate Limiting**: Respectful crawling with configurable delays
- **Content Deduplication**: Automatic detection of duplicate content

### Monitoring & Analytics

- **Processing Metrics**: Track extraction success rates and performance
- **Content Analytics**: Word counts, content types, source analysis
- **Error Tracking**: Comprehensive logging and error reporting
- **Usage Statistics**: Team and user activity monitoring

### Code Standards

- TypeScript for type safety
- ESLint + Prettier for code formatting
- Jest for testing
- Conventional commits for git history
