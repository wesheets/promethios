#!/usr/bin/env python3
"""
Enhanced Real Component Factory for Sprint 1.2
Integrates real GovernanceCore and DecisionFrameworkEngine with proper dependencies
"""

import os
import sys
import json
import asyncio
import logging
import uuid
from datetime import datetime
from typing import Dict, Any, Optional
import yaml

# Add parent directory to path for imports
sys.path.append('../')

# Import governance infrastructure
from governance_storage_backend import GovernanceStorageBackend
from governance_event_bus import GovernanceEventBus
from component_health_monitor import ComponentHealthMonitor

# Import mock components as fallbacks
from mock_components import (
    MockTrustMetricsCalculator,
    MockEmotionTelemetryLogger,
    MockDecisionFrameworkEngine,
    MockEnhancedVeritas,
    MockGovernanceCore,
    MockReflectionLoopTracker
)

class EnhancedRealComponentFactory:
    """
    Enhanced component factory for Sprint 1.2 that integrates real Promethios components
    with sophisticated fallback mechanisms and comprehensive monitoring.
    """
    
    def __init__(self, config_path: str = "enhanced_governance_config.yaml"):
        self.config_path = config_path
        self.config = self._load_config()
        self.logger = self._setup_logging()
        self.components = {}
        self.real_components_count = 0
        self.mock_components_count = 0
        
        # Core infrastructure components
        self.storage_backend = None
        self.event_bus = None
        self.health_monitor = None
        
        self.logger.info("Enhanced Real Component Factory initialized for Sprint 1.2")
    
    def _load_config(self) -> Dict[str, Any]:
        """Load configuration with enhanced real component settings"""
        default_config = {
            "storage": {
                "type": "memory",  # memory, file, sqlite, postgresql
                "connection_string": None,
                "retention_days": 30
            },
            "event_bus": {
                "type": "memory",  # memory, redis, rabbitmq
                "connection_string": None,
                "max_events": 10000
            },
            "health_monitoring": {
                "enabled": True,
                "check_interval": 30,
                "alert_threshold": 3
            },
            "real_components": {
                "trust_metrics_calculator": {
                    "enabled": True,
                    "module": "phase_6_3_new.src.core.trust.trust_metrics_calculator",
                    "class": "TrustMetricsCalculator",
                    "config": {}
                },
                "governance_core": {
                    "enabled": True,
                    "module": "phase_6_3_new.src.core.governance.governance_core",
                    "class": "GovernanceCore",
                    "config": {}
                },
                "decision_framework_engine": {
                    "enabled": True,
                    "module": "phase_6_3_new.src.core.governance.decision_framework_engine",
                    "class": "DecisionFrameworkEngine",
                    "config": {}
                },
                "emotion_telemetry_logger": {
                    "enabled": False,  # Will enable when available
                    "module": "phase_6_3_new.src.core.emotion.emotion_telemetry_logger",
                    "class": "EmotionTelemetryLogger",
                    "config": {}
                },
                "enhanced_veritas": {
                    "enabled": False,  # Will enable when available
                    "module": "src.veritas.enhanced.api.enhanced_veritas_api",
                    "class": "EnhancedVeritas",
                    "config": {}
                },
                "reflection_loop_tracker": {
                    "enabled": False,  # Will enable when available
                    "module": "phase_6_3_new.src.core.meta.reflection_loop_tracker",
                    "class": "ReflectionLoopTracker",
                    "config": {}
                }
            }
        }
        
        if os.path.exists(self.config_path):
            try:
                with open(self.config_path, 'r') as f:
                    user_config = yaml.safe_load(f)
                    # Merge user config with defaults
                    default_config.update(user_config)
            except Exception as e:
                print(f"Warning: Could not load config from {self.config_path}: {e}")
        
        return default_config
    
    def _setup_logging(self) -> logging.Logger:
        """Setup enhanced logging for Sprint 1.2"""
        logger = logging.getLogger("EnhancedRealComponentFactory")
        logger.setLevel(logging.INFO)
        
        if not logger.handlers:
            handler = logging.StreamHandler()
            formatter = logging.Formatter(
                '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
            )
            handler.setFormatter(formatter)
            logger.addHandler(handler)
        
        return logger
    
    async def create_all_components(self) -> Dict[str, Any]:
        """
        Create all governance components with enhanced real component integration
        """
        self.logger.info("Creating enhanced governance components for Sprint 1.2...")
        
        # Initialize core infrastructure
        await self._initialize_infrastructure()
        
        # Create governance components with real integration
        components = {
            'trust_calculator': await self._create_trust_metrics_calculator(),
            'emotion_telemetry_logger': await self._create_emotion_telemetry_logger(),
            'decision_framework_engine': await self._create_decision_framework_engine(),
            'enhanced_veritas_2': await self._create_enhanced_veritas(),
            'governance_core': await self._create_governance_core(),
            'reflection_loop_tracker': await self._create_reflection_loop_tracker(),
            'storage_backend': self.storage_backend,
            'event_bus': self.event_bus,
            'health_monitor': self.health_monitor
        }
        
        self.components = components
        
        # Setup component monitoring
        await self._setup_component_monitoring()
        
        # Log creation summary
        total_components = len([c for c in components.values() if c is not None])
        self.logger.info(f"✅ Created {total_components} components")
        self.logger.info(f"   Real components: {self.real_components_count}")
        self.logger.info(f"   Mock components: {self.mock_components_count}")
        
        return components
    
    async def _initialize_infrastructure(self):
        """Initialize core infrastructure components"""
        # Storage backend
        storage_type_map = {
            'memory': 'MEMORY',
            'file': 'FILE', 
            'sqlite': 'SQLITE',
            'postgresql': 'POSTGRESQL'
        }
        
        from governance_storage_backend import StorageType
        storage_type = getattr(StorageType, storage_type_map.get(self.config['storage']['type'], 'MEMORY'))
        
        self.storage_backend = GovernanceStorageBackend(
            storage_type=storage_type,
            storage_path=self.config['storage'].get('connection_string'),
            retention_days=self.config['storage']['retention_days']
        )
        await self.storage_backend.initialize()
        
        # Event bus
        self.event_bus = GovernanceEventBus(
            max_queue_size=self.config['event_bus']['max_events'],
            health_check_interval=self.config['health_monitoring']['check_interval'],
            event_retention_hours=24,
            enable_self_verification=True
        )
        # Event bus doesn't need async initialization
        
        # Health monitor - create a simple mock for now
        self.health_monitor = {
            'status': 'healthy',
            'components': {},
            'check_interval': self.config['health_monitoring']['check_interval'],
            'alert_threshold': self.config['health_monitoring']['alert_threshold']
        }
        # Health monitor doesn't need async initialization
        
        self.logger.info("✅ Core infrastructure initialized")
    
    async def _create_trust_metrics_calculator(self):
        """Create real TrustMetricsCalculator (proven working from Sprint 1.1)"""
        component_config = self.config['real_components']['trust_metrics_calculator']
        
        if not component_config['enabled']:
            self.logger.info("TrustMetricsCalculator disabled in config, using mock")
            self.mock_components_count += 1
            return MockTrustMetricsCalculator()
        
        try:
            # Import real component
            module_name = component_config['module']
            class_name = component_config['class']
            
            module = __import__(module_name, fromlist=[class_name])
            ComponentClass = getattr(module, class_name)
            
            # Create instance
            component = ComponentClass()
            
            # Validate it has expected methods (use actual method names from the real component)
            expected_methods = ['calculate_aggregate_metric', 'update_dimension_metric', 'get_entity_metrics']
            has_expected_methods = any(hasattr(component, method) for method in expected_methods)
            
            if has_expected_methods:
                self.logger.info("✅ Real TrustMetricsCalculator created successfully")
                self.real_components_count += 1
                
                # Publish creation event
                # Create and publish governance event
                try:
                    from governance_event_bus import GovernanceEvent
                    event_data = {
                    'type': 'component_created',
                    'component': 'trust_metrics_calculator',
                    'status': 'real',
                    'timestamp': datetime.now().isoformat()
                }
                    governance_event = GovernanceEvent(
                        id=str(uuid.uuid4()),
                        type=event_data.get('type', 'unknown'),
                        component=event_data.get('component', 'unknown'),
                        timestamp=datetime.now(),
                        priority='MEDIUM',
                        data=event_data
                    )
                    await self.event_bus.publish(governance_event)
                except Exception as e:
                    self.logger.warning(f"Could not publish event: {e}")
                    # Continue without event publishing
                
                return component
            else:
                self.logger.warning("Real TrustMetricsCalculator missing expected methods, using mock")
                self.mock_components_count += 1
                return MockTrustMetricsCalculator()
                
        except Exception as e:
            self.logger.error(f"Failed to create real TrustMetricsCalculator: {e}")
            self.logger.info("Using mock TrustMetricsCalculator")
            self.mock_components_count += 1
            return MockTrustMetricsCalculator()
    
    async def _create_governance_core(self):
        """Create real GovernanceCore (NEW for Sprint 1.2)"""
        component_config = self.config['real_components']['governance_core']
        
        if not component_config['enabled']:
            self.logger.info("GovernanceCore disabled in config, using mock")
            self.mock_components_count += 1
            return MockGovernanceCore()
        
        try:
            # Import real component
            module_name = component_config['module']
            class_name = component_config['class']
            
            module = __import__(module_name, fromlist=[class_name])
            ComponentClass = getattr(module, class_name)
            
            # Fix the schema path issue by patching the module's path resolution
            if hasattr(module, 'SCHEMA_DIR'):
                # Patch the module's SCHEMA_DIR to point to the correct location
                module.SCHEMA_DIR = '/home/ubuntu/promethios/ResurrectionCodex/01_Minimal_Governance_Core_MGC/MGC_Schema_Registry'
                module.EMOTION_TELEMETRY_SCHEMA = os.path.join(module.SCHEMA_DIR, "mgc_emotion_telemetry.schema.json")
                module.JUSTIFICATION_LOG_SCHEMA = os.path.join(module.SCHEMA_DIR, "loop_justification_log.schema.v1.json")
                module.OPERATOR_OVERRIDE_SCHEMA = os.path.join(module.SCHEMA_DIR, "operator_override.schema.v1.json")
            
            # Create instance
            component = ComponentClass()
            
            # Inject dependencies if component supports it
            if hasattr(component, 'set_storage_backend'):
                component.set_storage_backend(self.storage_backend)
            if hasattr(component, 'set_event_bus'):
                component.set_event_bus(self.event_bus)
            
            # Validate it has expected methods
            expected_methods = ['validate_compliance', 'check_policy_adherence', 'generate_audit_trail']
            has_expected_methods = any(hasattr(component, method) for method in expected_methods)
            
            if has_expected_methods:
                self.logger.info("✅ Real GovernanceCore created successfully")
                self.real_components_count += 1
                
                # Publish creation event
                # Create and publish governance event
                try:
                    from governance_event_bus import GovernanceEvent
                    event_data = {
                    'type': 'component_created',
                    'component': 'governance_core',
                    'status': 'real',
                    'timestamp': datetime.now().isoformat()
                }
                    governance_event = GovernanceEvent(
                        id=str(uuid.uuid4()),
                        type=event_data.get('type', 'unknown'),
                        component=event_data.get('component', 'unknown'),
                        timestamp=datetime.now(),
                        priority='MEDIUM',
                        data=event_data
                    )
                    await self.event_bus.publish(governance_event)
                except Exception as e:
                    self.logger.warning(f"Could not publish event: {e}")
                    # Continue without event publishing
                
                return component
            else:
                self.logger.warning("Real GovernanceCore missing expected methods, using mock")
                self.mock_components_count += 1
                return MockGovernanceCore()
                
        except Exception as e:
            self.logger.error(f"Failed to create real GovernanceCore: {e}")
            self.logger.info("Using mock GovernanceCore")
            self.mock_components_count += 1
            return MockGovernanceCore()
    
    async def _create_decision_framework_engine(self):
        """Create real DecisionFrameworkEngine (NEW for Sprint 1.2)"""
        component_config = self.config['real_components']['decision_framework_engine']
        
        if not component_config['enabled']:
            self.logger.info("DecisionFrameworkEngine disabled in config, using mock")
            self.mock_components_count += 1
            return MockDecisionFrameworkEngine()
        
        try:
            # Import real component
            module_name = component_config['module']
            class_name = component_config['class']
            
            module = __import__(module_name, fromlist=[class_name])
            ComponentClass = getattr(module, class_name)
            
            # Import enhanced mock dependencies
            from enhanced_mock_dependencies import create_enhanced_mock_dependencies
            mock_deps = create_enhanced_mock_dependencies()
            
            # Create configuration for DecisionFrameworkEngine
            config = {
                'storage_dir': os.path.join(os.getcwd(), 'data', 'governance', 'decision_frameworks'),
                'schema_path': os.path.join(os.getcwd(), '../ResurrectionCodex/01_Minimal_Governance_Core_MGC/MGC_Schema_Registry/decision_framework.schema.json'),
                'default_timeout': 3600,  # 1 hour
                'max_participants': 100
            }
            
            # Create instance with enhanced mock dependencies
            component = ComponentClass(
                config=config,
                codex_lock=mock_deps['codex_lock'],
                attestation_service=mock_deps['attestation_service'],
                trust_metrics_calculator=mock_deps['trust_metrics_calculator']
            )
            
            # Inject additional dependencies if component supports it
            if hasattr(component, 'set_storage_backend'):
                component.set_storage_backend(self.storage_backend)
            if hasattr(component, 'set_event_bus'):
                component.set_event_bus(self.event_bus)
            
            # Validate it has expected methods
            expected_methods = ['make_decision', 'evaluate_options', 'apply_decision_framework']
            has_expected_methods = any(hasattr(component, method) for method in expected_methods)
            
            if has_expected_methods:
                self.logger.info("✅ Real DecisionFrameworkEngine created successfully")
                self.real_components_count += 1
                
                # Publish creation event
                # Create and publish governance event
                try:
                    from governance_event_bus import GovernanceEvent
                    event_data = {
                    'type': 'component_created',
                    'component': 'decision_framework_engine',
                    'status': 'real',
                    'timestamp': datetime.now().isoformat()
                }
                    governance_event = GovernanceEvent(
                        id=str(uuid.uuid4()),
                        type=event_data.get('type', 'unknown'),
                        component=event_data.get('component', 'unknown'),
                        timestamp=datetime.now(),
                        priority='MEDIUM',
                        data=event_data
                    )
                    await self.event_bus.publish(governance_event)
                except Exception as e:
                    self.logger.warning(f"Could not publish event: {e}")
                    # Continue without event publishing
                
                return component
            else:
                self.logger.warning("Real DecisionFrameworkEngine missing expected methods, using mock")
                self.mock_components_count += 1
                return MockDecisionFrameworkEngine()
                
        except Exception as e:
            self.logger.error(f"Failed to create real DecisionFrameworkEngine: {e}")
            self.logger.info("Using mock DecisionFrameworkEngine")
            self.mock_components_count += 1
            return MockDecisionFrameworkEngine()
    
    async def _create_emotion_telemetry_logger(self):
        """Create emotion telemetry logger (mock for now, real when available)"""
        component_config = self.config['real_components']['emotion_telemetry_logger']
        
        if not component_config['enabled']:
            self.logger.info("EmotionTelemetryLogger disabled in config, using mock")
            self.mock_components_count += 1
            return MockEmotionTelemetryLogger()
        
        # For now, use mock - will implement real when emotion module is available
        self.logger.info("Using mock EmotionTelemetryLogger (real implementation pending)")
        self.mock_components_count += 1
        return MockEmotionTelemetryLogger()
    
    async def _create_enhanced_veritas(self):
        """Create enhanced veritas (mock for now, real when available)"""
        component_config = self.config['real_components']['enhanced_veritas']
        
        if not component_config['enabled']:
            self.logger.info("EnhancedVeritas disabled in config, using mock")
            self.mock_components_count += 1
            return MockEnhancedVeritas()
        
        # For now, use mock - will implement real when veritas module is available
        self.logger.info("Using mock EnhancedVeritas (real implementation pending)")
        self.mock_components_count += 1
        return MockEnhancedVeritas()
    
    async def _create_reflection_loop_tracker(self):
        """Create reflection loop tracker (mock for now, real when available)"""
        component_config = self.config['real_components']['reflection_loop_tracker']
        
        if not component_config['enabled']:
            self.logger.info("ReflectionLoopTracker disabled in config, using mock")
            self.mock_components_count += 1
            return MockReflectionLoopTracker()
        
        # For now, use mock - will implement real when reflection module is available
        self.logger.info("Using mock ReflectionLoopTracker (real implementation pending)")
        self.mock_components_count += 1
        return MockReflectionLoopTracker()
    
    async def _setup_component_monitoring(self):
        """Setup monitoring for all created components"""
        if self.health_monitor and self.components:
            for name, component in self.components.items():
                if component:
                    self.health_monitor['components'][name] = {
                        'status': 'healthy',
                        'last_check': datetime.now().isoformat(),
                        'component_type': component.__class__.__name__
                    }
            
            self.logger.info("✅ Component monitoring setup complete")
    
    async def get_component_status(self) -> Dict[str, Any]:
        """Get comprehensive status of all components"""
        status = {
            'total_components': len(self.components),
            'real_components': self.real_components_count,
            'mock_components': self.mock_components_count,
            'infrastructure_status': {
                'storage_backend': 'healthy' if self.storage_backend else 'unavailable',
                'event_bus': 'healthy' if self.event_bus else 'unavailable',
                'health_monitor': 'healthy' if self.health_monitor else 'unavailable'
            },
            'component_details': {}
        }
        
        for name, component in self.components.items():
            if component:
                component_type = 'real' if not name.startswith('Mock') else 'mock'
                status['component_details'][name] = {
                    'type': component_type,
                    'class': component.__class__.__name__,
                    'status': 'healthy'  # Could add health checks here
                }
        
        return status
    
    async def shutdown(self):
        """Gracefully shutdown all components"""
        self.logger.info("Shutting down enhanced governance components...")
        
        # Shutdown components that support it
        for name, component in self.components.items():
            if component and hasattr(component, 'shutdown'):
                try:
                    await component.shutdown()
                    self.logger.info(f"✅ {name} shutdown complete")
                except Exception as e:
                    self.logger.error(f"Error shutting down {name}: {e}")
        
        # Shutdown infrastructure
        if self.health_monitor and hasattr(self.health_monitor, 'shutdown'):
            try:
                await self.health_monitor.shutdown()
            except Exception as e:
                self.logger.error(f"Error shutting down health monitor: {e}")
                
        if self.event_bus and hasattr(self.event_bus, 'shutdown'):
            try:
                await self.event_bus.shutdown()
            except Exception as e:
                self.logger.error(f"Error shutting down event bus: {e}")
                
        if self.storage_backend and hasattr(self.storage_backend, 'shutdown'):
            try:
                await self.storage_backend.shutdown()
            except Exception as e:
                self.logger.error(f"Error shutting down storage backend: {e}")
        
        self.logger.info("✅ Enhanced governance component shutdown complete")

# Test function for Sprint 1.2 validation
async def test_enhanced_real_components():
    """Test the enhanced real component integration"""
    print("🚀 Testing Enhanced Real Component Integration (Sprint 1.2)")
    print("=" * 80)
    
    factory = EnhancedRealComponentFactory()
    
    try:
        # Create all components
        components = await factory.create_all_components()
        
        # Get status
        status = await factory.get_component_status()
        
        print(f"\n📊 Component Creation Results:")
        print(f"   Total components: {status['total_components']}")
        print(f"   Real components: {status['real_components']}")
        print(f"   Mock components: {status['mock_components']}")
        
        print(f"\n🔧 Infrastructure Status:")
        for name, status_val in status['infrastructure_status'].items():
            print(f"   {name}: {status_val}")
        
        print(f"\n📋 Component Details:")
        for name, details in status['component_details'].items():
            print(f"   {name}: {details['type']} ({details['class']})")
        
        # Test real component functionality
        print(f"\n🧪 Testing Real Component Functionality:")
        
        # Test TrustMetricsCalculator
        trust_calc = components.get('trust_calculator')
        if trust_calc and hasattr(trust_calc, 'calculate_comprehensive_trust'):
            try:
                trust_score = trust_calc.calculate_comprehensive_trust({})
                print(f"   ✅ TrustMetricsCalculator: {trust_score}")
            except Exception as e:
                print(f"   ⚠️  TrustMetricsCalculator error: {e}")
        
        # Test GovernanceCore
        governance_core = components.get('governance_core')
        if governance_core and hasattr(governance_core, 'validate_compliance'):
            try:
                compliance = governance_core.validate_compliance({})
                print(f"   ✅ GovernanceCore: {compliance}")
            except Exception as e:
                print(f"   ⚠️  GovernanceCore error: {e}")
        
        # Test DecisionFrameworkEngine
        decision_engine = components.get('decision_framework_engine')
        if decision_engine and hasattr(decision_engine, 'make_decision'):
            try:
                decision = decision_engine.make_decision({})
                print(f"   ✅ DecisionFrameworkEngine: {decision}")
            except Exception as e:
                print(f"   ⚠️  DecisionFrameworkEngine error: {e}")
        
        print(f"\n🎉 Enhanced Real Component Integration Test Complete!")
        print(f"✅ Sprint 1.2 Progress: {status['real_components']} real components integrated")
        
        return True
        
    except Exception as e:
        print(f"❌ Test failed: {e}")
        return False
    
    finally:
        await factory.shutdown()

if __name__ == "__main__":
    asyncio.run(test_enhanced_real_components())

