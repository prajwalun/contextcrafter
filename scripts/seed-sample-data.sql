-- Insert sample data for demonstration with multiple teams

-- Sample knowledge base items for different teams
INSERT INTO knowledge_base_items (team_id, user_id, title, content, content_type, source_url, author, word_count) VALUES
-- Team 1 data
('demo_team_001', 'user_001', 'System Design Interview Preparation', 
'# System Design Interview Preparation

System design interviews are crucial for senior engineering positions. This guide covers the essential topics and strategies you need to succeed.

## Key Topics to Master

### Scalability
- Horizontal vs Vertical Scaling
- Load Balancing Strategies
- Database Sharding
- Caching Mechanisms

### Reliability
- Fault Tolerance
- Redundancy
- Circuit Breakers
- Graceful Degradation

### Performance
- Latency vs Throughput
- CDN Usage
- Database Optimization
- Asynchronous Processing

## Common System Design Questions

1. Design a URL Shortener (like bit.ly)
2. Design a Social Media Feed
3. Design a Chat System
4. Design a Video Streaming Service
5. Design a Search Engine

## Approach Strategy

1. **Clarify Requirements** - Ask about scale, features, constraints
2. **Estimate Scale** - Calculate users, requests, storage needs
3. **High-Level Design** - Draw major components and data flow
4. **Detailed Design** - Dive into specific components
5. **Scale the Design** - Address bottlenecks and scaling issues

Remember: There is no single correct answer. Focus on trade-offs and reasoning.', 
'interview_guide', 'https://interviewing.io/guides/system-design', 'Interviewing.io Team', 245),

-- Team 2 data
('demo_team_002', 'user_002', 'Advanced React Patterns', 
'# Advanced React Patterns

Learn advanced React patterns to build scalable and maintainable applications.

## Compound Components

Compound components allow you to create flexible and reusable component APIs.

## Render Props

The render prop pattern allows you to share code between components using a prop whose value is a function.

## Higher-Order Components

HOCs are a pattern for reusing component logic.

## Custom Hooks

Custom hooks let you extract component logic into reusable functions.', 
'blog', 'https://example.com/react-patterns', 'React Expert', 180),

-- Team 3 data  
('demo_team_003', 'user_003', 'Machine Learning Fundamentals', 
'# Machine Learning Fundamentals

An introduction to the core concepts of machine learning.

## Supervised Learning

Learn about classification and regression algorithms.

## Unsupervised Learning

Explore clustering and dimensionality reduction techniques.

## Deep Learning

Introduction to neural networks and deep learning frameworks.', 
'book', 'https://example.com/ml-book', 'ML Researcher', 150),

-- More diverse sample data
('demo_team_001', 'user_001', 'JavaScript Performance Optimization', 
'# JavaScript Performance Optimization

Tips and techniques for optimizing JavaScript performance in web applications.

## Memory Management
- Avoiding memory leaks
- Garbage collection optimization
- Efficient data structures

## Code Optimization
- Minification and bundling
- Tree shaking
- Lazy loading

## Runtime Performance
- Event loop optimization
- Async/await best practices
- Web Workers for heavy computations', 
'blog', 'https://example.com/js-performance', 'JS Developer', 320),

('demo_team_002', 'user_004', 'Database Design Principles', 
'# Database Design Principles

Essential principles for designing efficient and scalable databases.

## Normalization
- First, Second, and Third Normal Forms
- When to denormalize
- Trade-offs in normalization

## Indexing Strategies
- B-tree indexes
- Hash indexes
- Composite indexes
- Index maintenance

## Query Optimization
- Execution plans
- Query rewriting
- Performance monitoring', 
'documentation', 'https://example.com/db-design', 'Database Architect', 280);

-- Sample extraction jobs for different teams
INSERT INTO extraction_jobs (team_id, user_id, job_type, source_identifier, status, progress, items_extracted, processing_time) VALUES
('demo_team_001', 'user_001', 'url', 'https://interviewing.io/guides/system-design', 'completed', 100, 1, 8),
('demo_team_001', 'user_001', 'url', 'https://example.com/js-performance', 'completed', 100, 1, 12),
('demo_team_002', 'user_002', 'url', 'https://example.com/react-patterns', 'completed', 100, 1, 6),
('demo_team_002', 'user_004', 'url', 'https://example.com/db-design', 'completed', 100, 1, 15),
('demo_team_003', 'user_003', 'pdf', 'ml-fundamentals.pdf', 'completed', 100, 1, 25),
('demo_team_001', 'user_001', 'url', 'https://example.com/in-progress', 'processing', 45, 0, NULL),
('demo_team_002', 'user_002', 'pdf', 'failed-document.pdf', 'failed', 0, 0, NULL);

-- Sample processed sources for different teams
INSERT INTO processed_sources (team_id, source_url, source_type, items_count) VALUES
('demo_team_001', 'https://interviewing.io/guides/system-design', 'blog', 1),
('demo_team_001', 'https://example.com/js-performance', 'blog', 1),
('demo_team_002', 'https://example.com/react-patterns', 'blog', 1),
('demo_team_002', 'https://example.com/db-design', 'documentation', 1),
('demo_team_003', 'ml-fundamentals.pdf', 'pdf', 1);
