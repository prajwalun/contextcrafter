-- Create knowledge base tables for storing extracted content

-- Main knowledge base items table
CREATE TABLE IF NOT EXISTS knowledge_base_items (
    id SERIAL PRIMARY KEY,
    team_id VARCHAR(255) NOT NULL,
    user_id VARCHAR(255) NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    content_type VARCHAR(50) NOT NULL CHECK (content_type IN ('blog', 'podcast_transcript', 'call_transcript', 'linkedin_post', 'reddit_comment', 'book', 'interview_guide', 'other')),
    source_url TEXT,
    author VARCHAR(255),
    word_count INTEGER DEFAULT 0,
    extracted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Extraction jobs table for tracking processing status
CREATE TABLE IF NOT EXISTS extraction_jobs (
    id SERIAL PRIMARY KEY,
    team_id VARCHAR(255) NOT NULL,
    user_id VARCHAR(255) NOT NULL,
    job_type VARCHAR(50) NOT NULL CHECK (job_type IN ('url', 'pdf')),
    source_identifier TEXT NOT NULL, -- URL or filename
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    progress INTEGER DEFAULT 0,
    items_extracted INTEGER DEFAULT 0,
    processing_time INTEGER, -- in seconds
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sources table for tracking processed sources
CREATE TABLE IF NOT EXISTS processed_sources (
    id SERIAL PRIMARY KEY,
    team_id VARCHAR(255) NOT NULL,
    source_url TEXT NOT NULL,
    source_type VARCHAR(50) NOT NULL,
    last_processed TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    items_count INTEGER DEFAULT 0,
    UNIQUE(team_id, source_url)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_knowledge_base_team_id ON knowledge_base_items(team_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_user_id ON knowledge_base_items(user_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_content_type ON knowledge_base_items(content_type);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_extracted_at ON knowledge_base_items(extracted_at);

CREATE INDEX IF NOT EXISTS idx_extraction_jobs_team_id ON extraction_jobs(team_id);
CREATE INDEX IF NOT EXISTS idx_extraction_jobs_status ON extraction_jobs(status);
CREATE INDEX IF NOT EXISTS idx_extraction_jobs_created_at ON extraction_jobs(created_at);

CREATE INDEX IF NOT EXISTS idx_processed_sources_team_id ON processed_sources(team_id);
CREATE INDEX IF NOT EXISTS idx_processed_sources_last_processed ON processed_sources(last_processed);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at columns
CREATE TRIGGER update_knowledge_base_items_updated_at 
    BEFORE UPDATE ON knowledge_base_items 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_extraction_jobs_updated_at 
    BEFORE UPDATE ON extraction_jobs 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
