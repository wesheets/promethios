package client

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"math"
	"net/http"
	"os"
	"strconv"
	"time"
)

// ApiClient provides a Go client for API access with support for authentication,
// request handling, and response parsing.
type ApiClient struct {
	ApiKey      string
	BaseURL     string
	HttpClient  *http.Client
	MaxRetries  int
	RetryDelay  time.Duration
	RetryBackoff float64
	Headers     map[string]string
}

// ApiError represents an error returned by the API
type ApiError struct {
	Message  string
	Code     int
	Response map[string]interface{}
}

// Error implements the error interface for ApiError
func (e *ApiError) Error() string {
	return fmt.Sprintf("API Error %d: %s", e.Code, e.Message)
}

// NewApiClient creates a new API client with the given configuration
func NewApiClient(apiKey string, baseURL string, config map[string]interface{}) *ApiClient {
	// Use environment variables as fallbacks
	if apiKey == "" {
		apiKey = os.Getenv("API_KEY")
	}
	
	if baseURL == "" {
		baseURL = os.Getenv("API_BASE_URL")
		if baseURL == "" {
			baseURL = "https://api.example.com/v1"
		}
	}
	
	// Extract configuration values with defaults
	timeout := 30
	maxRetries := 3
	retryDelay := 1
	retryBackoff := 2.0
	
	if config != nil {
		if t, ok := config["timeout"].(int); ok {
			timeout = t
		}
		if r, ok := config["maxRetries"].(int); ok {
			maxRetries = r
		}
		if d, ok := config["retryDelay"].(int); ok {
			retryDelay = d
		}
		if b, ok := config["retryBackoff"].(float64); ok {
			retryBackoff = b
		}
	}
	
	// Initialize HTTP client with timeout
	httpClient := &http.Client{
		Timeout: time.Duration(timeout) * time.Second,
	}
	
	// Set default headers
	headers := map[string]string{
		"Content-Type": "application/json",
		"Accept":       "application/json",
		"User-Agent":   "Go-ApiClient/1.0",
	}
	
	// Set API key if provided
	if apiKey != "" {
		headers["Authorization"] = "Bearer " + apiKey
	}
	
	client := &ApiClient{
		ApiKey:       apiKey,
		BaseURL:      baseURL,
		HttpClient:   httpClient,
		MaxRetries:   maxRetries,
		RetryDelay:   time.Duration(retryDelay) * time.Second,
		RetryBackoff: retryBackoff,
		Headers:      headers,
	}
	
	fmt.Printf("Initialized API client with base URL: %s\n", baseURL)
	
	return client
}

// Request sends a request to the API with retry logic
func (c *ApiClient) Request(method string, endpoint string, params map[string]interface{}, 
                           data map[string]interface{}, headers map[string]string) (map[string]interface{}, error) {
	url := c.BaseURL + "/" + trimPrefix(endpoint, "/")
	
	// Add query parameters to URL if provided
	if params != nil && len(params) > 0 {
		url += "?"
		i := 0
		for k, v := range params {
			if i > 0 {
				url += "&"
			}
			url += fmt.Sprintf("%s=%v", k, v)
			i++
		}
	}
	
	// Prepare request body
	var reqBody io.Reader
	if data != nil {
		jsonData, err := json.Marshal(data)
		if err != nil {
			return nil, fmt.Errorf("error marshaling request data: %w", err)
		}
		reqBody = bytes.NewBuffer(jsonData)
	}
	
	// Create request
	req, err := http.NewRequest(method, url, reqBody)
	if err != nil {
		return nil, fmt.Errorf("error creating request: %w", err)
	}
	
	// Set headers
	for k, v := range c.Headers {
		req.Header.Set(k, v)
	}
	
	if headers != nil {
		for k, v := range headers {
			req.Header.Set(k, v)
		}
	}
	
	// Retry logic
	var resp *http.Response
	var responseData map[string]interface{}
	
	for retries := 0; retries <= c.MaxRetries; retries++ {
		if retries > 0 {
			delay := time.Duration(float64(c.RetryDelay) * math.Pow(c.RetryBackoff, float64(retries-1)))
			fmt.Printf("Retrying request in %v...\n", delay)
			time.Sleep(delay)
		}
		
		resp, err = c.HttpClient.Do(req)
		if err != nil {
			if retries == c.MaxRetries {
				return nil, fmt.Errorf("connection failed after %d retries: %w", c.MaxRetries, err)
			}
			fmt.Printf("Connection error: %s\n", err.Error())
			continue
		}
		
		// Check for rate limiting
		if resp.StatusCode == 429 {
			retryAfter := c.RetryDelay
			if s := resp.Header.Get("Retry-After"); s != "" {
				if seconds, err := strconv.Atoi(s); err == nil {
					retryAfter = time.Duration(seconds) * time.Second
				}
			}
			fmt.Printf("Rate limited. Retrying after %v.\n", retryAfter)
			resp.Body.Close()
			time.Sleep(retryAfter)
			continue
		}
		
		// Read and parse response body
		defer resp.Body.Close()
		body, err := io.ReadAll(resp.Body)
		if err != nil {
			if retries == c.MaxRetries {
				return nil, fmt.Errorf("error reading response body: %w", err)
			}
			fmt.Printf("Error reading response body: %s\n", err.Error())
			continue
		}
		
		// Parse JSON response
		if len(body) > 0 {
			err = json.Unmarshal(body, &responseData)
			if err != nil {
				responseData = map[string]interface{}{
					"raw_content": string(body),
				}
			}
		} else {
			responseData = make(map[string]interface{})
		}
		
		// Check for errors
		if resp.StatusCode >= 400 {
			errorMessage := "Unknown error"
			errorCode := resp.StatusCode
			
			if errorData, ok := responseData["error"].(map[string]interface{}); ok {
				if msg, ok := errorData["message"].(string); ok {
					errorMessage = msg
				}
				if code, ok := errorData["code"].(float64); ok {
					errorCode = int(code)
				}
			}
			
			// Server error, can retry
			if resp.StatusCode >= 500 && retries < c.MaxRetries {
				fmt.Printf("Server error: %s. Retrying...\n", errorMessage)
				continue
			}
			
			// Client error or max retries reached
			return nil, &ApiError{
				Message:  errorMessage,
				Code:     errorCode,
				Response: responseData,
			}
		}
		
		// Success
		return responseData, nil
	}
	
	// This should never happen, but just in case
	return nil, errors.New("unexpected error in request handling")
}

// Get sends a GET request to the API
func (c *ApiClient) Get(endpoint string, params map[string]interface{}) (map[string]interface{}, error) {
	return c.Request("GET", endpoint, params, nil, nil)
}

// Post sends a POST request to the API
func (c *ApiClient) Post(endpoint string, data map[string]interface{}) (map[string]interface{}, error) {
	return c.Request("POST", endpoint, nil, data, nil)
}

// PostWithParams sends a POST request to the API with query parameters
func (c *ApiClient) PostWithParams(endpoint string, data map[string]interface{}, params map[string]interface{}) (map[string]interface{}, error) {
	return c.Request("POST", endpoint, params, data, nil)
}

// Put sends a PUT request to the API
func (c *ApiClient) Put(endpoint string, data map[string]interface{}) (map[string]interface{}, error) {
	return c.Request("PUT", endpoint, nil, data, nil)
}

// Delete sends a DELETE request to the API
func (c *ApiClient) Delete(endpoint string) (map[string]interface{}, error) {
	return c.Request("DELETE", endpoint, nil, nil, nil)
}

// Patch sends a PATCH request to the API
func (c *ApiClient) Patch(endpoint string, data map[string]interface{}) (map[string]interface{}, error) {
	return c.Request("PATCH", endpoint, nil, data, nil)
}

// SetApiKey sets the API key for authentication
func (c *ApiClient) SetApiKey(apiKey string) {
	c.ApiKey = apiKey
	c.Headers["Authorization"] = "Bearer " + apiKey
	fmt.Println("Updated API key")
}

// SetBaseURL sets the base URL for API requests
func (c *ApiClient) SetBaseURL(baseURL string) {
	c.BaseURL = baseURL
	fmt.Printf("Updated base URL: %s\n", baseURL)
}

// Helper function to trim prefix from a string
func trimPrefix(s string, prefix string) string {
	if len(s) > 0 && s[0:len(prefix)] == prefix {
		return s[len(prefix):]
	}
	return s
}

// Resource represents a base API resource
type Resource struct {
	Client       *ApiClient
	BaseEndpoint string
}

// NewResource creates a new API resource
func NewResource(client *ApiClient, baseEndpoint string) *Resource {
	return &Resource{
		Client:       client,
		BaseEndpoint: trimSuffix(baseEndpoint, "/"),
	}
}

// GetEndpoint returns the full endpoint for a path
func (r *Resource) GetEndpoint(path string) string {
	if path == "" {
		return r.BaseEndpoint
	}
	return r.BaseEndpoint + "/" + trimPrefix(path, "/")
}

// List retrieves a list of resources
func (r *Resource) List(params map[string]interface{}) (map[string]interface{}, error) {
	return r.Client.Get(r.GetEndpoint(""), params)
}

// Get retrieves a resource by ID
func (r *Resource) Get(resourceID string, params map[string]interface{}) (map[string]interface{}, error) {
	return r.Client.Get(r.GetEndpoint(resourceID), params)
}

// Create creates a new resource
func (r *Resource) Create(data map[string]interface{}, params map[string]interface{}) (map[string]interface{}, error) {
	if params != nil {
		return r.Client.PostWithParams(r.GetEndpoint(""), data, params)
	}
	return r.Client.Post(r.GetEndpoint(""), data)
}

// Update updates a resource
func (r *Resource) Update(resourceID string, data map[string]interface{}) (map[string]interface{}, error) {
	return r.Client.Put(r.GetEndpoint(resourceID), data)
}

// Delete deletes a resource
func (r *Resource) Delete(resourceID string) (map[string]interface{}, error) {
	return r.Client.Delete(r.GetEndpoint(resourceID))
}

// Patch partially updates a resource
func (r *Resource) Patch(resourceID string, data map[string]interface{}) (map[string]interface{}, error) {
	return r.Client.Patch(r.GetEndpoint(resourceID), data)
}

// Helper function to trim suffix from a string
func trimSuffix(s string, suffix string) string {
	if len(s) >= len(suffix) && s[len(s)-len(suffix):] == suffix {
		return s[:len(s)-len(suffix)]
	}
	return s
}

// AccessTierResource provides access to the access tier API endpoints
type AccessTierResource struct {
	*Resource
}

// NewAccessTierResource creates a new access tier resource
func NewAccessTierResource(client *ApiClient) *AccessTierResource {
	return &AccessTierResource{
		Resource: NewResource(client, "access-tiers"),
	}
}

// GetCurrent retrieves the current user's access tier
func (r *AccessTierResource) GetCurrent() (map[string]interface{}, error) {
	return r.Client.Get(r.GetEndpoint("current"), nil)
}

// RequestUpgrade requests an upgrade to a new tier
func (r *AccessTierResource) RequestUpgrade(tierID string) (map[string]interface{}, error) {
	data := map[string]interface{}{
		"tier_id": tierID,
	}
	return r.Client.Post(r.GetEndpoint("request-upgrade"), data)
}

// GetUpgradeStatus retrieves the status of a tier upgrade request
func (r *AccessTierResource) GetUpgradeStatus(requestID string) (map[string]interface{}, error) {
	return r.Client.Get(r.GetEndpoint("upgrade-status/"+requestID), nil)
}

// GetQuotaUsage retrieves the current user's quota usage
func (r *AccessTierResource) GetQuotaUsage() (map[string]interface{}, error) {
	return r.Client.Get(r.GetEndpoint("quota-usage"), nil)
}

// ApiKeyResource provides access to the API key API endpoints
type ApiKeyResource struct {
	*Resource
}

// NewApiKeyResource creates a new API key resource
func NewApiKeyResource(client *ApiClient) *ApiKeyResource {
	return &ApiKeyResource{
		Resource: NewResource(client, "api-keys"),
	}
}

// CreateKey creates a new API key
func (r *ApiKeyResource) CreateKey(name string, expiryDays int) (map[string]interface{}, error) {
	data := make(map[string]interface{})
	
	if name != "" {
		data["name"] = name
	}
	
	if expiryDays > 0 {
		data["expiry_days"] = expiryDays
	}
	
	return r.Client.Post(r.GetEndpoint(""), data)
}

// RevokeKey revokes an API key
func (r *ApiKeyResource) RevokeKey(keyID string) (map[string]interface{}, error) {
	return r.Client.Delete(r.GetEndpoint(keyID))
}

// GetCurrent retrieves the current API key information
func (r *ApiKeyResource) GetCurrent() (map[string]interface{}, error) {
	return r.Client.Get(r.GetEndpoint("current"), nil)
}

// UserResource provides access to the user API endpoints
type UserResource struct {
	*Resource
}

// NewUserResource creates a new user resource
func NewUserResource(client *ApiClient) *UserResource {
	return &UserResource{
		Resource: NewResource(client, "users"),
	}
}

// GetProfile retrieves the current user's profile
func (r *UserResource) GetProfile() (map[string]interface{}, error) {
	return r.Client.Get(r.GetEndpoint("profile"), nil)
}

// UpdateProfile updates the current user's profile
func (r *UserResource) UpdateProfile(data map[string]interface{}) (map[string]interface{}, error) {
	return r.Client.Put(r.GetEndpoint("profile"), data)
}

// GetPreferences retrieves the current user's preferences
func (r *UserResource) GetPreferences() (map[string]interface{}, error) {
	return r.Client.Get(r.GetEndpoint("preferences"), nil)
}

// UpdatePreferences updates the current user's preferences
func (r *UserResource) UpdatePreferences(data map[string]interface{}) (map[string]interface{}, error) {
	return r.Client.Put(r.GetEndpoint("preferences"), data)
}

// SandboxResource provides access to the sandbox API endpoints
type SandboxResource struct {
	*Resource
}

// NewSandboxResource creates a new sandbox resource
func NewSandboxResource(client *ApiClient) *SandboxResource {
	return &SandboxResource{
		Resource: NewResource(client, "sandbox"),
	}
}

// CreateEnvironment creates a new sandbox environment
func (r *SandboxResource) CreateEnvironment(name string, template string) (map[string]interface{}, error) {
	data := make(map[string]interface{})
	
	if name != "" {
		data["name"] = name
	}
	
	if template != "" {
		data["template"] = template
	}
	
	return r.Client.Post(r.GetEndpoint("environments"), data)
}

// GetEnvironment retrieves a sandbox environment
func (r *SandboxResource) GetEnvironment(environmentID string) (map[string]interface{}, error) {
	return r.Client.Get(r.GetEndpoint("environments/"+environmentID), nil)
}

// DeleteEnvironment deletes a sandbox environment
func (r *SandboxResource) DeleteEnvironment(environmentID string) (map[string]interface{}, error) {
	return r.Client.Delete(r.GetEndpoint("environments/" + environmentID))
}

// ExecuteRequest executes a request in the sandbox environment
func (r *SandboxResource) ExecuteRequest(environmentID string, endpoint string, method string, data map[string]interface{}) (map[string]interface{}, error) {
	requestData := map[string]interface{}{
		"endpoint": endpoint,
		"method":   method,
	}
	
	if data != nil {
		requestData["data"] = data
	}
	
	return r.Client.Post(r.GetEndpoint("environments/"+environmentID+"/execute"), requestData)
}

// FeedbackResource provides access to the feedback API endpoints
type FeedbackResource struct {
	*Resource
}

// NewFeedbackResource creates a new feedback resource
func NewFeedbackResource(client *ApiClient) *FeedbackResource {
	return &FeedbackResource{
		Resource: NewResource(client, "feedback"),
	}
}

// Submit submits feedback
func (r *FeedbackResource) Submit(feedbackType string, content string, metadata map[string]interface{}) (map[string]interface{}, error) {
	data := map[string]interface{}{
		"type":    feedbackType,
		"content": content,
	}
	
	if metadata != nil {
		data["metadata"] = metadata
	}
	
	return r.Client.Post(r.GetEndpoint(""), data)
}

// GetSubmissions retrieves the current user's feedback submissions
func (r *FeedbackResource) GetSubmissions() (map[string]interface{}, error) {
	return r.Client.Get(r.GetEndpoint("submissions"), nil)
}

// GetSubmission retrieves a feedback submission
func (r *FeedbackResource) GetSubmission(submissionID string) (map[string]interface{}, error) {
	return r.Client.Get(r.GetEndpoint("submissions/"+submissionID), nil)
}

// Client is the main client for the API
type Client struct {
	ApiClient    *ApiClient
	AccessTiers  *AccessTierResource
	ApiKeys      *ApiKeyResource
	Users        *UserResource
	Sandbox      *SandboxResource
	Feedback     *FeedbackResource
}

// NewClient creates a new API client
func NewClient(apiKey string, baseURL string, config map[string]interface{}) *Client {
	apiClient := NewApiClient(apiKey, baseURL, config)
	
	return &Client{
		ApiClient:    apiClient,
		AccessTiers:  NewAccessTierResource(apiClient),
		ApiKeys:      NewApiKeyResource(apiClient),
		Users:        NewUserResource(apiClient),
		Sandbox:      NewSandboxResource(apiClient),
		Feedback:     NewFeedbackResource(apiClient),
	}
}

// SetApiKey sets the API key for authentication
func (c *Client) SetApiKey(apiKey string) {
	c.ApiClient.SetApiKey(apiKey)
}

// SetBaseURL sets the base URL for API requests
func (c *Client) SetBaseURL(baseURL string) {
	c.ApiClient.SetBaseURL(baseURL)
}
