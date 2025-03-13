const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Sources focused on AI news
const sources = [
  // Existing sources
  {
    name: 'techcrunch',
    url: 'https://techcrunch.com/category/artificial-intelligence/',
    base: 'https://techcrunch.com'
  },
  {
    name: 'wired',
    url: 'https://www.wired.com/tag/artificial-intelligence/',
    base: 'https://www.wired.com'
  },
  {
    name: 'venturebeat',
    url: 'https://venturebeat.com/category/ai/',
    base: 'https://venturebeat.com'
  },
  {
    name: 'mit',
    url: 'https://news.mit.edu/topic/artificial-intelligence2',
    base: 'https://news.mit.edu'
  },
  {
    name: 'theverge',
    url: 'https://www.theverge.com/ai-artificial-intelligence',
    base: 'https://www.theverge.com'
  },
  {
    name: 'zdnet',
    url: 'https://www.zdnet.com/topic/artificial-intelligence/',
    base: 'https://www.zdnet.com'
  },
  
  // New AI-specific sources
  {
    name: 'aibusiness',
    url: 'https://aibusiness.com/latest-news',
    base: 'https://aibusiness.com'
  },
  {
    name: 'aitimes',
    url: 'https://www.aitimes.com/',
    base: 'https://www.aitimes.com'
  },
  {
    name: 'insidebigdata',
    url: 'https://insidebigdata.com/category/news-analysis/',
    base: 'https://insidebigdata.com'
  },
  {
    name: 'ieeespectrum',
    url: 'https://spectrum.ieee.org/topic/artificial-intelligence/',
    base: 'https://spectrum.ieee.org'
  },
  {
    name: 'stanford',
    url: 'https://hai.stanford.edu/news',
    base: 'https://hai.stanford.edu'
  },
  {
    name: 'analyticsinsight',
    url: 'https://www.analyticsinsight.net/category/latest-news/',
    base: 'https://www.analyticsinsight.net'
  },
  {
    name: 'huggingface',
    url: 'https://huggingface.co/blog',
    base: 'https://huggingface.co'
  },
  {
    name: 'forbes_ai',
    url: 'https://www.forbes.com/ai/',
    base: 'https://www.forbes.com'
  }
];

// AI-specific keywords to validate content
const aiKeywords = [
  'ai', 'artificial intelligence', 'machine learning', 'ml', 'neural network', 
  'deep learning', 'nlp', 'natural language processing', 'computer vision', 
  'llm', 'large language model', 'gpt', 'generative ai', 'chatbot',
  'chatgpt', 'claude', 'gemini', 'bard', 'stable diffusion', 'dall-e',
  'midjourney', 'transformer', 'reinforcement learning', 'diffusion model',
  'fine-tuning', 'foundation model', 'multimodal', 'prompt engineering', 'rag',
  'embeddings', 'vector database', 'semantic search', 'language model',
  'anthropic', 'openai', 'mistral ai', 'perplexity', 'google ai', 'meta ai',
  'autonomous systems', 'ai ethics', 'ai regulation', 'ai safety', 'ai alignment'
];

// Function to validate if content is AI-related
function isAIRelated(title, description) {
  const content = (title + ' ' + description).toLowerCase();
  return aiKeywords.some(term => content.includes(term));
}

// Main route to get AI news
app.get('/api/ai-news', async (req, res) => {
  const debug = req.query.debug === 'true';
  const limit = parseInt(req.query.limit) || 30;
  const sourceName = req.query.source;
  
  try {
    const articles = [];
    let sourcesToScrape = sources;
    
    // Filter sources if specified
    if (sourceName) {
      sourcesToScrape = sources.filter(s => s.name === sourceName);
      if (sourcesToScrape.length === 0) {
        return res.status(400).json({ 
          success: false, 
          message: `Source "${sourceName}" not found` 
        });
      }
    }

    // Loop through each source
    for (const source of sourcesToScrape) {
      try {
        if (debug) console.log(`Fetching AI news from ${source.name}...`);
        
        const response = await axios.get(source.url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          },
          timeout: 10000 // 10 second timeout
        });
        
        const html = response.data;
        const $ = cheerio.load(html);
        
        // Existing sources
        if (source.name === 'techcrunch') {
          $('article').each(function() {
            const title = $(this).find('h2, h3').text().trim();
            const url = $(this).find('a').attr('href');
            const description = $(this).find('p').text().trim();
            
            if (title && url && isAIRelated(title, description)) {
              articles.push({
                title,
                url: url.startsWith('http') ? url : `${source.base}${url}`,
                source: source.name,
                description: description || 'No description available'
              });
            }
          });
        } 
        else if (source.name === 'wired') {
          $('.summary-item').each(function() {
            const title = $(this).find('h3').text().trim();
            const url = $(this).find('a').attr('href');
            const description = $(this).find('.summary-item__dek').text().trim();
            
            if (title && url && isAIRelated(title, description)) {
              articles.push({
                title,
                url: url.startsWith('http') ? url : `${source.base}${url}`,
                source: source.name,
                description: description || 'No description available'
              });
            }
          });
        }
        else if (source.name === 'venturebeat') {
          $('.ArticleListing-post, .article-card, article').each(function() {
            const title = $(this).find('h2, .article-title').text().trim();
            const url = $(this).find('a').attr('href');
            const description = $(this).find('.excerpt, .article-excerpt').text().trim();
            
            if (title && url && isAIRelated(title, description)) {
              articles.push({
                title,
                url: url.startsWith('http') ? url : `${source.base}${url}`,
                source: source.name,
                description: description || 'No description available'
              });
            }
          });
        }
        else if (source.name === 'mit') {
          $('.term-page--news-article').each(function() {
            const title = $(this).find('h3').text().trim();
            const url = $(this).find('a').attr('href');
            const description = $(this).find('.term-page--news-article-item--blurb').text().trim();
            
            if (title && url && isAIRelated(title, description)) {
              articles.push({
                title,
                url: url.startsWith('http') ? url : `${source.base}${url}`,
                source: source.name,
                description: description || 'No description available'
              });
            }
          });
        }
        else if (source.name === 'theverge') {
          $('.duet--content-cards--content-card').each(function() {
            const title = $(this).find('h2, h3').text().trim();
            const url = $(this).find('a').attr('href');
            const description = $(this).find('.dek').text().trim();
            
            if (title && url && isAIRelated(title, description)) {
              articles.push({
                title,
                url: url.startsWith('http') ? url : `${source.base}${url}`,
                source: source.name,
                description: description || 'No description available'
              });
            }
          });
        }
        else if (source.name === 'zdnet') {
          $('.content-card').each(function() {
            const title = $(this).find('.title, h3').text().trim();
            const url = $(this).find('a').attr('href');
            const description = $(this).find('.description').text().trim();
            
            if (title && url && isAIRelated(title, description)) {
              articles.push({
                title,
                url: url.startsWith('http') ? url : `${source.base}${url}`,
                source: source.name,
                description: description || 'No description available'
              });
            }
          });
        }
        // New source selectors
        else if (source.name === 'aibusiness') {
          $('.article, .post').each(function() {
            const title = $(this).find('h2, .title').text().trim();
            const url = $(this).find('a').attr('href');
            const description = $(this).find('.excerpt, .summary').text().trim();
            
            if (title && url) {
              articles.push({
                title,
                url: url.startsWith('http') ? url : `${source.base}${url}`,
                source: source.name,
                description: description || 'No description available'
              });
            }
          });
        }
        else if (source.name === 'aitimes') {
          $('.article-card, .post').each(function() {
            const title = $(this).find('h3, .title').text().trim();
            const url = $(this).find('a').attr('href');
            const description = $(this).find('.excerpt, .desc').text().trim();
            
            if (title && url) {
              articles.push({
                title,
                url: url.startsWith('http') ? url : `${source.base}${url}`,
                source: source.name,
                description: description || 'No description available'
              });
            }
          });
        }
        else if (source.name === 'insidebigdata') {
          $('.post, article').each(function() {
            const title = $(this).find('h2, .entry-title').text().trim();
            const url = $(this).find('a').attr('href');
            const description = $(this).find('.entry-content p, .excerpt').text().trim();
            
            if (title && url && isAIRelated(title, description)) {
              articles.push({
                title,
                url: url.startsWith('http') ? url : `${source.base}${url}`,
                source: source.name,
                description: description || 'No description available'
              });
            }
          });
        }
        else if (source.name === 'ieeespectrum') {
          $('.article-card, .post').each(function() {
            const title = $(this).find('h3, .title').text().trim();
            const url = $(this).find('a').attr('href');
            const description = $(this).find('.excerpt, .summary').text().trim();
            
            if (title && url) {
              articles.push({
                title,
                url: url.startsWith('http') ? url : `${source.base}${url}`,
                source: source.name,
                description: description || 'No description available'
              });
            }
          });
        }
        else if (source.name === 'stanford') {
          $('.view-content .news-card, article').each(function() {
            const title = $(this).find('h3, .title').text().trim();
            const url = $(this).find('a').attr('href');
            const description = $(this).find('.field--name-field-subtitle, .summary').text().trim();
            
            if (title && url) {
              articles.push({
                title,
                url: url.startsWith('http') ? url : `${source.base}${url}`,
                source: source.name,
                description: description || 'No description available'
              });
            }
          });
        }
        else if (source.name === 'analyticsinsight') {
          $('.single-latest-news, article').each(function() {
            const title = $(this).find('h2, .title').text().trim();
            const url = $(this).find('a').attr('href');
            const description = $(this).find('.latest-news-content p, .excerpt').text().trim();
            
            if (title && url && isAIRelated(title, description)) {
              articles.push({
                title,
                url: url.startsWith('http') ? url : `${source.base}${url}`,
                source: source.name,
                description: description || 'No description available'
              });
            }
          });
        }
        else if (source.name === 'huggingface') {
          $('.blog-post, article').each(function() {
            const title = $(this).find('h2, .title').text().trim();
            const url = $(this).find('a').attr('href');
            const description = $(this).find('.excerpt, .summary').text().trim();
            
            if (title && url) {
              articles.push({
                title,
                url: url.startsWith('http') ? url : `${source.base}${url}`,
                source: source.name,
                description: description || 'No description available'
              });
            }
          });
        }
        else if (source.name === 'forbes_ai') {
          $('.stream-item, article').each(function() {
            const title = $(this).find('h2, .stream-item__title').text().trim();
            const url = $(this).find('a').attr('href');
            const description = $(this).find('.stream-item__description, .excerpt').text().trim();
            
            if (title && url && isAIRelated(title, description)) {
              articles.push({
                title,
                url: url.startsWith('http') ? url : `${source.base}${url}`,
                source: source.name,
                description: description || 'No description available'
              });
            }
          });
        }
      } catch (err) {
        console.error(`Error scraping ${source.name}: ${err.message}`);
      }
    }

    // Filter articles to ensure they're AI-related (double check)
    const aiArticles = articles.filter(article => 
      isAIRelated(article.title, article.description)
    );

    if (debug) {
      console.log(`Found ${aiArticles.length} AI-related articles out of ${articles.length} total`);
      
      // Log count by source for debugging
      const sourceCounts = {};
      aiArticles.forEach(article => {
        sourceCounts[article.source] = (sourceCounts[article.source] || 0) + 1;
      });
      console.log('Articles per source:', sourceCounts);
    }

    // Return the results
    res.json({
      success: true,
      count: aiArticles.length,
      data: aiArticles.slice(0, limit),
      sources: Array.from(new Set(aiArticles.map(a => a.source)))
    });

  } catch (err) {
    console.error('Error fetching AI news:', err);
    res.status(500).json({
      success: false,
      message: 'Error fetching AI news',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// New endpoint to display news directly
app.get('/api/news', async (req, res) => {
  const limit = parseInt(req.query.limit) || 30;
  const sourceName = req.query.source;
  
  try {
    const articles = [];
    let sourcesToScrape = sources;
    
    // Filter sources if specified
    if (sourceName) {
      sourcesToScrape = sources.filter(s => s.name === sourceName);
      if (sourcesToScrape.length === 0) {
        return res.send(`<h1>Error</h1><p>Source "${sourceName}" not found</p>`);
      }
    }

    // Loop through each source - same as your existing code
    for (const source of sourcesToScrape) {
      try {
        const response = await axios.get(source.url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          },
          timeout: 10000 // 10 second timeout
        });
        
        const html = response.data;
        const $ = cheerio.load(html);
        
        // Your existing scraping code for each source...
        // (All the if/else blocks for different sources)
        
      } catch (err) {
        console.error(`Error scraping ${source.name}: ${err.message}`);
      }
    }

    // Filter articles to ensure they're AI-related
    const aiArticles = articles.filter(article => 
      isAIRelated(article.title, article.description)
    );

    // Group articles by source
    const articlesBySource = {};
    aiArticles.forEach(article => {
      if (!articlesBySource[article.source]) {
        articlesBySource[article.source] = [];
      }
      articlesBySource[article.source].push(article);
    });

    // Generate HTML
    let html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Latest AI News</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            color: #333;
          }
          header {
            background-color: #f4f4f4;
            padding: 20px;
            margin-bottom: 20px;
            border-radius: 5px;
          }
          h1 {
            color: #2c3e50;
          }
          h2 {
            color: #3498db;
            border-bottom: 1px solid #eee;
            padding-bottom: 10px;
          }
          .article {
            margin-bottom: 20px;
            padding: 15px;
            border-radius: 5px;
            background-color: #f9f9f9;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          .article h3 {
            margin-top: 0;
          }
          .article-source {
            color: #7f8c8d;
            font-size: 0.8em;
            text-transform: uppercase;
          }
          .article-description {
            color: #555;
          }
          a {
            color: #2980b9;
            text-decoration: none;
          }
          a:hover {
            text-decoration: underline;
          }
          .filters {
            margin-bottom: 20px;
            padding: 10px;
            background-color: #edf2f7;
            border-radius: 5px;
          }
          .source-section {
            margin-bottom: 30px;
          }
          .timestamp {
            font-size: 0.8em;
            color: #7f8c8d;
            text-align: center;
            margin-top: 30px;
            border-top: 1px solid #eee;
            padding-top: 10px;
          }
        </style>
      </head>
      <body>
        <header>
          <h1>Latest AI News</h1>
          <p>Collected from ${Object.keys(articlesBySource).length} sources • ${aiArticles.length} articles</p>
        </header>
        
        <div class="filters">
          <p>
            <strong>Filters:</strong> 
            <a href="/api/news">All Sources</a> • 
            <a href="/api/news?limit=10">Top 10</a> • 
            <a href="/api/news?limit=50">Top 50</a>
            ${Object.keys(articlesBySource).map(source => 
              `• <a href="/api/news?source=${source}">${source}</a>`
            ).join(' ')}
          </p>
        </div>
    `;

    // Add articles by source
    if (sourceName) {
      // If filtering by source, don't use sections
      html += `<div class="articles">`;
      aiArticles.slice(0, limit).forEach(article => {
        html += `
          <div class="article">
            <h3><a href="${article.url}" target="_blank">${article.title}</a></h3>
            <p class="article-source">Source: ${article.source}</p>
            <p class="article-description">${article.description}</p>
          </div>
        `;
      });
      html += `</div>`;
    } else {
      // Display by source sections when showing all
      Object.keys(articlesBySource).forEach(source => {
        const sourceArticles = articlesBySource[source].slice(0, Math.min(5, limit));
        
        html += `
          <div class="source-section">
            <h2>${source.charAt(0).toUpperCase() + source.slice(1)}</h2>
            <div class="articles">
        `;
        
        sourceArticles.forEach(article => {
          html += `
            <div class="article">
              <h3><a href="${article.url}" target="_blank">${article.title}</a></h3>
              <p class="article-description">${article.description}</p>
            </div>
          `;
        });
        
        html += `
            </div>
          </div>
        `;
      });
    }

    // Add timestamp and close HTML
    html += `
        <div class="timestamp">
          Data collected on ${new Date().toLocaleString()}
        </div>
      </body>
      </html>
    `;

    res.send(html);

  } catch (err) {
    console.error('Error fetching AI news:', err);
    res.status(500).send(`
      <h1>Error</h1>
      <p>Failed to fetch AI news</p>
      <p>${process.env.NODE_ENV === 'development' ? err.message : ''}</p>
    `);
  }
});

// Add endpoint for sources list
app.get('/api/sources', (req, res) => {
  res.json({
    success: true,
    count: sources.length,
    data: sources.map(s => ({name: s.name, url: s.url}))
  });
});

// Add a simple homepage
app.get('/', (req, res) => {
  res.send(`
    <h1>AI News Scraper API</h1>
    <p>Use <a href="/api/ai-news">/api/ai-news</a> to get the latest AI news.</p>
    <p>Add query parameters:</p>
    <ul>
      <li><code>?limit=10</code> to limit results</li>
      <li><code>?source=techcrunch</code> to filter by source</li>
      <li><code>?debug=true</code> for debugging info</li>
    </ul>
    <p>View available <a href="/api/sources">sources</a></p>
  `);
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Visit http://localhost:${PORT} to access the API`);
});