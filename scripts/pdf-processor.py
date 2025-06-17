#!/usr/bin/env python3
"""
Advanced PDF Processing Engine
Handles PDF extraction with chapter detection and content cleaning
"""

import PyPDF2
import re
from typing import List, Dict, Optional, Tuple
from dataclasses import dataclass
import fitz  # PyMuPDF alternative
from io import BytesIO

@dataclass
class PDFChapter:
    title: str
    content: str
    page_start: int
    page_end: int
    word_count: int = 0

class PDFProcessor:
    """Advanced PDF processing with intelligent chapter detection"""
    
    def __init__(self):
        self.chapter_patterns = [
            r'^Chapter\s+\d+[:\-\s]',
            r'^\d+\.\s+[A-Z]',
            r'^[A-Z][A-Z\s]{10,}$',  # All caps titles
            r'^\d+\s+[A-Z]',
            r'^Part\s+[IVX]+[:\-\s]',
        ]
    
    def extract_chapters(self, pdf_content: bytes) -> List[PDFChapter]:
        """Extract chapters from PDF content"""
        try:
            # Try PyMuPDF first (better text extraction)
            return self._extract_with_pymupdf(pdf_content)
        except Exception:
            # Fallback to PyPDF2
            return self._extract_with_pypdf2(pdf_content)
    
    def _extract_with_pymupdf(self, pdf_content: bytes) -> List[PDFChapter]:
        """Extract using PyMuPDF for better text quality"""
        doc = fitz.open(stream=pdf_content, filetype="pdf")
        
        # Extract all text with page numbers
        pages_text = []
        for page_num in range(len(doc)):
            page = doc.load_page(page_num)
            text = page.get_text()
            pages_text.append((page_num, text))
        
        doc.close()
        
        # Detect chapters
        chapters = self._detect_chapters(pages_text)
        
        return chapters
    
    def _extract_with_pypdf2(self, pdf_content: bytes) -> List[PDFChapter]:
        """Fallback extraction using PyPDF2"""
        pdf_reader = PyPDF2.PdfReader(BytesIO(pdf_content))
        
        pages_text = []
        for page_num, page in enumerate(pdf_reader.pages):
            try:
                text = page.extract_text()
                pages_text.append((page_num, text))
            except Exception:
                pages_text.append((page_num, ""))
        
        chapters = self._detect_chapters(pages_text)
        return chapters
    
    def _detect_chapters(self, pages_text: List[Tuple[int, str]]) -> List[PDFChapter]:
        """Detect chapter boundaries using heuristics"""
        chapters = []
        current_chapter = None
        
        for page_num, text in pages_text:
            lines = text.split('\n')
            
            for line_num, line in enumerate(lines):
                line = line.strip()
                if not line:
                    continue
                
                # Check if this line looks like a chapter title
                if self._is_chapter_title(line):
                    # Save previous chapter
                    if current_chapter:
                        current_chapter['page_end'] = page_num - 1
                        current_chapter['content'] = self._clean_content(current_chapter['content'])
                        current_chapter['word_count'] = len(current_chapter['content'].split())
                        
                        chapters.append(PDFChapter(
                            title=current_chapter['title'],
                            content=current_chapter['content'],
                            page_start=current_chapter['page_start'],
                            page_end=current_chapter['page_end'],
                            word_count=current_chapter['word_count']
                        ))
                    
                    # Start new chapter
                    current_chapter = {
                        'title': line,
                        'content': '',
                        'page_start': page_num,
                        'page_end': page_num
                    }
                
                elif current_chapter:
                    # Add content to current chapter
                    current_chapter['content'] += line + '\n'
        
        # Don't forget the last chapter
        if current_chapter:
            current_chapter['page_end'] = pages_text[-1][0]
            current_chapter['content'] = self._clean_content(current_chapter['content'])
            current_chapter['word_count'] = len(current_chapter['content'].split())
            
            chapters.append(PDFChapter(
                title=current_chapter['title'],
                content=current_chapter['content'],
                page_start=current_chapter['page_start'],
                page_end=current_chapter['page_end'],
                word_count=current_chapter['word_count']
            ))
        
        # If no chapters detected, treat entire document as one chapter
        if not chapters and pages_text:
            full_content = '\n'.join([text for _, text in pages_text])
            chapters.append(PDFChapter(
                title="Complete Document",
                content=self._clean_content(full_content),
                page_start=0,
                page_end=len(pages_text) - 1,
                word_count=len(full_content.split())
            ))
        
        return chapters
    
    def _is_chapter_title(self, line: str) -> bool:
        """Check if a line looks like a chapter title"""
        # Skip very short or very long lines
        if len(line) < 5 or len(line) > 100:
            return False
        
        # Check against chapter patterns
        for pattern in self.chapter_patterns:
            if re.match(pattern, line, re.IGNORECASE):
                return True
        
        # Additional heuristics
        # Lines that are mostly uppercase and not too long
        if line.isupper() and 10 <= len(line) <= 50:
            return True
        
        # Lines that start with a number followed by a space and capital letter
        if re.match(r'^\d+\s+[A-Z]', line):
            return True
        
        return False
    
    def _clean_content(self, content: str) -> str:
        """Clean and format extracted content"""
        # Remove excessive whitespace
        content = re.sub(r'\n\s*\n\s*\n', '\n\n', content)
        
        # Remove page numbers and headers/footers
        lines = content.split('\n')
        cleaned_lines = []
        
        for line in lines:
            line = line.strip()
            
            # Skip likely page numbers
            if re.match(r'^\d+$', line):
                continue
            
            # Skip very short lines that are likely artifacts
            if len(line) < 3:
                continue
            
            # Skip lines that are mostly special characters
            if len(re.sub(r'[^a-zA-Z0-9\s]', '', line)) < len(line) * 0.5:
                continue
            
            cleaned_lines.append(line)
        
        # Rejoin and format
        cleaned_content = '\n'.join(cleaned_lines)
        
        # Convert to markdown-like format
        cleaned_content = self._format_as_markdown(cleaned_content)
        
        return cleaned_content.strip()
    
    def _format_as_markdown(self, content: str) -> str:
        """Convert plain text to markdown-like format"""
        lines = content.split('\n')
        formatted_lines = []
        
        for line in lines:
            line = line.strip()
            if not line:
                formatted_lines.append('')
                continue
            
            # Detect headings (lines that are short and look like titles)
            if (len(line) < 80 and 
                (line.isupper() or 
                 line.istitle() or 
                 re.match(r'^\d+\.\d+', line))):
                
                # Determine heading level
                if line.isupper():
                    formatted_lines.append(f'## {line.title()}')
                else:
                    formatted_lines.append(f'### {line}')
            else:
                formatted_lines.append(line)
        
        return '\n'.join(formatted_lines)

def main():
    """Example usage of PDF processor"""
    processor = PDFProcessor()
    
    # Example: process a sample PDF
    try:
        with open('sample.pdf', 'rb') as f:
            pdf_content = f.read()
        
        chapters = processor.extract_chapters(pdf_content)
        
        print(f"Extracted {len(chapters)} chapters:")
        for i, chapter in enumerate(chapters, 1):
            print(f"\nChapter {i}: {chapter.title}")
            print(f"Pages: {chapter.page_start}-{chapter.page_end}")
            print(f"Word Count: {chapter.word_count}")
            print(f"Content Preview: {chapter.content[:200]}...")
            print("-" * 50)
    
    except FileNotFoundError:
        print("Sample PDF not found. This is just an example.")

if __name__ == "__main__":
    main()
