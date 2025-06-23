console.log('=== AGENT GOVERNANCE VERIFICATION ===\n');

console.log('🔍 STORAGE ARCHITECTURE:');
console.log('   • UnifiedStorageService -> LocalStorageProvider');
console.log('   • Prefix: "promethios_"');
console.log('   • Namespace: "agents"');
console.log('   • Key format: promethios_agents.{userId}.{agentId}');
console.log('   • User ID: HSf4SIwCcRRzAFPuFXlFE9CsQ6W2');
console.log('   • Agent IDs: agent-1750653810802, agent-1750680776317\n');

console.log('🎯 EXPECTED STORAGE KEYS:');
console.log('   1. promethios_agents.HSf4SIwCcRRzAFPuFXlFE9CsQ6W2.agent-1750653810802');
console.log('   2. promethios_agents.HSf4SIwCcRRzAFPuFXlFE9CsQ6W2.agent-1750680776317\n');

console.log('📋 GOVERNANCE POLICY VERIFICATION:');
console.log('   Left Agent (HIPAA Strict) should have:');
console.log('   ✓ complianceFramework: "healthcare"');
console.log('   ✓ securityLevel: "strict"');
console.log('   ✓ enforcementLevel: "strict_compliance"');
console.log('   ✓ enableAuditLogging: true');
console.log('   ✓ enableDataRetention: true');
console.log('   ✓ enableRealTimeMonitoring: true');
console.log('   ✓ enableEscalationPolicies: true\n');

console.log('   Right Agent (Standard) should have:');
console.log('   ✓ complianceFramework: "general" or other');
console.log('   ✓ securityLevel: "standard"');
console.log('   ✓ enforcementLevel: "governance" or "monitoring"');
console.log('   ✓ Basic governance controls enabled\n');

console.log('🔧 AGENT PROFILE VERIFICATION:');
console.log('   Both agents should have:');
console.log('   ✓ isWrapped: true');
console.log('   ✓ isDeployed: true');
console.log('   ✓ governancePolicy: {object with all required fields}');
console.log('   ✓ identity.name: "OpenAI Assistant"');
console.log('   ✓ identity.description: preserved from original');
console.log('   ✓ latestScorecard: {score, metrics}');
console.log('   ✓ healthStatus: "healthy"\n');

console.log('🚀 VERIFICATION STEPS:');
console.log('   1. Open browser DevTools (F12)');
console.log('   2. Go to Application tab -> Storage -> Local Storage');
console.log('   3. Look for keys starting with "promethios_agents."');
console.log('   4. Expand the agent data objects');
console.log('   5. Verify governancePolicy objects are complete');
console.log('   6. Check that policy display shows readable format\n');

console.log('📊 SCORECARD VERIFICATION:');
console.log('   Scorecard keys should exist:');
console.log('   • promethios_scorecards.HSf4SIwCcRRzAFPuFXlFE9CsQ6W2.agent-1750653810802');
console.log('   • promethios_scorecards.HSf4SIwCcRRzAFPuFXlFE9CsQ6W2.agent-1750680776317\n');

console.log('✅ SUCCESS INDICATORS:');
console.log('   • Both agents show "Deployed" status');
console.log('   • Policy displays as "Healthcare - Strict" and "General - Standard"');
console.log('   • Trust scores are calculated (85-95 range)');
console.log('   • Gov IDs are assigned (GV-XXXXXX format)');
console.log('   • Descriptions are preserved from original agents');
console.log('   • Audit logging is enabled for HIPAA agent');
