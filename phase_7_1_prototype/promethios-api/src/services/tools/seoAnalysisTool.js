/**
 * SEO Analysis Tool
 * 
 * Analyzes web pages for SEO optimization opportunities and provides
 * comprehensive SEO scoring and recommendations.
 */

const axios = require('axios');
const cheerio = require('cheerio');
const { URL } = require('url');

class SEOAnalysisTool {
  constructor() {
    this.name = 'SEO Analysis';
    this.description = 'Analyze web pages for SEO optimization opportunities and provide recommendations';
    this.category = 'web_search';
    this.version = '1.0.0';
    
    // Tool schema for AI integration
    this.schema = {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          description: 'The URL of the webpage to analyze for SEO'
        },
        target_keywords: {
          type: 'array',
          items: { type: 'string' },
          description: 'Target keywords to analyze for optimization',
          default: []
        },
        include_technical: {
          type: 'boolean',
          description: 'Whether to include technical SEO analysis',
          default: true
        },
        include_content: {
          type: 'boolean',
          description: 'Whether to include content SEO analysis',
          default: true
        }
      },
      required: ['url']
    };
  }

  /**
   * Execute SEO analysis
   */
  async execute(parameters, context = {}) {
    try {
      console.log('🔍 [SEOAnalysis] Starting SEO analysis');
      console.log('🔍 [SEOAnalysis] Parameters:', parameters);

      const { 
        url, 
        target_keywords = [],
        include_technical = true,
        include_content = true
      } = parameters;

      // Validate URL
      if (!url) {
        throw new Error('URL is required for SEO analysis');
      }

      let validUrl;
      try {
        validUrl = new URL(url);
      } catch (error) {
        throw new Error(`Invalid URL format: ${url}`);
      }

      // Fetch webpage content
      console.log(`🔍 [SEOAnalysis] Analyzing SEO for: ${url}`);
      
      const response = await axios.get(url, {
        timeout: 30000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; SEOBot/1.0; +https://example.com/bot)',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate',
          'Connection': 'keep-alive'
        },
        maxRedirects: 5
      });

      const html = response.data;
      const $ = cheerio.load(html);

      // Initialize analysis result
      const analysis = {
        url: url,
        analyzed_at: new Date().toISOString(),
        overall_score: 0,
        scores: {},
        issues: [],
        recommendations: [],
        data: {}
      };

      // Perform different types of analysis
      if (include_technical) {
        analysis.data.technical = this.analyzeTechnicalSEO($, response, validUrl);
        analysis.scores.technical = this.calculateTechnicalScore(analysis.data.technical);
      }

      if (include_content) {
        analysis.data.content = this.analyzeContentSEO($, target_keywords);
        analysis.scores.content = this.calculateContentScore(analysis.data.content);
      }

      // Always analyze basic on-page elements
      analysis.data.on_page = this.analyzeOnPageSEO($);
      analysis.scores.on_page = this.calculateOnPageScore(analysis.data.on_page);

      // Calculate overall score
      const scores = Object.values(analysis.scores);
      analysis.overall_score = Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);

      // Generate issues and recommendations
      this.generateIssuesAndRecommendations(analysis);

      console.log(`✅ [SEOAnalysis] SEO analysis completed for: ${url}`);
      console.log(`🔍 [SEOAnalysis] Overall SEO Score: ${analysis.overall_score}/100`);
      
      return {
        success: true,
        analysis: analysis,
        summary: `SEO analysis completed for ${url}. Overall score: ${analysis.overall_score}/100 with ${analysis.issues.length} issues found.`
      };

    } catch (error) {
      console.error('❌ [SEOAnalysis] Analysis failed:', error);
      
      return {
        success: false,
        error: error.message,
        summary: `Failed to analyze SEO for ${parameters.url}: ${error.message}`
      };
    }
  }

  /**
   * Analyze technical SEO aspects
   */
  analyzeTechnicalSEO($, response, url) {
    const technical = {
      page_speed: {
        response_time: response.responseTime || null,
        status_code: response.status,
        redirects: response.request._redirectCount || 0
      },
      mobile_friendly: {
        viewport_meta: !!$('meta[name="viewport"]').length,
        responsive_design: this.checkResponsiveDesign($)
      },
      https: {
        is_secure: url.protocol === 'https:',
        mixed_content: this.checkMixedContent($, url)
      },
      crawlability: {
        robots_txt: null, // Would need separate request
        robots_meta: $('meta[name="robots"]').attr('content') || null,
        noindex: this.checkNoIndex($),
        sitemap: this.findSitemap($)
      },
      structured_data: this.analyzeStructuredData($),
      internal_links: this.analyzeInternalLinks($, url),
      images: this.analyzeImages($)
    };

    return technical;
  }

  /**
   * Analyze content SEO aspects
   */
  analyzeContentSEO($, targetKeywords) {
    const content = {
      word_count: this.getWordCount($),
      keyword_analysis: this.analyzeKeywords($, targetKeywords),
      readability: this.analyzeReadability($),
      content_structure: this.analyzeContentStructure($),
      duplicate_content: this.checkDuplicateContent($)
    };

    return content;
  }

  /**
   * Analyze on-page SEO elements
   */
  analyzeOnPageSEO($) {
    const onPage = {
      title: this.analyzeTitle($),
      meta_description: this.analyzeMetaDescription($),
      headings: this.analyzeHeadings($),
      url_structure: this.analyzeUrlStructure($),
      canonical: this.analyzeCanonical($),
      open_graph: this.analyzeOpenGraph($),
      twitter_cards: this.analyzeTwitterCards($)
    };

    return onPage;
  }

  /**
   * Analyze page title
   */
  analyzeTitle($) {
    const title = $('title').text().trim();
    
    return {
      text: title,
      length: title.length,
      exists: !!title,
      optimal_length: title.length >= 30 && title.length <= 60,
      issues: this.getTitleIssues(title)
    };
  }

  /**
   * Analyze meta description
   */
  analyzeMetaDescription($) {
    const description = $('meta[name="description"]').attr('content') || '';
    
    return {
      text: description,
      length: description.length,
      exists: !!description,
      optimal_length: description.length >= 120 && description.length <= 160,
      issues: this.getMetaDescriptionIssues(description)
    };
  }

  /**
   * Analyze heading structure
   */
  analyzeHeadings($) {
    const headings = {
      h1: [],
      h2: [],
      h3: [],
      h4: [],
      h5: [],
      h6: []
    };

    for (let i = 1; i <= 6; i++) {
      $(`h${i}`).each((index, element) => {
        headings[`h${i}`].push({
          text: $(element).text().trim(),
          length: $(element).text().trim().length
        });
      });
    }

    return {
      structure: headings,
      h1_count: headings.h1.length,
      total_headings: Object.values(headings).reduce((sum, arr) => sum + arr.length, 0),
      issues: this.getHeadingIssues(headings)
    };
  }

  /**
   * Analyze images for SEO
   */
  analyzeImages($) {
    const images = [];
    let missingAlt = 0;
    let totalSize = 0;

    $('img').each((index, element) => {
      const src = $(element).attr('src');
      const alt = $(element).attr('alt');
      const title = $(element).attr('title');
      
      if (!alt) missingAlt++;
      
      images.push({
        src: src || '',
        alt: alt || '',
        title: title || '',
        has_alt: !!alt,
        has_title: !!title
      });
    });

    return {
      total_images: images.length,
      missing_alt_text: missingAlt,
      alt_text_coverage: images.length > 0 ? ((images.length - missingAlt) / images.length * 100).toFixed(1) : 0,
      images: images.slice(0, 10), // Limit to first 10 for performance
      issues: this.getImageIssues(images, missingAlt)
    };
  }

  /**
   * Analyze structured data
   */
  analyzeStructuredData($) {
    const structuredData = [];
    
    $('script[type="application/ld+json"]').each((index, element) => {
      try {
        const data = JSON.parse($(element).html());
        structuredData.push({
          type: data['@type'] || 'Unknown',
          context: data['@context'] || 'Unknown',
          valid: true
        });
      } catch (error) {
        structuredData.push({
          type: 'Invalid',
          context: 'Invalid',
          valid: false,
          error: error.message
        });
      }
    });

    return {
      schemas: structuredData,
      total_schemas: structuredData.length,
      valid_schemas: structuredData.filter(s => s.valid).length,
      has_structured_data: structuredData.length > 0
    };
  }

  /**
   * Calculate technical SEO score
   */
  calculateTechnicalScore(technical) {
    let score = 0;
    let maxScore = 0;

    // HTTPS (20 points)
    maxScore += 20;
    if (technical.https.is_secure) score += 20;

    // Mobile friendly (20 points)
    maxScore += 20;
    if (technical.mobile_friendly.viewport_meta) score += 10;
    if (technical.mobile_friendly.responsive_design) score += 10;

    // Page speed (20 points)
    maxScore += 20;
    if (technical.page_speed.response_time < 2000) score += 20;
    else if (technical.page_speed.response_time < 4000) score += 10;

    // Structured data (20 points)
    maxScore += 20;
    if (technical.structured_data.has_structured_data) score += 20;

    // Images (20 points)
    maxScore += 20;
    const altCoverage = parseFloat(technical.images.alt_text_coverage);
    score += Math.round(altCoverage / 100 * 20);

    return Math.round((score / maxScore) * 100);
  }

  /**
   * Calculate content SEO score
   */
  calculateContentScore(content) {
    let score = 0;
    let maxScore = 100;

    // Word count (25 points)
    if (content.word_count >= 300) score += 25;
    else if (content.word_count >= 150) score += 15;
    else if (content.word_count >= 50) score += 5;

    // Content structure (25 points)
    if (content.content_structure.has_paragraphs) score += 10;
    if (content.content_structure.has_lists) score += 10;
    if (content.content_structure.avg_paragraph_length < 150) score += 5;

    // Readability (25 points)
    if (content.readability.avg_sentence_length < 20) score += 15;
    if (content.readability.complex_words_ratio < 0.1) score += 10;

    // Keyword optimization (25 points)
    if (content.keyword_analysis.keywords_found > 0) score += 25;

    return Math.round(score);
  }

  /**
   * Calculate on-page SEO score
   */
  calculateOnPageScore(onPage) {
    let score = 0;
    let maxScore = 100;

    // Title (25 points)
    if (onPage.title.exists) score += 10;
    if (onPage.title.optimal_length) score += 15;

    // Meta description (25 points)
    if (onPage.meta_description.exists) score += 10;
    if (onPage.meta_description.optimal_length) score += 15;

    // Headings (25 points)
    if (onPage.headings.h1_count === 1) score += 15;
    else if (onPage.headings.h1_count > 0) score += 10;
    if (onPage.headings.total_headings > 1) score += 10;

    // Open Graph (25 points)
    if (onPage.open_graph.has_og_tags) score += 25;

    return Math.round(score);
  }

  /**
   * Generate issues and recommendations
   */
  generateIssuesAndRecommendations(analysis) {
    const issues = [];
    const recommendations = [];

    // Title issues
    if (!analysis.data.on_page.title.exists) {
      issues.push({ type: 'critical', category: 'title', message: 'Missing page title' });
      recommendations.push({ category: 'title', message: 'Add a descriptive page title (30-60 characters)' });
    } else if (!analysis.data.on_page.title.optimal_length) {
      issues.push({ type: 'warning', category: 'title', message: 'Title length not optimal' });
      recommendations.push({ category: 'title', message: 'Optimize title length to 30-60 characters' });
    }

    // Meta description issues
    if (!analysis.data.on_page.meta_description.exists) {
      issues.push({ type: 'warning', category: 'meta', message: 'Missing meta description' });
      recommendations.push({ category: 'meta', message: 'Add a compelling meta description (120-160 characters)' });
    }

    // Heading issues
    if (analysis.data.on_page.headings.h1_count === 0) {
      issues.push({ type: 'critical', category: 'headings', message: 'Missing H1 tag' });
      recommendations.push({ category: 'headings', message: 'Add exactly one H1 tag with your main keyword' });
    } else if (analysis.data.on_page.headings.h1_count > 1) {
      issues.push({ type: 'warning', category: 'headings', message: 'Multiple H1 tags found' });
      recommendations.push({ category: 'headings', message: 'Use only one H1 tag per page' });
    }

    // Technical issues
    if (analysis.data.technical && !analysis.data.technical.https.is_secure) {
      issues.push({ type: 'critical', category: 'security', message: 'Page not served over HTTPS' });
      recommendations.push({ category: 'security', message: 'Implement SSL certificate and serve over HTTPS' });
    }

    // Image issues
    if (analysis.data.technical && analysis.data.technical.images.missing_alt_text > 0) {
      issues.push({ 
        type: 'warning', 
        category: 'images', 
        message: `${analysis.data.technical.images.missing_alt_text} images missing alt text` 
      });
      recommendations.push({ category: 'images', message: 'Add descriptive alt text to all images' });
    }

    analysis.issues = issues;
    analysis.recommendations = recommendations;
  }

  /**
   * Helper methods for various checks
   */
  checkResponsiveDesign($) {
    const viewport = $('meta[name="viewport"]').attr('content') || '';
    return viewport.includes('width=device-width');
  }

  checkMixedContent($, url) {
    if (url.protocol !== 'https:') return false;
    
    let hasMixedContent = false;
    $('img, script, link').each((i, element) => {
      const src = $(element).attr('src') || $(element).attr('href');
      if (src && src.startsWith('http://')) {
        hasMixedContent = true;
        return false;
      }
    });
    
    return hasMixedContent;
  }

  checkNoIndex($) {
    const robots = $('meta[name="robots"]').attr('content') || '';
    return robots.toLowerCase().includes('noindex');
  }

  findSitemap($) {
    const sitemapLink = $('link[rel="sitemap"]').attr('href');
    return sitemapLink || null;
  }

  getWordCount($) {
    const text = $('body').text().replace(/\s+/g, ' ').trim();
    return text.split(' ').filter(word => word.length > 0).length;
  }

  analyzeKeywords($, targetKeywords) {
    const bodyText = $('body').text().toLowerCase();
    const keywordsFound = targetKeywords.filter(keyword => 
      bodyText.includes(keyword.toLowerCase())
    );
    
    return {
      target_keywords: targetKeywords,
      keywords_found: keywordsFound.length,
      found_keywords: keywordsFound
    };
  }

  analyzeReadability($) {
    const text = $('body').text();
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const words = text.split(/\s+/).filter(w => w.length > 0);
    
    return {
      total_words: words.length,
      total_sentences: sentences.length,
      avg_sentence_length: sentences.length > 0 ? Math.round(words.length / sentences.length) : 0,
      complex_words_ratio: this.calculateComplexWordsRatio(words)
    };
  }

  analyzeContentStructure($) {
    return {
      has_paragraphs: $('p').length > 0,
      paragraph_count: $('p').length,
      has_lists: $('ul, ol').length > 0,
      list_count: $('ul, ol').length,
      avg_paragraph_length: this.getAverageParagraphLength($)
    };
  }

  checkDuplicateContent($) {
    // Basic duplicate content check (would need more sophisticated implementation)
    return {
      has_duplicate_titles: this.checkDuplicateTitles($),
      has_duplicate_descriptions: this.checkDuplicateDescriptions($)
    };
  }

  analyzeUrlStructure($) {
    const canonical = $('link[rel="canonical"]').attr('href');
    return {
      has_canonical: !!canonical,
      canonical_url: canonical || null
    };
  }

  analyzeCanonical($) {
    const canonical = $('link[rel="canonical"]').attr('href');
    return {
      exists: !!canonical,
      url: canonical || null
    };
  }

  analyzeOpenGraph($) {
    const ogTags = {};
    $('meta[property^="og:"]').each((i, element) => {
      const property = $(element).attr('property');
      const content = $(element).attr('content');
      ogTags[property] = content;
    });
    
    return {
      has_og_tags: Object.keys(ogTags).length > 0,
      tags: ogTags
    };
  }

  analyzeTwitterCards($) {
    const twitterTags = {};
    $('meta[name^="twitter:"]').each((i, element) => {
      const name = $(element).attr('name');
      const content = $(element).attr('content');
      twitterTags[name] = content;
    });
    
    return {
      has_twitter_cards: Object.keys(twitterTags).length > 0,
      tags: twitterTags
    };
  }

  analyzeInternalLinks($, url) {
    let internalLinks = 0;
    let externalLinks = 0;
    
    $('a[href]').each((i, element) => {
      const href = $(element).attr('href');
      try {
        const linkUrl = new URL(href, url.href);
        if (linkUrl.hostname === url.hostname) {
          internalLinks++;
        } else {
          externalLinks++;
        }
      } catch (error) {
        // Skip invalid URLs
      }
    });
    
    return {
      internal_links: internalLinks,
      external_links: externalLinks,
      total_links: internalLinks + externalLinks
    };
  }

  // Helper methods for issue detection
  getTitleIssues(title) {
    const issues = [];
    if (!title) issues.push('Missing title');
    if (title.length < 30) issues.push('Title too short');
    if (title.length > 60) issues.push('Title too long');
    return issues;
  }

  getMetaDescriptionIssues(description) {
    const issues = [];
    if (!description) issues.push('Missing meta description');
    if (description.length < 120) issues.push('Meta description too short');
    if (description.length > 160) issues.push('Meta description too long');
    return issues;
  }

  getHeadingIssues(headings) {
    const issues = [];
    if (headings.h1.length === 0) issues.push('Missing H1 tag');
    if (headings.h1.length > 1) issues.push('Multiple H1 tags');
    return issues;
  }

  getImageIssues(images, missingAlt) {
    const issues = [];
    if (missingAlt > 0) issues.push(`${missingAlt} images missing alt text`);
    return issues;
  }

  calculateComplexWordsRatio(words) {
    const complexWords = words.filter(word => word.length > 6);
    return words.length > 0 ? complexWords.length / words.length : 0;
  }

  getAverageParagraphLength($) {
    const paragraphs = $('p');
    if (paragraphs.length === 0) return 0;
    
    let totalLength = 0;
    paragraphs.each((i, p) => {
      totalLength += $(p).text().length;
    });
    
    return Math.round(totalLength / paragraphs.length);
  }

  checkDuplicateTitles($) {
    // Would need database of other pages to check properly
    return false;
  }

  checkDuplicateDescriptions($) {
    // Would need database of other pages to check properly
    return false;
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
module.exports = new SEOAnalysisTool();

