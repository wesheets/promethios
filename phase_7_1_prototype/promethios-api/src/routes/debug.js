const express = require('express');
const router = express.Router();

// In-memory debug log storage (for real-time monitoring)
let debugLogs = [];
const MAX_LOGS = 1000; // Keep last 1000 log entries

// Debug log entry structure
function createDebugEntry(level, category, message, data = {}) {
    const entry = {
        timestamp: new Date().toISOString(),
        level, // 'info', 'warn', 'error', 'debug'
        category, // 'tool_call', 'provider', 'chat', 'schema'
        message,
        data,
        id: Date.now() + Math.random()
    };
    
    // Add to in-memory storage
    debugLogs.unshift(entry);
    if (debugLogs.length > MAX_LOGS) {
        debugLogs = debugLogs.slice(0, MAX_LOGS);
    }
    
    // Also log to console with emoji for visibility
    const emoji = {
        'info': '📝',
        'warn': '⚠️',
        'error': '❌',
        'debug': '🔍'
    }[level] || '📝';
    
    console.log(`${emoji} [${category.toUpperCase()}] ${message}`, data);
    
    return entry;
}

// Export the debug function for use in other modules
router.addDebugLog = createDebugEntry;

// GET /api/debug/logs - Get recent debug logs
router.get('/logs', (req, res) => {
    const { category, level, limit = 100 } = req.query;
    
    let filteredLogs = debugLogs;
    
    if (category) {
        filteredLogs = filteredLogs.filter(log => log.category === category);
    }
    
    if (level) {
        filteredLogs = filteredLogs.filter(log => log.level === level);
    }
    
    const limitedLogs = filteredLogs.slice(0, parseInt(limit));
    
    res.json({
        success: true,
        logs: limitedLogs,
        total: filteredLogs.length,
        categories: [...new Set(debugLogs.map(log => log.category))],
        levels: [...new Set(debugLogs.map(log => log.level))]
    });
});

// GET /api/debug/tool-calls - Get tool call specific logs
router.get('/tool-calls', (req, res) => {
    const toolCallLogs = debugLogs.filter(log => 
        log.category === 'tool_call' || 
        log.category === 'tool_schema' ||
        log.category === 'tool_execution'
    );
    
    res.json({
        success: true,
        logs: toolCallLogs,
        summary: {
            total_tool_attempts: toolCallLogs.filter(log => log.message.includes('attempting')).length,
            successful_calls: toolCallLogs.filter(log => log.message.includes('successful')).length,
            failed_calls: toolCallLogs.filter(log => log.level === 'error').length,
            schema_loads: toolCallLogs.filter(log => log.message.includes('schema')).length
        }
    });
});

// GET /api/debug/live - Server-sent events for real-time monitoring
router.get('/live', (req, res) => {
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control'
    });
    
    // Send initial connection message
    res.write(`data: ${JSON.stringify({
        type: 'connected',
        message: 'Debug stream connected',
        timestamp: new Date().toISOString()
    })}\n\n`);
    
    // Send recent logs
    const recentLogs = debugLogs.slice(0, 10);
    res.write(`data: ${JSON.stringify({
        type: 'initial_logs',
        logs: recentLogs
    })}\n\n`);
    
    // Store the response object for sending new logs
    const clientId = Date.now();
    if (!router.liveClients) {
        router.liveClients = new Map();
    }
    router.liveClients.set(clientId, res);
    
    // Clean up on client disconnect
    req.on('close', () => {
        if (router.liveClients) {
            router.liveClients.delete(clientId);
        }
    });
    
    // Keep connection alive
    const keepAlive = setInterval(() => {
        try {
            res.write(`data: ${JSON.stringify({
                type: 'ping',
                timestamp: new Date().toISOString()
            })}\n\n`);
        } catch (error) {
            clearInterval(keepAlive);
            if (router.liveClients) {
                router.liveClients.delete(clientId);
            }
        }
    }, 30000);
});

// POST /api/debug/clear - Clear debug logs
router.post('/clear', (req, res) => {
    debugLogs = [];
    createDebugEntry('info', 'system', 'Debug logs cleared');
    
    res.json({
        success: true,
        message: 'Debug logs cleared'
    });
});

// GET /api/debug/status - Get debugging system status
router.get('/status', (req, res) => {
    res.json({
        success: true,
        status: {
            total_logs: debugLogs.length,
            live_clients: router.liveClients ? router.liveClients.size : 0,
            categories: [...new Set(debugLogs.map(log => log.category))],
            recent_activity: debugLogs.slice(0, 5).map(log => ({
                timestamp: log.timestamp,
                category: log.category,
                message: log.message
            }))
        }
    });
});

// Enhanced debug function that also broadcasts to live clients
function broadcastDebugEntry(level, category, message, data = {}) {
    const entry = createDebugEntry(level, category, message, data);
    
    // Broadcast to live clients
    if (router.liveClients && router.liveClients.size > 0) {
        const eventData = JSON.stringify({
            type: 'new_log',
            log: entry
        });
        
        router.liveClients.forEach((client, clientId) => {
            try {
                client.write(`data: ${eventData}\n\n`);
            } catch (error) {
                // Client disconnected, remove it
                router.liveClients.delete(clientId);
            }
        });
    }
    
    return entry;
}

// Override the addDebugLog function to include broadcasting
router.addDebugLog = broadcastDebugEntry;

// Export for use in other modules
module.exports = router;
module.exports.addDebugLog = broadcastDebugEntry;

