# Manual Testing Guide: Governance UI & Agent Data Flow

This guide provides step-by-step manual testing procedures to validate that deployed Promethios agents properly send data to the governance UI and that all governance pages function correctly.

## Prerequisites

### Required Information
- ✅ **Deployed Agent Endpoint**: `https://deployed-agent-{id}.promethios.ai`
- ✅ **Agent API Key**: `promethios_agent_{key}`
- ✅ **Promethios UI URL**: `https://promethios-ui.vercel.app`
- ✅ **User Account**: Logged into Promethios UI

### Browser Setup
- Use **Chrome or Firefox** (latest version)
- **Open Developer Tools** (F12) to monitor console logs
- **Disable ad blockers** that might interfere with API calls
- **Clear browser cache** if experiencing issues

---

## Phase 1: Governance UI Accessibility (15 minutes)

### Step 1.1: Test All Governance Pages Load

Navigate to each governance page and verify it loads without errors:

#### 🎯 **Trust Metrics Page**
1. Go to: `https://promethios-ui.vercel.app/ui/governance/trust-metrics`
2. **Expected**: Page loads with trust metrics dashboard
3. **Check for**:
   - ✅ No 404 or 500 errors
   - ✅ Page title contains "Trust" or "Metrics"
   - ✅ Charts, graphs, or data tables visible
   - ✅ No JavaScript errors in console

#### 📊 **Live Monitoring Page**
1. Go to: `https://promethios-ui.vercel.app/ui/governance/live-monitoring`
2. **Expected**: Real-time monitoring dashboard
3. **Check for**:
   - ✅ Agent status indicators (Healthy/Warning/Error)
   - ✅ Real-time data updates or refresh functionality
   - ✅ Agent list or monitoring cards
   - ✅ Timestamps showing recent activity

#### ⚠️ **Violations Page**
1. Go to: `https://promethios-ui.vercel.app/ui/governance/violations`
2. **Expected**: Policy violations dashboard
3. **Check for**:
   - ✅ Violations list or table
   - ✅ Filtering/search functionality
   - ✅ Violation details (severity, timestamp, agent)
   - ✅ Resolution status indicators

#### 🎯 **Performance Dashboard**
1. Go to: `https://promethios-ui.vercel.app/ui/governance/performance`
2. **Expected**: Performance metrics and analytics
3. **Check for**:
   - ✅ Response time charts
   - ✅ Throughput metrics
   - ✅ Performance trends over time
   - ✅ Agent-specific performance data

#### 🚀 **Agent Deployments Page**
1. Go to: `https://promethios-ui.vercel.app/ui/agents/deploy`
2. **Expected**: Deployment management interface
3. **Check for**:
   - ✅ List of deployed agents
   - ✅ Deployment status and health
   - ✅ Agent configuration details
   - ✅ Deployment history

### Step 1.2: Navigation and UI Consistency

1. **Test navigation menu**: Verify all governance links work
2. **Check responsive design**: Test on different screen sizes
3. **Verify user authentication**: Ensure you remain logged in
4. **Test page refresh**: All pages should reload without errors

**✅ Success Criteria**: All governance pages load without errors and display appropriate content

---

## Phase 2: Agent Deployment Verification (20 minutes)

### Step 2.1: Verify Your Deployed Agent Appears

1. **Navigate to Deployments Page**:
   - Go to: `https://promethios-ui.vercel.app/ui/agents/deploy`
   - Look for your deployed agent in the list

2. **Check Agent Card Information**:
   - ✅ **Agent Name**: Should show proper name (not just ID)
   - ✅ **Status**: Should show "Healthy" or "Active"
   - ✅ **Endpoint URL**: Should match your agent endpoint
   - ✅ **API Key**: Should be displayed (partially masked)
   - ✅ **Deployment Time**: Should show when you deployed it

3. **Test Agent Card Actions**:
   - ✅ **Copy API Key**: Click copy button, verify it works
   - ✅ **Copy Endpoint**: Click copy button, verify it works
   - ✅ **Test Agent**: Click test button (if available)
   - ✅ **View Logs**: Click logs button (if available)

### Step 2.2: Validate Agent Accessibility

1. **Test Agent Endpoint Directly**:
   ```bash
   curl -I https://deployed-agent-{your-id}.promethios.ai
   ```
   - **Expected**: HTTP 200 or 404 response (not connection error)

2. **Test Agent Health Check**:
   ```bash
   curl https://deployed-agent-{your-id}.promethios.ai/health
   ```
   - **Expected**: Some response indicating agent is running

**✅ Success Criteria**: Your deployed agent appears in the UI with correct information and is accessible

---

## Phase 3: Agent Activity Generation (30 minutes)

### Step 3.1: Generate Basic Agent Activity

Use your deployed agent to generate activity that should appear in governance dashboards:

#### 🗣️ **Chat Interactions** (Trust Score Data)
1. **Send Normal Messages**:
   ```bash
   curl -X POST "https://deployed-agent-{your-id}.promethios.ai/chat" \
     -H "Authorization: Bearer {your-api-key}" \
     -H "Content-Type: application/json" \
     -d '{"message": "Hello, how can you help me today?"}'
   ```

2. **Send Technical Questions**:
   ```bash
   curl -X POST "https://deployed-agent-{your-id}.promethios.ai/chat" \
     -H "Authorization: Bearer {your-api-key}" \
     -H "Content-Type: application/json" \
     -d '{"message": "Explain the difference between REST and GraphQL APIs"}'
   ```

3. **Send Follow-up Questions** (Context Testing):
   ```bash
   curl -X POST "https://deployed-agent-{your-id}.promethios.ai/chat" \
     -H "Authorization: Bearer {your-api-key}" \
     -H "Content-Type: application/json" \
     -d '{"message": "Which one would you recommend for a mobile app?"}'
   ```

#### ⚡ **Performance Testing** (Response Time Data)
1. **Send Multiple Quick Requests**:
   ```bash
   for i in {1..5}; do
     curl -X POST "https://deployed-agent-{your-id}.promethios.ai/chat" \
       -H "Authorization: Bearer {your-api-key}" \
       -H "Content-Type: application/json" \
       -d "{\"message\": \"Quick test message $i\"}"
     sleep 2
   done
   ```

#### 🚨 **Error Conditions** (Violation Data)
1. **Test Empty Message**:
   ```bash
   curl -X POST "https://deployed-agent-{your-id}.promethios.ai/chat" \
     -H "Authorization: Bearer {your-api-key}" \
     -H "Content-Type: application/json" \
     -d '{"message": ""}'
   ```

2. **Test Invalid JSON**:
   ```bash
   curl -X POST "https://deployed-agent-{your-id}.promethios.ai/chat" \
     -H "Authorization: Bearer {your-api-key}" \
     -H "Content-Type: application/json" \
     -d '{"invalid_field": "test"}'
   ```

3. **Test Rate Limiting** (if implemented):
   ```bash
   for i in {1..20}; do
     curl -X POST "https://deployed-agent-{your-id}.promethios.ai/chat" \
       -H "Authorization: Bearer {your-api-key}" \
       -H "Content-Type: application/json" \
       -d "{\"message\": \"Rapid request $i\"}" &
   done
   ```

### Step 3.2: Record Activity Results

For each test, record:
- ✅ **Response Status**: HTTP status code received
- ✅ **Response Time**: How long the request took
- ✅ **Response Content**: Brief summary of agent's response
- ✅ **Any Errors**: Error messages or unexpected behavior

**✅ Success Criteria**: Agent responds to requests and generates various types of activity data

---

## Phase 4: Governance UI Data Flow Validation (45 minutes)

### Step 4.1: Trust Metrics Validation

1. **Navigate to Trust Metrics Page**:
   - Go to: `https://promethios-ui.vercel.app/ui/governance/trust-metrics`

2. **Look for Your Agent's Data**:
   - ✅ **Trust Score**: Should show a percentage (e.g., 85%)
   - ✅ **Interaction Count**: Should reflect your test messages
   - ✅ **Recent Activity**: Should show timestamps from your tests
   - ✅ **Trust Trends**: Charts should show data points

3. **Validate Data Accuracy**:
   - ✅ **Message Count**: Should match number of successful requests
   - ✅ **Timestamps**: Should be recent (within last hour)
   - ✅ **Agent Identification**: Should show your specific agent

4. **Test Real-Time Updates**:
   - Send a new message to your agent
   - Refresh the trust metrics page after 30 seconds
   - ✅ **Data Updates**: Metrics should reflect the new activity

### Step 4.2: Live Monitoring Validation

1. **Navigate to Live Monitoring Page**:
   - Go to: `https://promethios-ui.vercel.app/ui/governance/live-monitoring`

2. **Find Your Agent**:
   - ✅ **Agent Listed**: Your agent should appear in the monitoring list
   - ✅ **Status Indicator**: Should show "Healthy" or "Active"
   - ✅ **Last Seen**: Should show recent timestamp
   - ✅ **Response Time**: Should show average response time

3. **Test Live Updates**:
   - Keep the monitoring page open
   - Send requests to your agent in another tab/terminal
   - ✅ **Real-Time Updates**: Page should update within 30 seconds

### Step 4.3: Performance Dashboard Validation

1. **Navigate to Performance Page**:
   - Go to: `https://promethios-ui.vercel.app/ui/governance/performance`

2. **Check Performance Metrics**:
   - ✅ **Response Time Charts**: Should show data from your tests
   - ✅ **Throughput Metrics**: Should reflect request volume
   - ✅ **Error Rates**: Should show any failed requests
   - ✅ **Performance Trends**: Should show activity over time

3. **Validate Metric Accuracy**:
   - Compare displayed metrics with your recorded test results
   - ✅ **Response Times**: Should match your observed response times
   - ✅ **Request Counts**: Should match number of requests sent
   - ✅ **Error Counts**: Should match any failed requests

### Step 4.4: Violations Dashboard Validation

1. **Navigate to Violations Page**:
   - Go to: `https://promethios-ui.vercel.app/ui/governance/violations`

2. **Check for Violation Records**:
   - ✅ **Empty Message Violations**: Should show violations from empty message tests
   - ✅ **Invalid JSON Violations**: Should show violations from malformed requests
   - ✅ **Rate Limit Violations**: Should show violations from rapid requests (if applicable)

3. **Validate Violation Details**:
   - ✅ **Timestamps**: Should match when you sent problematic requests
   - ✅ **Violation Types**: Should correctly categorize the violations
   - ✅ **Agent Attribution**: Should correctly identify your agent
   - ✅ **Severity Levels**: Should show appropriate severity ratings

**✅ Success Criteria**: All governance pages show accurate, real-time data from your agent activity

---

## Phase 5: Multi-Agent Scenario Testing (Optional - 60 minutes)

If you have multiple deployed agents, test the governance system's ability to handle multiple agents:

### Step 5.1: Deploy Additional Test Agents

1. **Deploy 2-3 Additional Agents** using different configurations
2. **Record Each Agent's Details**:
   - Agent endpoint URLs
   - API keys
   - Deployment timestamps

### Step 5.2: Generate Diverse Activity Patterns

1. **Agent 1**: Normal conversation patterns
2. **Agent 2**: High-frequency requests
3. **Agent 3**: Mix of successful and error requests

### Step 5.3: Validate Multi-Agent Governance

1. **Trust Metrics**: Should show separate scores for each agent
2. **Live Monitoring**: Should list all agents with individual status
3. **Performance**: Should show comparative performance metrics
4. **Violations**: Should correctly attribute violations to specific agents

**✅ Success Criteria**: Governance system correctly handles and displays data from multiple agents

---

## Phase 6: Data Persistence and Reliability (30 minutes)

### Step 6.1: Test Data Persistence

1. **Generate Activity**: Send requests to your agent
2. **Wait 1 Hour**: Let time pass to test data retention
3. **Check Governance Pages**: Verify data is still present and accurate
4. **Browser Refresh**: Ensure data persists across page reloads
5. **New Browser Session**: Log out and back in, verify data remains

### Step 6.2: Test System Recovery

1. **Simulate Network Issues**: Disconnect internet briefly during agent requests
2. **Check Error Handling**: Verify governance UI handles missing data gracefully
3. **Test Data Backfill**: When connection returns, verify data catches up

**✅ Success Criteria**: Governance data persists reliably and system handles interruptions gracefully

---

## Troubleshooting Guide

### Common Issues and Solutions

#### 🔴 **Agent Not Appearing in Governance UI**

**Symptoms**: Agent deployed successfully but doesn't show in governance pages

**Troubleshooting Steps**:
1. **Check Agent Endpoint**: Verify agent is accessible via curl
2. **Verify API Key**: Ensure API key is correct and has proper permissions
3. **Check Network**: Ensure agent can reach Promethios governance APIs
4. **Wait for Propagation**: Data may take 5-10 minutes to appear initially
5. **Check Browser Console**: Look for JavaScript errors preventing data load

#### 🔴 **Governance Pages Show No Data**

**Symptoms**: Pages load but show empty dashboards or "No data available"

**Troubleshooting Steps**:
1. **Generate Agent Activity**: Send test requests to ensure data exists
2. **Check API Endpoints**: Verify governance APIs are responding
3. **Clear Browser Cache**: Force refresh with Ctrl+F5
4. **Check User Permissions**: Ensure your account has access to governance data
5. **Verify Agent Configuration**: Ensure agent is configured to send governance data

#### 🔴 **Data Not Updating in Real-Time**

**Symptoms**: Old data shown, new activity not reflected

**Troubleshooting Steps**:
1. **Check Auto-Refresh**: Look for auto-refresh settings on governance pages
2. **Manual Refresh**: Try refreshing the page manually
3. **Check WebSocket Connections**: Look for WebSocket errors in browser console
4. **Verify Agent Health**: Ensure agent is still running and accessible
5. **Check Data Pipeline**: Verify agent is successfully sending data to governance APIs

#### 🔴 **Trust Scores Not Updating**

**Symptoms**: Trust scores remain static despite agent activity

**Troubleshooting Steps**:
1. **Verify Activity Types**: Ensure you're generating activity that affects trust scores
2. **Check Calculation Logic**: Trust scores may update on different schedules
3. **Look for Violations**: Check if violations are preventing trust score updates
4. **Verify Agent Identity**: Ensure activity is correctly attributed to your agent

#### 🔴 **Performance Metrics Inaccurate**

**Symptoms**: Displayed metrics don't match observed performance

**Troubleshooting Steps**:
1. **Check Timezone Settings**: Ensure timestamps are in correct timezone
2. **Verify Metric Definitions**: Understand how metrics are calculated
3. **Compare with Agent Logs**: Cross-reference with agent's internal logs
4. **Check Sampling Rates**: Some metrics may be sampled rather than exact

### Getting Help

If issues persist after troubleshooting:

1. **Document the Issue**:
   - Screenshots of governance pages
   - Browser console logs
   - Agent endpoint and API key (partially masked)
   - Steps to reproduce the problem

2. **Check System Status**:
   - Verify Promethios UI and API are operational
   - Check for known issues or maintenance

3. **Contact Support**:
   - Provide detailed issue documentation
   - Include test results and troubleshooting steps attempted

---

## Success Metrics Summary

### ✅ **Complete Success Indicators**

- **All governance pages load** without errors
- **Deployed agent appears** in deployment dashboard with correct information
- **Agent activity generates data** that appears in governance dashboards within 30 seconds
- **Trust metrics update** based on agent interactions
- **Live monitoring shows** real-time agent status and activity
- **Performance metrics accurately reflect** agent response times and throughput
- **Violations are properly detected** and categorized
- **Data persists** across browser sessions and time
- **Multi-agent scenarios** work correctly (if tested)

### ⚠️ **Partial Success Indicators**

- **Most governance pages work** but some show errors or missing features
- **Agent appears in deployment list** but some details are incorrect
- **Some governance data updates** but not all metrics are working
- **Data appears with delays** longer than expected
- **Some violations detected** but categorization is incorrect

### ❌ **Failure Indicators**

- **Governance pages don't load** or show persistent errors
- **Deployed agent doesn't appear** in any governance dashboards
- **No governance data updates** despite agent activity
- **Trust scores remain static** regardless of activity
- **Performance metrics show no data** or clearly incorrect values

---

## Next Steps After Testing

### If Tests Pass ✅

1. **Document Working Configuration**: Record successful setup details
2. **Set Up Monitoring Alerts**: Configure alerts for trust score violations
3. **Plan Production Deployment**: Prepare for real user scenarios
4. **Create User Documentation**: Document how users should interpret governance data
5. **Schedule Regular Testing**: Set up periodic validation of governance data flow

### If Tests Fail ❌

1. **Document All Issues**: Create detailed issue reports with screenshots
2. **Prioritize Critical Issues**: Focus on core functionality first
3. **Test Individual Components**: Isolate whether issues are in UI, API, or agent
4. **Check Configuration**: Verify all system configurations are correct
5. **Plan Fixes**: Create action plan to address identified issues

This manual testing guide ensures comprehensive validation of the governance UI and agent data flow, providing confidence that the Promethios system is working correctly end-to-end.

