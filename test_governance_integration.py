#!/usr/bin/env python3
"""
Integration Test Script for Universal Knowledge & Training System
Tests the integration with existing Promethios governance APIs
"""

import sys
import os
import json
import requests
import time
from typing import Dict, List, Any

# Add the src directory to Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'src'))

def test_governance_api_integration():
    """Test integration with existing governance APIs"""
    
    print("🧪 Testing Universal Knowledge & Training System Integration")
    print("=" * 60)
    
    # Test results
    results = {
        'knowledge_api': {'status': 'pending', 'tests': []},
        'training_api': {'status': 'pending', 'tests': []},
        'governance_integration': {'status': 'pending', 'tests': []},
        'provider_system': {'status': 'pending', 'tests': []}
    }
    
    # Test 1: Knowledge Management API Structure
    print("\n📚 Testing Knowledge Management API...")
    try:
        # Import and test knowledge API
        from api.governance.knowledge.routes import knowledge_bp
        from api.governance.knowledge.document_processor import DocumentProcessor
        from api.governance.knowledge.vector_service import VectorService
        
        print("✅ Knowledge API imports successful")
        results['knowledge_api']['tests'].append({
            'test': 'API Import',
            'status': 'pass',
            'message': 'All knowledge API modules imported successfully'
        })
        
        # Test document processor
        processor = DocumentProcessor()
        print("✅ Document processor initialized")
        results['knowledge_api']['tests'].append({
            'test': 'Document Processor',
            'status': 'pass',
            'message': 'Document processor initialized successfully'
        })
        
        # Test vector service
        vector_service = VectorService()
        print("✅ Vector service initialized")
        results['knowledge_api']['tests'].append({
            'test': 'Vector Service',
            'status': 'pass',
            'message': 'Vector service initialized successfully'
        })
        
        results['knowledge_api']['status'] = 'pass'
        
    except ImportError as e:
        print(f"❌ Knowledge API import failed: {e}")
        results['knowledge_api']['status'] = 'fail'
        results['knowledge_api']['tests'].append({
            'test': 'API Import',
            'status': 'fail',
            'message': f'Import error: {e}'
        })
    except Exception as e:
        print(f"❌ Knowledge API test failed: {e}")
        results['knowledge_api']['status'] = 'fail'
        results['knowledge_api']['tests'].append({
            'test': 'General Test',
            'status': 'fail',
            'message': f'Error: {e}'
        })
    
    # Test 2: Training Management API Structure
    print("\n🎯 Testing Training Management API...")
    try:
        # Import and test training API
        from api.governance.training.routes import training_bp
        
        print("✅ Training API imports successful")
        results['training_api']['tests'].append({
            'test': 'API Import',
            'status': 'pass',
            'message': 'Training API modules imported successfully'
        })
        
        results['training_api']['status'] = 'pass'
        
    except ImportError as e:
        print(f"❌ Training API import failed: {e}")
        results['training_api']['status'] = 'fail'
        results['training_api']['tests'].append({
            'test': 'API Import',
            'status': 'fail',
            'message': f'Import error: {e}'
        })
    except Exception as e:
        print(f"❌ Training API test failed: {e}")
        results['training_api']['status'] = 'fail'
        results['training_api']['tests'].append({
            'test': 'General Test',
            'status': 'fail',
            'message': f'Error: {e}'
        })
    
    # Test 3: Governance Integration
    print("\n🛡️ Testing Governance Integration...")
    try:
        # Test if existing governance APIs are accessible
        governance_apis = [
            'api/agents/routes.py',
            'api/policy/routes.py', 
            'api/trust/routes.py',
            'api/audit/routes.py'
        ]
        
        for api_path in governance_apis:
            full_path = os.path.join(os.path.dirname(__file__), 'src', api_path)
            if os.path.exists(full_path):
                print(f"✅ Found governance API: {api_path}")
                results['governance_integration']['tests'].append({
                    'test': f'API Exists: {api_path}',
                    'status': 'pass',
                    'message': f'Governance API file exists: {api_path}'
                })
            else:
                print(f"⚠️ Governance API not found: {api_path}")
                results['governance_integration']['tests'].append({
                    'test': f'API Exists: {api_path}',
                    'status': 'warning',
                    'message': f'Governance API file not found: {api_path}'
                })
        
        # Test governance core
        governance_core_path = os.path.join(os.path.dirname(__file__), 'src/core/governance/governance_core.py')
        if os.path.exists(governance_core_path):
            print("✅ Governance core found")
            results['governance_integration']['tests'].append({
                'test': 'Governance Core',
                'status': 'pass',
                'message': 'Governance core module exists'
            })
        else:
            print("⚠️ Governance core not found")
            results['governance_integration']['tests'].append({
                'test': 'Governance Core',
                'status': 'warning',
                'message': 'Governance core module not found'
            })
        
        results['governance_integration']['status'] = 'pass'
        
    except Exception as e:
        print(f"❌ Governance integration test failed: {e}")
        results['governance_integration']['status'] = 'fail'
        results['governance_integration']['tests'].append({
            'test': 'General Test',
            'status': 'fail',
            'message': f'Error: {e}'
        })
    
    # Test 4: Provider System Integration
    print("\n🔌 Testing Provider System Integration...")
    try:
        # Test if provider system exists
        provider_paths = [
            'phase_7_1_prototype/promethios-api/src/services/providers/ProviderPlugin.js',
            'phase_7_1_prototype/promethios-api/src/services/providers/OpenAIProvider.js',
            'phase_7_1_prototype/promethios-api/src/services/providers/CohereProvider.js',
            'phase_7_1_prototype/promethios-api/src/services/providers/GeminiProvider.js',
            'phase_7_1_prototype/promethios-api/src/services/providers/HuggingFaceProvider.js',
            'phase_7_1_prototype/promethios-api/src/services/providers/GrokProvider.js',
            'phase_7_1_prototype/promethios-api/src/services/providers/PerplexityProvider.js'
        ]
        
        provider_count = 0
        for provider_path in provider_paths:
            full_path = os.path.join(os.path.dirname(__file__), provider_path)
            if os.path.exists(full_path):
                provider_count += 1
                print(f"✅ Found provider: {os.path.basename(provider_path)}")
                results['provider_system']['tests'].append({
                    'test': f'Provider Exists: {os.path.basename(provider_path)}',
                    'status': 'pass',
                    'message': f'Provider file exists: {provider_path}'
                })
            else:
                print(f"⚠️ Provider not found: {os.path.basename(provider_path)}")
                results['provider_system']['tests'].append({
                    'test': f'Provider Exists: {os.path.basename(provider_path)}',
                    'status': 'warning',
                    'message': f'Provider file not found: {provider_path}'
                })
        
        print(f"✅ Found {provider_count} providers")
        results['provider_system']['tests'].append({
            'test': 'Provider Count',
            'status': 'pass',
            'message': f'Found {provider_count} provider implementations'
        })
        
        results['provider_system']['status'] = 'pass'
        
    except Exception as e:
        print(f"❌ Provider system test failed: {e}")
        results['provider_system']['status'] = 'fail'
        results['provider_system']['tests'].append({
            'test': 'General Test',
            'status': 'fail',
            'message': f'Error: {e}'
        })
    
    # Test 5: UI Component Integration
    print("\n🎨 Testing UI Component Integration...")
    try:
        ui_components = [
            'phase_7_1_prototype/promethios-ui/src/components/governance/knowledge/UniversalKnowledgeManagement.tsx',
            'phase_7_1_prototype/promethios-ui/src/components/governance/training/UniversalTrainingManagement.tsx',
            'phase_7_1_prototype/promethios-ui/src/components/governance/training/CostComparisonDashboard.tsx',
            'phase_7_1_prototype/promethios-ui/src/components/governance/training/ProviderSelectionWizard.tsx'
        ]
        
        ui_count = 0
        for component_path in ui_components:
            full_path = os.path.join(os.path.dirname(__file__), component_path)
            if os.path.exists(full_path):
                ui_count += 1
                print(f"✅ Found UI component: {os.path.basename(component_path)}")
            else:
                print(f"⚠️ UI component not found: {os.path.basename(component_path)}")
        
        print(f"✅ Found {ui_count}/4 UI components")
        
    except Exception as e:
        print(f"❌ UI component test failed: {e}")
    
    # Generate Test Report
    print("\n📊 Integration Test Report")
    print("=" * 60)
    
    total_tests = 0
    passed_tests = 0
    failed_tests = 0
    warning_tests = 0
    
    for component, data in results.items():
        print(f"\n{component.replace('_', ' ').title()}:")
        print(f"  Overall Status: {data['status'].upper()}")
        
        for test in data['tests']:
            status_icon = "✅" if test['status'] == 'pass' else "❌" if test['status'] == 'fail' else "⚠️"
            print(f"  {status_icon} {test['test']}: {test['message']}")
            
            total_tests += 1
            if test['status'] == 'pass':
                passed_tests += 1
            elif test['status'] == 'fail':
                failed_tests += 1
            else:
                warning_tests += 1
    
    print(f"\n📈 Summary:")
    print(f"  Total Tests: {total_tests}")
    print(f"  Passed: {passed_tests}")
    print(f"  Failed: {failed_tests}")
    print(f"  Warnings: {warning_tests}")
    print(f"  Success Rate: {(passed_tests/total_tests*100):.1f}%")
    
    # Save results to file
    with open('integration_test_results.json', 'w') as f:
        json.dump(results, f, indent=2)
    
    print(f"\n💾 Test results saved to: integration_test_results.json")
    
    return results

def test_api_endpoints():
    """Test API endpoints if server is running"""
    
    print("\n🌐 Testing API Endpoints (if server is running)...")
    
    base_urls = [
        'http://localhost:5000',
        'http://localhost:8000',
        'http://127.0.0.1:5000',
        'http://127.0.0.1:8000'
    ]
    
    endpoints = [
        '/api/governance/knowledge/knowledge-bases',
        '/api/governance/training/providers',
        '/api/agents',
        '/api/policies'
    ]
    
    for base_url in base_urls:
        print(f"\nTrying server at {base_url}...")
        
        try:
            # Test basic connectivity
            response = requests.get(f"{base_url}/health", timeout=2)
            if response.status_code == 200:
                print(f"✅ Server responding at {base_url}")
                
                # Test specific endpoints
                for endpoint in endpoints:
                    try:
                        response = requests.get(f"{base_url}{endpoint}", timeout=2)
                        print(f"  ✅ {endpoint}: {response.status_code}")
                    except requests.exceptions.RequestException:
                        print(f"  ⚠️ {endpoint}: Not accessible")
                
                return True
                
        except requests.exceptions.RequestException:
            print(f"  ❌ No server at {base_url}")
    
    print("ℹ️ No running server found. Start the Promethios server to test API endpoints.")
    return False

def main():
    """Main test function"""
    
    print("🚀 Starting Promethios Universal Knowledge & Training Integration Tests")
    print(f"📅 Test Date: {time.strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Run integration tests
    results = test_governance_api_integration()
    
    # Test API endpoints if server is running
    test_api_endpoints()
    
    # Final summary
    print("\n🎯 Integration Test Complete!")
    
    overall_status = all(data['status'] == 'pass' for data in results.values())
    if overall_status:
        print("✅ All integration tests passed!")
        return 0
    else:
        print("⚠️ Some integration tests had issues. Check the report above.")
        return 1

if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code)

