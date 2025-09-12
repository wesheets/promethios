/**
 * Test script to verify participant storage and retrieval logic
 * This simulates the guest invitation flow to identify conversation ID mismatches
 */

// Mock Firebase functions for testing
const mockFirestore = {
  docs: new Map(),
  
  doc(collection, id) {
    return {
      id,
      collection,
      fullPath: `${collection}/${id}`
    };
  },
  
  async getDoc(docRef) {
    const key = `${docRef.collection}/${docRef.id}`;
    const data = this.docs.get(key);
    return {
      exists: () => !!data,
      data: () => data
    };
  },
  
  async setDoc(docRef, data) {
    const key = `${docRef.collection}/${docRef.id}`;
    console.log(`📝 [Mock] Setting document: ${key}`, data);
    this.docs.set(key, data);
  },
  
  async updateDoc(docRef, data) {
    const key = `${docRef.collection}/${docRef.id}`;
    const existing = this.docs.get(key) || {};
    const updated = { ...existing, ...data };
    console.log(`🔄 [Mock] Updating document: ${key}`, updated);
    this.docs.set(key, updated);
  }
};

// Mock UnifiedParticipantService
class MockUnifiedParticipantService {
  constructor() {
    this.db = mockFirestore;
  }
  
  async addHumanParticipant(conversationId, participantId, participantName, addedBy, invitationId, status = 'pending') {
    console.log('👤 [Mock UnifiedParticipant] Adding human participant:', {
      conversationId,
      participantId,
      participantName,
      addedBy,
      status,
      invitationId
    });

    const newParticipant = {
      id: participantId,
      name: participantName,
      type: 'human',
      status,
      addedAt: new Date(),
      addedBy,
      invitationId,
      permissions: {
        canRemove: true,
        canAddAgents: true,
        isHost: false
      }
    };

    console.log(`🔍 [Mock UnifiedParticipant] Storing participant in conversation: ${conversationId}`);
    await this.addParticipantToConversation(conversationId, newParticipant);
    console.log('✅ [Mock UnifiedParticipant] Human participant added successfully');
  }
  
  async addParticipantToConversation(conversationId, participant) {
    console.log(`🔍 [Mock UnifiedParticipant] addParticipantToConversation called with:`, {
      conversationId,
      participantId: participant.id,
      participantName: participant.name,
      participantType: participant.type
    });
    
    const participantsRef = this.db.doc('conversation_participants', conversationId);
    console.log(`🔍 [Mock UnifiedParticipant] Firebase document path: conversation_participants/${conversationId}`);
    
    const participantsDoc = await this.db.getDoc(participantsRef);

    if (!participantsDoc.exists()) {
      console.log('⚠️ [Mock UnifiedParticipant] Conversation participants document not found, creating it...');
      
      const newDocData = {
        conversationId,
        hostUserId: participant.addedBy,
        participants: [participant],
        createdAt: new Date(),
        lastUpdated: new Date(),
        version: 1
      };
      
      console.log(`🔍 [Mock UnifiedParticipant] Creating new document with data:`, newDocData);
      await this.db.setDoc(participantsRef, newDocData);
      console.log('✅ [Mock UnifiedParticipant] Created conversation participants document with participant');
      return;
    }

    const data = participantsDoc.data();
    const existingParticipants = data.participants || [];
    console.log(`🔍 [Mock UnifiedParticipant] Found existing document with ${existingParticipants.length} participants`);

    if (existingParticipants.some(p => p.id === participant.id)) {
      console.log('⚠️ [Mock UnifiedParticipant] Participant already exists in conversation:', participant.id);
      return;
    }

    const updatedParticipants = [...existingParticipants, participant];
    console.log(`🔍 [Mock UnifiedParticipant] Updating document with ${updatedParticipants.length} participants`);

    await this.db.updateDoc(participantsRef, {
      participants: updatedParticipants,
      lastUpdated: new Date(),
      version: data.version + 1
    });
    
    console.log('✅ [Mock UnifiedParticipant] Added participant to existing conversation');
  }
  
  async getConversationParticipants(conversationId) {
    console.log(`🔍 [Mock UnifiedParticipant] Getting participants for conversation: ${conversationId}`);
    
    const participantsRef = this.db.doc('conversation_participants', conversationId);
    const participantsDoc = await this.db.getDoc(participantsRef);

    if (!participantsDoc.exists()) {
      console.log(`⚠️ [Mock UnifiedParticipant] No participants document found for conversation: ${conversationId}`);
      console.log(`🔍 [Mock UnifiedParticipant] Checking if document exists with different ID format...`);
      
      // Try alternative conversation ID formats
      const alternativeIds = [
        `chat_${conversationId}`,
        conversationId.replace('chat_', ''),
        `session_${conversationId}`,
        conversationId.replace('session_', ''),
        // Handle cross-prefix scenarios
        conversationId.replace('chat_', 'session_'),
        conversationId.replace('session_', 'chat_')
      ];
      
      for (const altId of alternativeIds) {
        if (altId !== conversationId) {
          console.log(`🔍 [Mock UnifiedParticipant] Trying alternative ID: ${altId}`);
          const altRef = this.db.doc('conversation_participants', altId);
          const altDoc = await this.db.getDoc(altRef);
          if (altDoc.exists()) {
            console.log(`✅ [Mock UnifiedParticipant] Found participants with alternative ID: ${altId}`);
            const data = altDoc.data();
            const participants = data.participants || [];
            console.log(`📋 [Mock UnifiedParticipant] Retrieved ${participants.length} participants with alt ID`);
            return participants;
          }
        }
      }
      
      return [];
    }

    const data = participantsDoc.data();
    const participants = data.participants || [];
    console.log(`📋 [Mock UnifiedParticipant] Retrieved ${participants.length} participants for conversation: ${conversationId}`);
    console.log(`🔍 [Mock UnifiedParticipant] Participants:`, participants.map(p => ({ id: p.id, name: p.name, type: p.type, status: p.status })));
    return participants;
  }
}

// Mock ChatHistoryService
class MockChatHistoryService {
  constructor(unifiedParticipantService) {
    this.unifiedParticipantService = unifiedParticipantService;
  }
  
  async mergeUnifiedParticipants(session) {
    console.log(`🔗 [Mock ChatHistory] Merging unified participants for session: ${session.id}`);
    
    // Get participants from UnifiedParticipantService
    const unifiedParticipants = await this.unifiedParticipantService.getConversationParticipants(session.id);
    
    if (unifiedParticipants && Array.isArray(unifiedParticipants) && unifiedParticipants.length > 0) {
      console.log(`🔗 [Mock ChatHistory] Found ${unifiedParticipants.length} unified participants`);
      
      // Filter for human participants and convert to ChatParticipant format
      const humanParticipants = unifiedParticipants
        .filter(p => p && p.type === 'human' && p.id && p.name)
        .map(p => this.convertUnifiedParticipantToChatParticipant(p));
      
      console.log(`🔗 [Mock ChatHistory] Converted ${humanParticipants.length} human participants`);
      
      // Merge with existing guests (avoid duplicates)
      const existingGuestIds = new Set(session.participants.guests.map(g => g.id));
      const newGuests = humanParticipants.filter(p => !existingGuestIds.has(p.id));
      
      if (newGuests.length > 0) {
        session.participants.guests.push(...newGuests);
        console.log(`✅ [Mock ChatHistory] Added ${newGuests.length} new guest participants to session`);
      } else {
        console.log(`🔗 [Mock ChatHistory] No new guest participants to add`);
      }
      
    } else {
      console.log(`🔗 [Mock ChatHistory] No unified participants found for session: ${session.id}`);
    }
  }
  
  convertUnifiedParticipantToChatParticipant(unifiedParticipant) {
    return {
      id: unifiedParticipant.id,
      name: unifiedParticipant.name,
      type: unifiedParticipant.type === 'human' ? 'human' : 'ai_agent',
      joinedAt: unifiedParticipant.addedAt,
      messageCount: 0,
      lastActive: unifiedParticipant.addedAt,
      avatar: unifiedParticipant.avatar,
      status: unifiedParticipant.status,
    };
  }
}

// Test scenarios
async function runTests() {
  console.log('🧪 Starting participant flow tests...\n');
  
  const unifiedParticipantService = new MockUnifiedParticipantService();
  const chatHistoryService = new MockChatHistoryService(unifiedParticipantService);
  
  // Test Scenario 1: Store participant with session ID, retrieve with session ID
  console.log('=== Test Scenario 1: Same ID format ===');
  const sessionId1 = 'chat_12345';
  
  await unifiedParticipantService.addHumanParticipant(
    sessionId1,
    'user_guest_1',
    'Guest User 1',
    'user_host_1',
    'invitation_1',
    'pending'
  );
  
  const mockSession1 = {
    id: sessionId1,
    participants: { guests: [] }
  };
  
  await chatHistoryService.mergeUnifiedParticipants(mockSession1);
  console.log('Final session participants:', mockSession1.participants.guests);
  console.log('');
  
  // Test Scenario 2: Store participant with one ID format, retrieve with different format
  console.log('=== Test Scenario 2: Different ID formats ===');
  const storeId = 'chat_67890';
  const retrieveId = '67890'; // Without 'chat_' prefix
  
  await unifiedParticipantService.addHumanParticipant(
    storeId,
    'user_guest_2',
    'Guest User 2',
    'user_host_2',
    'invitation_2',
    'pending'
  );
  
  const mockSession2 = {
    id: retrieveId,
    participants: { guests: [] }
  };
  
  await chatHistoryService.mergeUnifiedParticipants(mockSession2);
  console.log('Final session participants:', mockSession2.participants.guests);
  console.log('');
  
  // Test Scenario 3: Store with session_ prefix, retrieve with chat_ prefix
  console.log('=== Test Scenario 3: session_ vs chat_ prefix ===');
  const storeId3 = 'session_abcdef';
  const retrieveId3 = 'chat_abcdef';
  
  await unifiedParticipantService.addHumanParticipant(
    storeId3,
    'user_guest_3',
    'Guest User 3',
    'user_host_3',
    'invitation_3',
    'pending'
  );
  
  const mockSession3 = {
    id: retrieveId3,
    participants: { guests: [] }
  };
  
  await chatHistoryService.mergeUnifiedParticipants(mockSession3);
  console.log('Final session participants:', mockSession3.participants.guests);
  console.log('');
  
  console.log('🧪 Tests completed!');
  console.log('\n📊 Summary of stored documents:');
  for (const [key, value] of mockFirestore.docs) {
    console.log(`  ${key}: ${value.participants?.length || 0} participants`);
  }
}

// Run the tests
runTests().catch(console.error);

