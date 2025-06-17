# Production Deployment Guide

## 🚀 Quick Setup with Supabase

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for the project to be ready (2-3 minutes)
3. Go to Settings → API to get your keys:
   - `NEXT_PUBLIC_SUPABASE_URL`: Your project URL
   - `SUPABASE_SERVICE_ROLE_KEY`: Service role key (keep secret!)

### 2. Set Up Database Schema

1. In your Supabase dashboard, go to SQL Editor
2. Run the `scripts/create-knowledge-base.sql` script
3. Run the `scripts/seed-sample-data.sql` script for demo data

### 3. Configure Environment Variables

Create `.env.local` file:
\`\`\`env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
\`\`\`

### 4. Deploy to Vercel

\`\`\`bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard
# or use CLI:
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add SUPABASE_SERVICE_ROLE_KEY
\`\`\`

## 🔧 Alternative Database Options

### PostgreSQL (Self-hosted)
\`\`\`env
DATABASE_URL=postgresql://user:password@host:5432/database
\`\`\`

### Neon (Serverless Postgres)
\`\`\`env
DATABASE_URL=postgresql://user:password@host.neon.tech/database
\`\`\`

## 📊 Monitoring & Analytics

### Enable Row Level Security (RLS)
\`\`\`sql
-- Enable RLS on all tables
ALTER TABLE knowledge_base_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE extraction_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE processed_sources ENABLE ROW LEVEL SECURITY;

-- Create policies for team-based access
CREATE POLICY "Team members can view their items" ON knowledge_base_items
  FOR SELECT USING (team_id = current_setting('app.current_team_id'));

CREATE POLICY "Team members can insert their items" ON knowledge_base_items
  FOR INSERT WITH CHECK (team_id = current_setting('app.current_team_id'));
\`\`\`

### Performance Optimization
\`\`\`sql
-- Additional indexes for better performance
CREATE INDEX CONCURRENTLY idx_knowledge_base_search 
ON knowledge_base_items USING gin(to_tsvector('english', title || ' ' || content));

CREATE INDEX CONCURRENTLY idx_extraction_jobs_team_status 
ON extraction_jobs(team_id, status, created_at DESC);
\`\`\`

## 🔒 Security Best Practices

1. **API Keys**: Never expose service role keys in client-side code
2. **Rate Limiting**: Implement rate limiting for API endpoints
3. **Input Validation**: Validate all user inputs
4. **CORS**: Configure proper CORS settings
5. **HTTPS**: Always use HTTPS in production

## 📈 Scaling Considerations

### Database Scaling
- Use connection pooling (PgBouncer)
- Implement read replicas for heavy read workloads
- Consider partitioning large tables by team_id

### Application Scaling
- Use CDN for static assets
- Implement caching layer (Redis)
- Consider serverless functions for processing

### Processing Optimization
- Queue system for batch processing
- Background jobs for large extractions
- Parallel processing for multiple sources

## 🐳 Docker Deployment

\`\`\`dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /app
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
USER nextjs
EXPOSE 3000
ENV PORT 3000
CMD ["node", "server.js"]
\`\`\`

## 🔍 Troubleshooting

### Common Issues

1. **Database Connection Errors**
   - Check environment variables
   - Verify database URL format
   - Ensure database is accessible

2. **CORS Issues**
   - Configure Supabase CORS settings
   - Check API endpoint configurations

3. **Performance Issues**
   - Monitor database query performance
   - Check for missing indexes
   - Optimize large content processing

### Debugging

\`\`\`bash
# Check logs
vercel logs

# Local debugging
npm run dev
\`\`\`

## 📞 Support

- Documentation: [docs.contextcrafter.com](https://docs.contextcrafter.com)
- Issues: [GitHub Issues](https://github.com/your-repo/issues)
- Email: support@contextcrafter.com
\`\`\`
