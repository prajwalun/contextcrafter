-- Add the metadata column to the knowledge_base_items table
ALTER TABLE knowledge_base_items 
ADD COLUMN IF NOT EXISTS metadata JSONB;

-- Add an index for better performance on metadata queries
CREATE INDEX IF NOT EXISTS idx_knowledge_base_metadata 
ON knowledge_base_items USING gin(metadata);

-- Update the updated_at trigger to include the new column
-- (The trigger should already handle this, but let's make sure)
