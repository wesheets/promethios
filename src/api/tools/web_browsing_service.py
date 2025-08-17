"""
Real Web Browsing Service for Promethios Agents

Provides actual web browsing and automation capabilities with governance oversight.
Implements the same capabilities as Manus agents for autonomous web interaction.
"""

import os
import asyncio
import json
import tempfile
import base64
from typing import Dict, List, Any, Optional, Union
from datetime import datetime
import logging
from urllib.parse import urljoin, urlparse
import requests
from bs4 import BeautifulSoup
import selenium
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from selenium.common.exceptions import TimeoutException, WebDriverException

logger = logging.getLogger(__name__)

class WebBrowsingService:
    """Real web browsing service with governance integration."""
    
    def __init__(self, governance_adapter=None, base_workspace: str = None):
        """Initialize web browsing service.
        
        Args:
            governance_adapter: Universal Governance Adapter for oversight
            base_workspace: Base workspace directory for downloads and screenshots
        """
        self.governance_adapter = governance_adapter
        self.base_workspace = base_workspace or "/tmp/promethios_workspace"
        
        # Create workspace if it doesn't exist
        os.makedirs(self.base_workspace, exist_ok=True)
        
        # Security settings
        self.max_page_load_time = 30  # seconds
        self.max_script_execution_time = 10  # seconds
        self.max_download_size = 100 * 1024 * 1024  # 100MB
        
        # Allowed domains (whitelist approach for security)
        self.allowed_domains = {
            # Search engines
            'google.com', 'bing.com', 'duckduckgo.com',
            # Documentation sites
            'stackoverflow.com', 'github.com', 'docs.python.org', 'developer.mozilla.org',
            # News and information
            'wikipedia.org', 'reddit.com', 'news.ycombinator.com',
            # Development tools
            'npmjs.com', 'pypi.org', 'packagist.org',
            # Cloud services (documentation)
            'aws.amazon.com', 'cloud.google.com', 'azure.microsoft.com'
        }
        
        # Blocked domains (security)
        self.blocked_domains = {
            # Social media with personal data
            'facebook.com', 'twitter.com', 'instagram.com', 'linkedin.com',
            # Financial services
            'paypal.com', 'stripe.com', 'square.com',
            # Email services
            'gmail.com', 'outlook.com', 'yahoo.com'
        }
        
        # Browser driver
        self.driver = None
        self.driver_options = self._setup_browser_options()
        
        logger.info(f"WebBrowsingService initialized with workspace: {self.base_workspace}")
    
    def _setup_browser_options(self) -> Options:
        """Setup Chrome browser options for security and performance."""
        options = Options()
        
        # Security options
        options.add_argument("--no-sandbox")
        options.add_argument("--disable-dev-shm-usage")
        options.add_argument("--disable-gpu")
        options.add_argument("--disable-extensions")
        options.add_argument("--disable-plugins")
        options.add_argument("--disable-images")  # Faster loading
        options.add_argument("--disable-javascript")  # Can be enabled per request
        
        # Privacy options
        options.add_argument("--incognito")
        options.add_argument("--disable-web-security")
        options.add_argument("--disable-features=VizDisplayCompositor")
        
        # Performance options
        options.add_argument("--memory-pressure-off")
        options.add_argument("--max_old_space_size=4096")
        
        # Headless mode
        options.add_argument("--headless")
        
        # Download directory
        prefs = {
            "download.default_directory": self.base_workspace,
            "download.prompt_for_download": False,
            "download.directory_upgrade": True,
            "safebrowsing.enabled": True
        }
        options.add_experimental_option("prefs", prefs)
        
        return options
    
    async def navigate_to_url(self, url: str, agent_id: str, 
                             enable_javascript: bool = False) -> Dict[str, Any]:
        """Navigate to URL with governance oversight."""
        try:
            # Governance check
            if self.governance_adapter:
                governance_result = await self.governance_adapter.validate_action(
                    agent_id=agent_id,
                    action_type="web_navigate",
                    parameters={"url": url, "enable_javascript": enable_javascript}
                )
                if not governance_result.get("approved", False):
                    return {
                        "success": False,
                        "error": f"Governance denied web navigation: {governance_result.get('reason', 'Unknown')}"
                    }
            
            # Validate URL
            parsed_url = urlparse(url)
            if not parsed_url.scheme or not parsed_url.netloc:
                return {"success": False, "error": "Invalid URL format"}
            
            # Check domain whitelist/blacklist
            domain = parsed_url.netloc.lower()
            if any(blocked in domain for blocked in self.blocked_domains):
                return {"success": False, "error": f"Domain blocked for security: {domain}"}
            
            if not any(allowed in domain for allowed in self.allowed_domains):
                return {"success": False, "error": f"Domain not in whitelist: {domain}"}
            
            # Initialize browser if needed
            if not self.driver:
                await self._initialize_browser(enable_javascript)
            
            start_time = datetime.now()
            
            # Navigate to URL
            try:
                self.driver.set_page_load_timeout(self.max_page_load_time)
                self.driver.get(url)
                
                # Wait for page to load
                WebDriverWait(self.driver, 10).until(
                    EC.presence_of_element_located((By.TAG_NAME, "body"))
                )
                
                # Get page information
                page_title = self.driver.title
                current_url = self.driver.current_url
                page_source = self.driver.page_source
                
                # Parse content with BeautifulSoup
                soup = BeautifulSoup(page_source, 'html.parser')
                
                # Extract text content
                text_content = soup.get_text(separator=' ', strip=True)
                
                # Extract links
                links = []
                for link in soup.find_all('a', href=True):
                    href = link['href']
                    absolute_url = urljoin(current_url, href)
                    links.append({
                        "text": link.get_text(strip=True),
                        "url": absolute_url,
                        "relative_url": href
                    })
                
                # Extract images
                images = []
                for img in soup.find_all('img', src=True):
                    src = img['src']
                    absolute_url = urljoin(current_url, src)
                    images.append({
                        "alt": img.get('alt', ''),
                        "url": absolute_url,
                        "relative_url": src
                    })
                
                end_time = datetime.now()
                load_time = (end_time - start_time).total_seconds()
                
                return {
                    "success": True,
                    "url": url,
                    "current_url": current_url,
                    "title": page_title,
                    "text_content": text_content[:10000],  # Limit to 10KB
                    "links": links[:50],  # Limit to 50 links
                    "images": images[:20],  # Limit to 20 images
                    "load_time": load_time,
                    "navigated_at": start_time.isoformat(),
                    "content_length": len(page_source)
                }
                
            except TimeoutException:
                return {
                    "success": False,
                    "error": f"Page load timeout after {self.max_page_load_time} seconds"
                }
            except WebDriverException as e:
                return {"success": False, "error": f"Browser error: {str(e)}"}
                
        except Exception as e:
            logger.error(f"Error navigating to {url}: {str(e)}")
            return {"success": False, "error": f"Navigation failed: {str(e)}"}
    
    async def search_web(self, query: str, search_engine: str, agent_id: str) -> Dict[str, Any]:
        """Perform web search with governance oversight."""
        try:
            # Governance check
            if self.governance_adapter:
                governance_result = await self.governance_adapter.validate_action(
                    agent_id=agent_id,
                    action_type="web_search",
                    parameters={"query": query, "search_engine": search_engine}
                )
                if not governance_result.get("approved", False):
                    return {
                        "success": False,
                        "error": f"Governance denied web search: {governance_result.get('reason', 'Unknown')}"
                    }
            
            # Validate search engine
            search_engines = {
                "google": "https://www.google.com/search?q=",
                "bing": "https://www.bing.com/search?q=",
                "duckduckgo": "https://duckduckgo.com/?q="
            }
            
            if search_engine not in search_engines:
                return {"success": False, "error": f"Unsupported search engine: {search_engine}"}
            
            # Construct search URL
            search_url = search_engines[search_engine] + requests.utils.quote(query)
            
            # Perform search navigation
            result = await self.navigate_to_url(search_url, agent_id, enable_javascript=True)
            
            if result["success"]:
                # Extract search results
                search_results = self._extract_search_results(result, search_engine)
                result["search_results"] = search_results
                result["query"] = query
                result["search_engine"] = search_engine
            
            return result
            
        except Exception as e:
            logger.error(f"Error searching web for '{query}': {str(e)}")
            return {"success": False, "error": f"Web search failed: {str(e)}"}
    
    def _extract_search_results(self, navigation_result: Dict, search_engine: str) -> List[Dict]:
        """Extract search results from navigation result."""
        try:
            # This is a simplified extraction - in practice, you'd need more sophisticated parsing
            # for each search engine's specific HTML structure
            
            results = []
            links = navigation_result.get("links", [])
            
            # Filter and format search results
            for link in links[:10]:  # Top 10 results
                if link["url"] and link["text"]:
                    # Skip internal search engine links
                    if search_engine not in link["url"].lower():
                        results.append({
                            "title": link["text"][:200],  # Limit title length
                            "url": link["url"],
                            "snippet": ""  # Would need more sophisticated extraction
                        })
            
            return results
            
        except Exception as e:
            logger.error(f"Error extracting search results: {str(e)}")
            return []
    
    async def take_screenshot(self, agent_id: str, filename: str = None) -> Dict[str, Any]:
        """Take screenshot of current page with governance oversight."""
        try:
            # Governance check
            if self.governance_adapter:
                governance_result = await self.governance_adapter.validate_action(
                    agent_id=agent_id,
                    action_type="web_screenshot",
                    parameters={"filename": filename}
                )
                if not governance_result.get("approved", False):
                    return {
                        "success": False,
                        "error": f"Governance denied screenshot: {governance_result.get('reason', 'Unknown')}"
                    }
            
            if not self.driver:
                return {"success": False, "error": "Browser not initialized"}
            
            # Generate filename if not provided
            if not filename:
                timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                filename = f"screenshot_{agent_id}_{timestamp}.png"
            
            screenshot_path = os.path.join(self.base_workspace, filename)
            
            # Take screenshot
            success = self.driver.save_screenshot(screenshot_path)
            
            if success:
                # Get file size
                file_size = os.path.getsize(screenshot_path)
                
                return {
                    "success": True,
                    "screenshot_path": screenshot_path,
                    "filename": filename,
                    "file_size": file_size,
                    "taken_at": datetime.now().isoformat()
                }
            else:
                return {"success": False, "error": "Failed to save screenshot"}
                
        except Exception as e:
            logger.error(f"Error taking screenshot: {str(e)}")
            return {"success": False, "error": f"Screenshot failed: {str(e)}"}
    
    async def extract_page_data(self, url: str, agent_id: str, 
                              data_selectors: Dict[str, str] = None) -> Dict[str, Any]:
        """Extract specific data from web page using CSS selectors."""
        try:
            # Navigate to page first
            nav_result = await self.navigate_to_url(url, agent_id, enable_javascript=True)
            
            if not nav_result["success"]:
                return nav_result
            
            if not data_selectors:
                return nav_result  # Return basic page data
            
            # Extract specific data using selectors
            extracted_data = {}
            
            for key, selector in data_selectors.items():
                try:
                    elements = self.driver.find_elements(By.CSS_SELECTOR, selector)
                    
                    if elements:
                        if len(elements) == 1:
                            extracted_data[key] = elements[0].text.strip()
                        else:
                            extracted_data[key] = [elem.text.strip() for elem in elements]
                    else:
                        extracted_data[key] = None
                        
                except Exception as e:
                    extracted_data[key] = f"Error: {str(e)}"
            
            nav_result["extracted_data"] = extracted_data
            return nav_result
            
        except Exception as e:
            logger.error(f"Error extracting data from {url}: {str(e)}")
            return {"success": False, "error": f"Data extraction failed: {str(e)}"}
    
    async def _initialize_browser(self, enable_javascript: bool = False):
        """Initialize browser driver."""
        try:
            # Modify options for JavaScript if needed
            options = self.driver_options
            if enable_javascript:
                # Remove the disable-javascript argument
                args = [arg for arg in options.arguments if arg != "--disable-javascript"]
                options = Options()
                for arg in args:
                    options.add_argument(arg)
            
            # Initialize Chrome driver
            self.driver = webdriver.Chrome(options=options)
            
            # Set timeouts
            self.driver.implicitly_wait(10)
            self.driver.set_script_timeout(self.max_script_execution_time)
            
            logger.info("Browser driver initialized successfully")
            
        except Exception as e:
            logger.error(f"Failed to initialize browser: {str(e)}")
            raise
    
    async def close_browser(self, agent_id: str) -> Dict[str, Any]:
        """Close browser session."""
        try:
            if self.driver:
                self.driver.quit()
                self.driver = None
                
            return {
                "success": True,
                "message": "Browser session closed",
                "closed_at": datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error closing browser: {str(e)}")
            return {"success": False, "error": f"Failed to close browser: {str(e)}"}
    
    def __del__(self):
        """Cleanup browser on service destruction."""
        try:
            if self.driver:
                self.driver.quit()
        except Exception:
            pass

