-- Insert sample data for demonstration

-- Sample knowledge base items
INSERT INTO knowledge_base_items (team_id, user_id, title, content, content_type, source_url, author, word_count) VALUES
('aline123', 'user_001', 'System Design Interview Preparation', 
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

('aline123', 'user_001', 'Advanced Data Structures for Coding Interviews', 
'# Advanced Data Structures for Coding Interviews

Beyond basic arrays and linked lists, mastering advanced data structures is key to solving complex problems efficiently.

## Trie (Prefix Tree)

Perfect for string-related problems:
- Autocomplete systems
- Spell checkers
- IP routing tables

```python
class TrieNode:
    def __init__(self):
        self.children = {}
        self.is_end_of_word = False

class Trie:
    def __init__(self):
        self.root = TrieNode()
    
    def insert(self, word):
        node = self.root
        for char in word:
            if char not in node.children:
                node.children[char] = TrieNode()
            node = node.children[char]
        node.is_end_of_word = True
