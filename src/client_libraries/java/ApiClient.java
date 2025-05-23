package com.example.api.client;

import com.fasterxml.jackson.databind.ObjectMapper;
import okhttp3.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.time.Duration;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.TimeUnit;

/**
 * Java Client Library for API Access
 *
 * This module provides a Java client library for accessing the API,
 * with support for authentication, request handling, and response parsing.
 */
public class ApiClient {
    private static final Logger logger = LoggerFactory.getLogger(ApiClient.class);
    private static final MediaType JSON = MediaType.parse("application/json; charset=utf-8");
    
    private final OkHttpClient httpClient;
    private final ObjectMapper objectMapper;
    private final String baseUrl;
    private String apiKey;
    private final Map<String, String> defaultHeaders;
    private final int maxRetries;
    private final long retryDelay;
    private final double retryBackoff;
    
    /**
     * Initialize the API client
     *
     * @param apiKey API key for authentication
     * @param baseUrl Base URL for API requests
     * @param config Additional configuration options
     */
    public ApiClient(String apiKey, String baseUrl, Map<String, Object> config) {
        this.apiKey = apiKey != null ? apiKey : System.getenv("API_KEY");
        this.baseUrl = baseUrl != null ? baseUrl : System.getenv().getOrDefault("API_BASE_URL", "https://api.example.com/v1");
        
        Map<String, Object> configMap = config != null ? config : new HashMap<>();
        
        // Extract configuration values
        int timeout = getConfigInt(configMap, "timeout", 30);
        this.maxRetries = getConfigInt(configMap, "maxRetries", 3);
        this.retryDelay = getConfigInt(configMap, "retryDelay", 1);
        this.retryBackoff = getConfigDouble(configMap, "retryBackoff", 2.0);
        boolean verifySSL = getConfigBoolean(configMap, "verifySSL", true);
        
        // Initialize HTTP client
        OkHttpClient.Builder builder = new OkHttpClient.Builder()
                .connectTimeout(timeout, TimeUnit.SECONDS)
                .readTimeout(timeout, TimeUnit.SECONDS)
                .writeTimeout(timeout, TimeUnit.SECONDS);
        
        if (!verifySSL) {
            // This should only be used in development environments
            logger.warn("SSL verification is disabled. This is not recommended for production use.");
            // Code to disable SSL verification would go here
        }
        
        this.httpClient = builder.build();
        this.objectMapper = new ObjectMapper();
        
        // Set default headers
        this.defaultHeaders = new HashMap<>();
        this.defaultHeaders.put("Content-Type", "application/json");
        this.defaultHeaders.put("Accept", "application/json");
        this.defaultHeaders.put("User-Agent", "Java-ApiClient/1.0");
        
        // Set API key if provided
        if (this.apiKey != null) {
            this.defaultHeaders.put("Authorization", "Bearer " + this.apiKey);
        }
        
        logger.info("Initialized API client with base URL: {}", this.baseUrl);
    }
    
    /**
     * Initialize the API client with default configuration
     *
     * @param apiKey API key for authentication
     * @param baseUrl Base URL for API requests
     */
    public ApiClient(String apiKey, String baseUrl) {
        this(apiKey, baseUrl, null);
    }
    
    /**
     * Initialize the API client with default configuration and base URL
     *
     * @param apiKey API key for authentication
     */
    public ApiClient(String apiKey) {
        this(apiKey, null, null);
    }
    
    /**
     * Initialize the API client with default configuration
     */
    public ApiClient() {
        this(null, null, null);
    }
    
    /**
     * Get an integer configuration value
     *
     * @param config Configuration map
     * @param key Configuration key
     * @param defaultValue Default value
     * @return Configuration value
     */
    private int getConfigInt(Map<String, Object> config, String key, int defaultValue) {
        Object value = config.get(key);
        if (value instanceof Number) {
            return ((Number) value).intValue();
        }
        return defaultValue;
    }
    
    /**
     * Get a double configuration value
     *
     * @param config Configuration map
     * @param key Configuration key
     * @param defaultValue Default value
     * @return Configuration value
     */
    private double getConfigDouble(Map<String, Object> config, String key, double defaultValue) {
        Object value = config.get(key);
        if (value instanceof Number) {
            return ((Number) value).doubleValue();
        }
        return defaultValue;
    }
    
    /**
     * Get a boolean configuration value
     *
     * @param config Configuration map
     * @param key Configuration key
     * @param defaultValue Default value
     * @return Configuration value
     */
    private boolean getConfigBoolean(Map<String, Object> config, String key, boolean defaultValue) {
        Object value = config.get(key);
        if (value instanceof Boolean) {
            return (Boolean) value;
        }
        return defaultValue;
    }
    
    /**
     * Send a request to the API
     *
     * @param method HTTP method (GET, POST, PUT, DELETE, etc.)
     * @param endpoint API endpoint (without base URL)
     * @param params Query parameters
     * @param data Request body data
     * @param headers Additional headers
     * @return API response
     * @throws ApiException If the API returns an error
     * @throws IOException If there's a network error
     */
    public Map<String, Object> request(String method, String endpoint, Map<String, Object> params,
                                      Map<String, Object> data, Map<String, String> headers) throws ApiException, IOException {
        String url = this.baseUrl + "/" + endpoint.replaceFirst("^/", "");
        
        // Add query parameters to URL if provided
        if (params != null && !params.isEmpty()) {
            StringBuilder queryString = new StringBuilder();
            for (Map.Entry<String, Object> entry : params.entrySet()) {
                if (queryString.length() > 0) {
                    queryString.append("&");
                } else {
                    queryString.append("?");
                }
                queryString.append(entry.getKey()).append("=").append(entry.getValue());
            }
            url += queryString.toString();
        }
        
        // Prepare request headers
        Headers.Builder headersBuilder = new Headers.Builder();
        for (Map.Entry<String, String> entry : this.defaultHeaders.entrySet()) {
            headersBuilder.add(entry.getKey(), entry.getValue());
        }
        
        if (headers != null) {
            for (Map.Entry<String, String> entry : headers.entrySet()) {
                headersBuilder.add(entry.getKey(), entry.getValue());
            }
        }
        
        // Prepare request body
        RequestBody requestBody = null;
        if (data != null) {
            String jsonData = this.objectMapper.writeValueAsString(data);
            requestBody = RequestBody.create(jsonData, JSON);
        }
        
        // Build request
        Request.Builder requestBuilder = new Request.Builder()
                .url(url)
                .headers(headersBuilder.build());
        
        switch (method.toUpperCase()) {
            case "GET":
                requestBuilder.get();
                break;
            case "POST":
                requestBuilder.post(requestBody != null ? requestBody : RequestBody.create("", null));
                break;
            case "PUT":
                requestBuilder.put(requestBody != null ? requestBody : RequestBody.create("", null));
                break;
            case "DELETE":
                requestBuilder.delete(requestBody);
                break;
            case "PATCH":
                requestBuilder.patch(requestBody != null ? requestBody : RequestBody.create("", null));
                break;
            default:
                requestBuilder.method(method, requestBody);
        }
        
        Request request = requestBuilder.build();
        
        // Retry logic
        int retries = 0;
        while (true) {
            try {
                Response response = this.httpClient.newCall(request).execute();
                
                // Check for rate limiting
                if (response.code() == 429) {
                    String retryAfterHeader = response.header("Retry-After");
                    long retryAfter = retryAfterHeader != null ? Long.parseLong(retryAfterHeader) : this.retryDelay;
                    logger.warn("Rate limited. Retrying after {} seconds.", retryAfter);
                    Thread.sleep(retryAfter * 1000);
                    continue;
                }
                
                // Parse response
                String responseBody = response.body() != null ? response.body().string() : "";
                Map<String, Object> responseData;
                
                if (!responseBody.isEmpty()) {
                    try {
                        responseData = this.objectMapper.readValue(responseBody, Map.class);
                    } catch (Exception e) {
                        responseData = new HashMap<>();
                        responseData.put("raw_content", responseBody);
                    }
                } else {
                    responseData = new HashMap<>();
                }
                
                // Check for errors
                if (response.code() >= 400) {
                    Map<String, Object> error = (Map<String, Object>) responseData.getOrDefault("error", new HashMap<>());
                    String errorMessage = (String) error.getOrDefault("message", "Unknown error");
                    int errorCode = error.containsKey("code") ? ((Number) error.get("code")).intValue() : response.code();
                    
                    if (response.code() >= 500) {
                        // Server error, can retry
                        if (retries < this.maxRetries) {
                            retries++;
                            long delay = (long) (this.retryDelay * Math.pow(this.retryBackoff, retries));
                            logger.warn("Server error: {}. Retrying in {} seconds.", errorMessage, delay);
                            Thread.sleep(delay * 1000);
                            continue;
                        }
                    }
                    
                    // Client error or max retries reached
                    throw new ApiException(errorMessage, errorCode, responseData);
                }
                
                // Success
                return responseData;
            } catch (IOException e) {
                if (retries < this.maxRetries) {
                    retries++;
                    long delay = (long) (this.retryDelay * Math.pow(this.retryBackoff, retries));
                    logger.warn("Connection error: {}. Retrying in {} seconds.", e.getMessage(), delay);
                    try {
                        Thread.sleep(delay * 1000);
                    } catch (InterruptedException ie) {
                        Thread.currentThread().interrupt();
                        throw new IOException("Request interrupted", e);
                    }
                } else {
                    throw new IOException("Connection failed after " + this.maxRetries + " retries: " + e.getMessage(), e);
                }
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                throw new IOException("Request interrupted", e);
            }
        }
    }
    
    /**
     * Send a GET request to the API
     *
     * @param endpoint API endpoint
     * @return API response
     * @throws ApiException If the API returns an error
     * @throws IOException If there's a network error
     */
    public Map<String, Object> get(String endpoint) throws ApiException, IOException {
        return this.request("GET", endpoint, null, null, null);
    }
    
    /**
     * Send a GET request to the API
     *
     * @param endpoint API endpoint
     * @param params Query parameters
     * @return API response
     * @throws ApiException If the API returns an error
     * @throws IOException If there's a network error
     */
    public Map<String, Object> get(String endpoint, Map<String, Object> params) throws ApiException, IOException {
        return this.request("GET", endpoint, params, null, null);
    }
    
    /**
     * Send a POST request to the API
     *
     * @param endpoint API endpoint
     * @param data Request body data
     * @return API response
     * @throws ApiException If the API returns an error
     * @throws IOException If there's a network error
     */
    public Map<String, Object> post(String endpoint, Map<String, Object> data) throws ApiException, IOException {
        return this.request("POST", endpoint, null, data, null);
    }
    
    /**
     * Send a POST request to the API
     *
     * @param endpoint API endpoint
     * @param data Request body data
     * @param params Query parameters
     * @return API response
     * @throws ApiException If the API returns an error
     * @throws IOException If there's a network error
     */
    public Map<String, Object> post(String endpoint, Map<String, Object> data, Map<String, Object> params) throws ApiException, IOException {
        return this.request("POST", endpoint, params, data, null);
    }
    
    /**
     * Send a PUT request to the API
     *
     * @param endpoint API endpoint
     * @param data Request body data
     * @return API response
     * @throws ApiException If the API returns an error
     * @throws IOException If there's a network error
     */
    public Map<String, Object> put(String endpoint, Map<String, Object> data) throws ApiException, IOException {
        return this.request("PUT", endpoint, null, data, null);
    }
    
    /**
     * Send a DELETE request to the API
     *
     * @param endpoint API endpoint
     * @return API response
     * @throws ApiException If the API returns an error
     * @throws IOException If there's a network error
     */
    public Map<String, Object> delete(String endpoint) throws ApiException, IOException {
        return this.request("DELETE", endpoint, null, null, null);
    }
    
    /**
     * Send a PATCH request to the API
     *
     * @param endpoint API endpoint
     * @param data Request body data
     * @return API response
     * @throws ApiException If the API returns an error
     * @throws IOException If there's a network error
     */
    public Map<String, Object> patch(String endpoint, Map<String, Object> data) throws ApiException, IOException {
        return this.request("PATCH", endpoint, null, data, null);
    }
    
    /**
     * Set the API key for authentication
     *
     * @param apiKey API key
     */
    public void setApiKey(String apiKey) {
        this.apiKey = apiKey;
        this.defaultHeaders.put("Authorization", "Bearer " + apiKey);
        logger.info("Updated API key");
    }
    
    /**
     * Get the API key
     *
     * @return API key
     */
    public String getApiKey() {
        return this.apiKey;
    }
    
    /**
     * Get the base URL
     *
     * @return Base URL
     */
    public String getBaseUrl() {
        return this.baseUrl;
    }
}
