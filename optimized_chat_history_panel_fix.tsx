/**
 * Quick Fix for OptimizedChatHistoryPanel
 * 
 * This patch adds better error handling and debugging to identify
 * why the Host Chats tab is empty.
 */

// Add this to the loadChatSessions function in OptimizedChatHistoryPanel.tsx
// Replace the existing loadChatSessions function with this improved version:

const loadChatSessions = useCallback(async () => {
  console.log('🔍 [DEBUG] loadChatSessions called:', {
    currentUserUid: currentUser?.uid,
    agentId,
    searchTerm,
    loading
  });

  if (!currentUser?.uid) {
    console.log('❌ [DEBUG] No current user UID, skipping load');
    setLoading(false);
    return;
  }

  try {
    setLoading(true);
    console.log('🔍 [DEBUG] Starting chat sessions load...');
    
    // Use a more efficient filter approach
    const filter: ChatHistoryFilter = {
      agentId: agentId,
    };

    // Only add search filter if there's actually a search term
    if (searchTerm.trim()) {
      filter.searchTerm = searchTerm.trim();
    }

    console.log('🔍 [DEBUG] Filter:', filter);

    // Add timeout to prevent hanging
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Chat loading timeout')), 10000)
    );

    const sessionsPromise = chatHistoryService.getChatSessions(currentUser.uid, filter);
    
    console.log('🔍 [DEBUG] Waiting for sessions...');
    const sessions = await Promise.race([sessionsPromise, timeoutPromise]) as ChatSession[];
    
    console.log('🔍 [DEBUG] Raw sessions received:', {
      sessionsLength: sessions?.length || 0,
      sessions: sessions?.slice(0, 3).map(s => ({ id: s?.id, name: s?.name, agentId: s?.agentId })) || []
    });
    
    // Validate the sessions data
    const validSessions = sessions.filter(session => 
      session && 
      typeof session.id === 'string' && 
      typeof session.name === 'string'
    );
    
    console.log('🔍 [DEBUG] Valid sessions after filtering:', {
      validSessionsLength: validSessions.length,
      originalLength: sessions?.length || 0,
      validSessions: validSessions.slice(0, 3).map(s => ({ id: s.id, name: s.name, agentId: s.agentId }))
    });
    
    setChatSessions(validSessions);
    console.log('✅ [DEBUG] Chat sessions set successfully');
  } catch (error) {
    console.error('❌ [DEBUG] Failed to load chat sessions:', error);
    console.error('❌ [DEBUG] Error details:', {
      message: error.message,
      stack: error.stack,
      currentUserUid: currentUser?.uid,
      agentId,
      searchTerm
    });
    
    // Don't clear existing sessions on error, just log it
    if (chatSessions.length === 0) {
      setChatSessions([]);
    }
  } finally {
    setLoading(false);
    console.log('🔍 [DEBUG] loadChatSessions completed');
  }
}, [currentUser?.uid, agentId, searchTerm, chatHistoryService, chatSessions.length]);

// Also add this debug info to the Host Chats tab render section:
// Replace the Host Chats tab section with this:

{activeTab === 0 ? (
  // Host Chats Tab
  <>
    {/* Debug Info */}
    <Box sx={{ p: 1, bgcolor: '#1e293b', borderBottom: '1px solid #334155' }}>
      <Typography variant="caption" sx={{ color: '#94a3b8' }}>
        DEBUG: User: {currentUser?.uid || 'None'} | Agent: {agentId} | Sessions: {chatSessions.length} | Loading: {loading.toString()}
      </Typography>
    </Box>
    
    {loading ? (
      <LoadingSkeleton />
    ) : chatSessions.length === 0 ? (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="body2" sx={{ color: '#94a3b8', mb: 2 }}>
          {searchTerm ? 'No chats found matching your search.' : 'No chat history yet.'}
        </Typography>
        <Typography variant="caption" sx={{ color: '#64748b', mb: 2, display: 'block' }}>
          DEBUG: User={currentUser?.uid}, Agent={agentId}, Filter={JSON.stringify({ agentId, searchTerm })}
        </Typography>
        <Button
          variant="outlined"
          size="small"
          startIcon={<Add />}
          onClick={() => setNewChatDialogOpen(true)}
          sx={{
            borderColor: '#334155',
            color: '#94a3b8',
            '&:hover': {
              borderColor: '#3b82f6',
              color: 'white',
            },
          }}
        >
          Start New Chat
        </Button>
      </Box>
    ) : (
      <List sx={{ p: 0 }}>
        {chatSessions.map((session, index) => (
          <React.Fragment key={session.id}>
            <ChatListItem
              session={session}
              isSelected={session.id === currentSessionId}
              agentName={agentName}
              onSelect={onChatSelect}
              onMenuOpen={handleMenuOpen}
              onInvite={handleInviteToChat}
              onShare={handleShareChat}
              onStartEdit={handleStartInlineEdit}
              onDirectMessage={onDirectMessage}
              onViewProfile={onViewProfile}
              shareSuccess={shareSuccess}
              editingSessionId={editingSessionId}
              editingName={editingName}
              onEditChange={setEditingName}
              onEditKeyPress={handleInlineEditKeyPress}
              onEditBlur={handleSaveInlineEdit}
            />
            {index < chatSessions.length - 1 && (
              <Divider sx={{ bgcolor: '#334155', mx: 2 }} />
            )}
          </React.Fragment>
        ))}
      </List>
    )}
  </>
) : (
  // Guest Chats Tab remains the same...
)}

