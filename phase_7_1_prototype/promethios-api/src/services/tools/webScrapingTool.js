/**
 * Web Scraping Tool
 * 
 * Extracts content, links, images, and metadata from web pages.
 * Supports various content types and provides structured data extraction.
 */

const axios = require('axios');
const cheerio = require('cheerio');
const { URL } = require('url');

class WebScrapingTool {
  constructor() {
    this.name = 'Web Scraping';
    this.description = 'Extract content, links, images, and metadata from web pages';
    this.category = 'web_search';
    this.version = '1.0.0';
    
    // Tool schema for AI integration
    this.schema = {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          description: 'The URL of the webpage to scrape'
        },
        extract_type: {
          type: 'string',
          enum: ['text', 'links', 'images', 'tables', 'metadata', 'all'],
          description: 'Type of content to extract from the webpage',
          default: 'all'
        },
        max_content_length: {
          type: 'number',
          description: 'Maximum length of text content to extract',
          default: 10000
        },
        include_external_links: {
          type: 'boolean',
          description: 'Whether to include external links in extraction',
          default: true
        }
      },
      required: ['url']
    };
  }

  /**
   * Execute web scraping
   */
  async execute(parameters, context = {}) {
    try {
      console.log('🕷️ [WebScraping] Starting web scraping operation');
      console.log('🕷️ [WebScraping] Parameters:', parameters);

      const { 
        url, 
        extract_type = 'all',
        max_content_length = 10000,
        include_external_links = true
      } = parameters;

      // Validate URL
      if (!url) {
        throw new Error('URL is required for web scraping');
      }

      let validUrl;
      try {
        validUrl = new URL(url);
      } catch (error) {
        throw new Error(`Invalid URL format: ${url}`);
      }

      // Fetch webpage content
      console.log(`🕷️ [WebScraping] Fetching content from: ${url}`);
      
      const response = await axios.get(url, {
        timeout: 30000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1'
        },
        maxRedirects: 5
      });

      const html = response.data;
      const $ = cheerio.load(html);

      // Initialize result object
      const result = {
        url: url,
        title: $('title').text().trim() || 'No title found',
        status_code: response.status,
        content_type: response.headers['content-type'] || 'text/html',
        scraped_at: new Date().toISOString(),
        data: {}
      };

      // Extract based on type
      if (extract_type === 'all' || extract_type === 'text') {
        result.data.text_content = this.extractTextContent($, max_content_length);
      }

      if (extract_type === 'all' || extract_type === 'links') {
        result.data.links = this.extractLinks($, validUrl, include_external_links);
      }

      if (extract_type === 'all' || extract_type === 'images') {
        result.data.images = this.extractImages($, validUrl);
      }

      if (extract_type === 'all' || extract_type === 'tables') {
        result.data.tables = this.extractTables($);
      }

      if (extract_type === 'all' || extract_type === 'metadata') {
        result.data.metadata = this.extractMetadata($);
      }

      console.log(`✅ [WebScraping] Successfully scraped content from: ${url}`);
      
      return {
        success: true,
        result: result,
        summary: `Successfully scraped ${extract_type} content from ${url}. Found ${result.title}.`
      };

    } catch (error) {
      console.error('❌ [WebScraping] Scraping failed:', error);
      
      return {
        success: false,
        error: error.message,
        summary: `Failed to scrape content from ${parameters.url}: ${error.message}`
      };
    }
  }

  /**
   * Extract text content from the page
   */
  extractTextContent($, maxLength) {
    // Remove script and style elements
    $('script, style, nav, header, footer, aside').remove();
    
    // Get main content areas
    const contentSelectors = [
      'main',
      'article', 
      '.content',
      '.main-content',
      '#content',
      '#main',
      '.post-content',
      '.entry-content'
    ];

    let textContent = '';
    
    // Try to find main content area first
    for (const selector of contentSelectors) {
      const element = $(selector);
      if (element.length > 0) {
        textContent = element.text().trim();
        break;
      }
    }
    
    // Fallback to body content
    if (!textContent) {
      textContent = $('body').text().trim();
    }
    
    // Clean up whitespace
    textContent = textContent.replace(/\s+/g, ' ').trim();
    
    // Truncate if necessary
    if (textContent.length > maxLength) {
      textContent = textContent.substring(0, maxLength) + '...';
    }
    
    return {
      content: textContent,
      length: textContent.length,
      truncated: textContent.endsWith('...')
    };
  }

  /**
   * Extract links from the page
   */
  extractLinks($, baseUrl, includeExternal) {
    const links = [];
    const seenUrls = new Set();
    
    $('a[href]').each((i, element) => {
      const href = $(element).attr('href');
      const text = $(element).text().trim();
      
      if (!href || href.startsWith('#') || href.startsWith('javascript:')) {
        return;
      }
      
      try {
        const absoluteUrl = new URL(href, baseUrl.href).href;
        
        if (seenUrls.has(absoluteUrl)) {
          return;
        }
        seenUrls.add(absoluteUrl);
        
        const isExternal = new URL(absoluteUrl).hostname !== baseUrl.hostname;
        
        if (!includeExternal && isExternal) {
          return;
        }
        
        links.push({
          url: absoluteUrl,
          text: text || 'No text',
          is_external: isExternal,
          title: $(element).attr('title') || null
        });
        
      } catch (error) {
        // Skip invalid URLs
      }
    });
    
    return {
      links: links,
      total_count: links.length,
      internal_count: links.filter(l => !l.is_external).length,
      external_count: links.filter(l => l.is_external).length
    };
  }

  /**
   * Extract images from the page
   */
  extractImages($, baseUrl) {
    const images = [];
    const seenUrls = new Set();
    
    $('img[src]').each((i, element) => {
      const src = $(element).attr('src');
      const alt = $(element).attr('alt') || '';
      
      if (!src) return;
      
      try {
        const absoluteUrl = new URL(src, baseUrl.href).href;
        
        if (seenUrls.has(absoluteUrl)) {
          return;
        }
        seenUrls.add(absoluteUrl);
        
        images.push({
          url: absoluteUrl,
          alt_text: alt,
          title: $(element).attr('title') || null,
          width: $(element).attr('width') || null,
          height: $(element).attr('height') || null
        });
        
      } catch (error) {
        // Skip invalid URLs
      }
    });
    
    return {
      images: images,
      total_count: images.length
    };
  }

  /**
   * Extract tables from the page
   */
  extractTables($) {
    const tables = [];
    
    $('table').each((i, element) => {
      const table = $(element);
      const rows = [];
      
      table.find('tr').each((j, row) => {
        const cells = [];
        $(row).find('td, th').each((k, cell) => {
          cells.push($(cell).text().trim());
        });
        if (cells.length > 0) {
          rows.push(cells);
        }
      });
      
      if (rows.length > 0) {
        tables.push({
          index: i,
          rows: rows,
          row_count: rows.length,
          column_count: Math.max(...rows.map(row => row.length))
        });
      }
    });
    
    return {
      tables: tables,
      total_count: tables.length
    };
  }

  /**
   * Extract metadata from the page
   */
  extractMetadata($) {
    const metadata = {
      title: $('title').text().trim(),
      description: $('meta[name="description"]').attr('content') || null,
      keywords: $('meta[name="keywords"]').attr('content') || null,
      author: $('meta[name="author"]').attr('content') || null,
      robots: $('meta[name="robots"]').attr('content') || null,
      viewport: $('meta[name="viewport"]').attr('content') || null,
      charset: $('meta[charset]').attr('charset') || null,
      language: $('html').attr('lang') || null,
      canonical: $('link[rel="canonical"]').attr('href') || null,
      og: {},
      twitter: {}
    };
    
    // Open Graph metadata
    $('meta[property^="og:"]').each((i, element) => {
      const property = $(element).attr('property').replace('og:', '');
      const content = $(element).attr('content');
      if (content) {
        metadata.og[property] = content;
      }
    });
    
    // Twitter Card metadata
    $('meta[name^="twitter:"]').each((i, element) => {
      const name = $(element).attr('name').replace('twitter:', '');
      const content = $(element).attr('content');
      if (content) {
        metadata.twitter[name] = content;
      }
    });
    
    // Structured data (JSON-LD)
    const structuredData = [];
    $('script[type="application/ld+json"]').each((i, element) => {
      try {
        const data = JSON.parse($(element).html());
        structuredData.push(data);
      } catch (error) {
        // Skip invalid JSON-LD
      }
    });
    
    if (structuredData.length > 0) {
      metadata.structured_data = structuredData;
    }
    
    return metadata;
  }

  /**
   * Get tool information
   */
  getInfo() {
    return {
      name: this.name,
      description: this.description,
      category: this.category,
      version: this.version,
      schema: this.schema
    };
  }
}

// Export singleton instance
module.exports = new WebScrapingTool();

