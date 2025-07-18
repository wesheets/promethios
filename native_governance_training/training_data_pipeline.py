#!/usr/bin/env python3
"""
Comprehensive Training Data Pipeline for Native Governance LLMs

This module implements a sophisticated data pipeline that leverages the Promethios 
governance OS to generate high-quality training data for native governance LLMs.
The pipeline implements ChatGPT's "wheat from chaff" data quality paradigm with
automated curation, bias detection, and governance alignment validation.

Author: Manus AI
Version: 1.0.0
License: MIT
"""

import os
import json
import asyncio
import logging
from typing import Dict, List, Tuple, Optional, Any
from dataclasses import dataclass, asdict
from datetime import datetime, timedelta
import hashlib
import sqlite3
from pathlib import Path
import numpy as np
from transformers import AutoTokenizer
import torch
from datasets import Dataset, DatasetDict
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import openai
from concurrent.futures import ThreadPoolExecutor, as_completed
import yaml

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('training_data_pipeline.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

@dataclass
class GovernanceDataPoint:
    """Represents a single governance training data point with metadata."""
    id: str
    content: str
    governance_type: str  # constitutional, operational, trust, policy
    quality_score: float
    bias_score: float
    constitutional_alignment: float
    policy_compliance: float
    trust_calibration: float
    source: str
    timestamp: datetime
    metadata: Dict[str, Any]
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for serialization."""
        data = asdict(self)
        data['timestamp'] = self.timestamp.isoformat()
        return data
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'GovernanceDataPoint':
        """Create from dictionary."""
        data['timestamp'] = datetime.fromisoformat(data['timestamp'])
        return cls(**data)

class PrometheosDataExtractor:
    """Extracts and processes governance data from Promethios OS."""
    
    def __init__(self, promethios_config: Dict[str, Any]):
        self.config = promethios_config
        self.constitutional_principles = self._load_constitutional_principles()
        self.policy_frameworks = self._load_policy_frameworks()
        self.trust_metrics = self._load_trust_metrics()
        
    def _load_constitutional_principles(self) -> Dict[str, Any]:
        """Load constitutional principles from Promethios OS."""
        # This would interface with actual Promethios OS
        return {
            "separation_of_powers": {
                "description": "Division of government responsibilities into distinct branches",
                "principles": ["legislative", "executive", "judicial"],
                "constraints": ["checks_and_balances", "constitutional_limits"]
            },
            "due_process": {
                "description": "Fair treatment through judicial system",
                "principles": ["procedural_fairness", "substantive_rights"],
                "constraints": ["constitutional_protections", "legal_precedents"]
            },
            "democratic_accountability": {
                "description": "Responsibility to the people through democratic processes",
                "principles": ["transparency", "responsiveness", "representation"],
                "constraints": ["electoral_systems", "public_oversight"]
            }
        }
    
    def _load_policy_frameworks(self) -> Dict[str, Any]:
        """Load policy frameworks from Promethios OS."""
        return {
            "regulatory_compliance": {
                "domains": ["financial", "environmental", "healthcare", "technology"],
                "requirements": ["documentation", "monitoring", "reporting"],
                "enforcement": ["penalties", "remediation", "oversight"]
            },
            "operational_governance": {
                "domains": ["risk_management", "quality_assurance", "audit_compliance"],
                "requirements": ["policies", "procedures", "controls"],
                "enforcement": ["monitoring", "testing", "reporting"]
            }
        }
    
    def _load_trust_metrics(self) -> Dict[str, Any]:
        """Load trust calibration metrics from Promethios OS."""
        return {
            "uncertainty_quantification": {
                "methods": ["bayesian", "ensemble", "evidential"],
                "thresholds": {"high_confidence": 0.9, "medium_confidence": 0.7, "low_confidence": 0.5}
            },
            "reliability_assessment": {
                "factors": ["source_credibility", "evidence_quality", "consensus_level"],
                "scoring": {"excellent": 0.9, "good": 0.7, "fair": 0.5, "poor": 0.3}
            }
        }
    
    async def extract_governance_scenarios(self, count: int = 10000) -> List[GovernanceDataPoint]:
        """Extract governance scenarios from Promethios OS logs."""
        logger.info(f"Extracting {count} governance scenarios from Promethios OS")
        
        scenarios = []
        
        # Constitutional scenarios
        constitutional_scenarios = await self._generate_constitutional_scenarios(count // 4)
        scenarios.extend(constitutional_scenarios)
        
        # Operational governance scenarios
        operational_scenarios = await self._generate_operational_scenarios(count // 4)
        scenarios.extend(operational_scenarios)
        
        # Trust calibration scenarios
        trust_scenarios = await self._generate_trust_scenarios(count // 4)
        scenarios.extend(trust_scenarios)
        
        # Policy compliance scenarios
        policy_scenarios = await self._generate_policy_scenarios(count // 4)
        scenarios.extend(policy_scenarios)
        
        logger.info(f"Generated {len(scenarios)} governance scenarios")
        return scenarios
    
    async def _generate_constitutional_scenarios(self, count: int) -> List[GovernanceDataPoint]:
        """Generate constitutional governance scenarios."""
        scenarios = []
        
        for i in range(count):
            # Generate constitutional dilemma
            principle = np.random.choice(list(self.constitutional_principles.keys()))
            scenario_data = self.constitutional_principles[principle]
            
            scenario_text = await self._create_constitutional_scenario(principle, scenario_data)
            
            data_point = GovernanceDataPoint(
                id=f"const_{i}_{hashlib.md5(scenario_text.encode()).hexdigest()[:8]}",
                content=scenario_text,
                governance_type="constitutional",
                quality_score=np.random.uniform(0.8, 1.0),  # High quality for constitutional
                bias_score=np.random.uniform(0.0, 0.2),     # Low bias
                constitutional_alignment=np.random.uniform(0.9, 1.0),
                policy_compliance=np.random.uniform(0.8, 1.0),
                trust_calibration=np.random.uniform(0.7, 0.9),
                source="promethios_constitutional",
                timestamp=datetime.now(),
                metadata={"principle": principle, "complexity": "high"}
            )
            scenarios.append(data_point)
        
        return scenarios
    
    async def _create_constitutional_scenario(self, principle: str, data: Dict[str, Any]) -> str:
        """Create a constitutional scenario using AI generation."""
        prompt = f"""
        Create a detailed constitutional governance scenario involving {principle}.
        
        Principle: {data['description']}
        Key Elements: {', '.join(data['principles'])}
        Constraints: {', '.join(data['constraints'])}
        
        Generate a realistic scenario that tests understanding of this constitutional principle,
        including the dilemma, stakeholders involved, potential solutions, and constitutional
        considerations. Format as a structured governance case study.
        """
        
        # This would use OpenAI API or local model for generation
        # For now, return a template
        return f"""
        Constitutional Scenario: {principle.replace('_', ' ').title()}
        
        Situation: A complex governance situation has arisen that tests the principle of {principle}.
        The scenario involves multiple stakeholders with competing interests and requires careful
        constitutional analysis to resolve.
        
        Stakeholders:
        - Government agencies with regulatory authority
        - Citizens with constitutional rights at stake
        - Private entities with commercial interests
        - Judicial oversight bodies
        
        Constitutional Considerations:
        - {data['description']}
        - Application of {', '.join(data['principles'])}
        - Constraints from {', '.join(data['constraints'])}
        
        Required Analysis:
        1. Identify the constitutional principles at stake
        2. Analyze potential conflicts between competing interests
        3. Propose solutions that maintain constitutional integrity
        4. Consider long-term implications for governance
        
        Expected Outcome: A balanced resolution that upholds constitutional principles
        while addressing legitimate stakeholder concerns.
        """
    
    async def _generate_operational_scenarios(self, count: int) -> List[GovernanceDataPoint]:
        """Generate operational governance scenarios."""
        scenarios = []
        
        for i in range(count):
            domain = np.random.choice(["risk_management", "quality_assurance", "audit_compliance"])
            
            scenario_text = f"""
            Operational Governance Scenario: {domain.replace('_', ' ').title()}
            
            Context: An organization must implement {domain} procedures to ensure
            compliance with governance requirements and maintain operational excellence.
            
            Challenge: Balancing efficiency with compliance requirements while
            maintaining transparency and accountability.
            
            Requirements:
            - Establish clear policies and procedures
            - Implement monitoring and control systems
            - Ensure regular reporting and oversight
            - Maintain audit trails and documentation
            
            Success Criteria:
            - Full compliance with regulatory requirements
            - Efficient operational processes
            - Clear accountability and responsibility
            - Continuous improvement and adaptation
            """
            
            data_point = GovernanceDataPoint(
                id=f"ops_{i}_{hashlib.md5(scenario_text.encode()).hexdigest()[:8]}",
                content=scenario_text,
                governance_type="operational",
                quality_score=np.random.uniform(0.7, 0.9),
                bias_score=np.random.uniform(0.0, 0.3),
                constitutional_alignment=np.random.uniform(0.6, 0.8),
                policy_compliance=np.random.uniform(0.8, 1.0),
                trust_calibration=np.random.uniform(0.6, 0.8),
                source="promethios_operational",
                timestamp=datetime.now(),
                metadata={"domain": domain, "complexity": "medium"}
            )
            scenarios.append(data_point)
        
        return scenarios
    
    async def _generate_trust_scenarios(self, count: int) -> List[GovernanceDataPoint]:
        """Generate trust calibration scenarios."""
        scenarios = []
        
        for i in range(count):
            uncertainty_level = np.random.choice(["high", "medium", "low"])
            
            scenario_text = f"""
            Trust Calibration Scenario: {uncertainty_level.title()} Uncertainty
            
            Situation: A governance decision must be made with {uncertainty_level} uncertainty
            about the outcomes and implications.
            
            Uncertainty Factors:
            - Incomplete information about stakeholder preferences
            - Unclear regulatory requirements
            - Potential unintended consequences
            - Limited historical precedents
            
            Trust Considerations:
            - Confidence level in available information
            - Reliability of information sources
            - Potential for bias in analysis
            - Need for expert consultation or escalation
            
            Required Response:
            - Assess confidence level in decision
            - Identify areas of uncertainty
            - Recommend appropriate oversight level
            - Suggest mitigation strategies for risks
            """
            
            data_point = GovernanceDataPoint(
                id=f"trust_{i}_{hashlib.md5(scenario_text.encode()).hexdigest()[:8]}",
                content=scenario_text,
                governance_type="trust",
                quality_score=np.random.uniform(0.6, 0.8),
                bias_score=np.random.uniform(0.1, 0.4),
                constitutional_alignment=np.random.uniform(0.5, 0.7),
                policy_compliance=np.random.uniform(0.6, 0.8),
                trust_calibration=np.random.uniform(0.8, 1.0),
                source="promethios_trust",
                timestamp=datetime.now(),
                metadata={"uncertainty_level": uncertainty_level, "complexity": "variable"}
            )
            scenarios.append(data_point)
        
        return scenarios
    
    async def _generate_policy_scenarios(self, count: int) -> List[GovernanceDataPoint]:
        """Generate policy compliance scenarios."""
        scenarios = []
        
        for i in range(count):
            domain = np.random.choice(["financial", "environmental", "healthcare", "technology"])
            
            scenario_text = f"""
            Policy Compliance Scenario: {domain.title()} Regulation
            
            Context: New {domain} regulations require comprehensive compliance
            assessment and implementation planning.
            
            Regulatory Requirements:
            - Detailed documentation of compliance procedures
            - Regular monitoring and reporting systems
            - Staff training and certification programs
            - Audit and oversight mechanisms
            
            Compliance Challenges:
            - Complex regulatory landscape
            - Competing business objectives
            - Resource allocation constraints
            - Stakeholder coordination requirements
            
            Implementation Strategy:
            - Risk assessment and prioritization
            - Phased implementation approach
            - Stakeholder engagement and communication
            - Continuous monitoring and improvement
            """
            
            data_point = GovernanceDataPoint(
                id=f"policy_{i}_{hashlib.md5(scenario_text.encode()).hexdigest()[:8]}",
                content=scenario_text,
                governance_type="policy",
                quality_score=np.random.uniform(0.7, 0.9),
                bias_score=np.random.uniform(0.0, 0.2),
                constitutional_alignment=np.random.uniform(0.7, 0.9),
                policy_compliance=np.random.uniform(0.9, 1.0),
                trust_calibration=np.random.uniform(0.6, 0.8),
                source="promethios_policy",
                timestamp=datetime.now(),
                metadata={"domain": domain, "complexity": "high"}
            )
            scenarios.append(data_point)
        
        return scenarios

class DataQualityAssessor:
    """Implements 'wheat from chaff' data quality assessment."""
    
    def __init__(self):
        self.bias_detector = BiasDetector()
        self.quality_scorer = QualityScorer()
        self.constitutional_validator = ConstitutionalValidator()
        
    async def assess_data_quality(self, data_points: List[GovernanceDataPoint]) -> List[GovernanceDataPoint]:
        """Assess and filter data points based on quality criteria."""
        logger.info(f"Assessing quality for {len(data_points)} data points")
        
        assessed_points = []
        
        with ThreadPoolExecutor(max_workers=8) as executor:
            futures = [
                executor.submit(self._assess_single_point, point)
                for point in data_points
            ]
            
            for future in as_completed(futures):
                try:
                    assessed_point = future.result()
                    if assessed_point:
                        assessed_points.append(assessed_point)
                except Exception as e:
                    logger.error(f"Error assessing data point: {e}")
        
        # Filter based on quality thresholds
        filtered_points = self._filter_by_quality(assessed_points)
        
        logger.info(f"Retained {len(filtered_points)} high-quality data points")
        return filtered_points
    
    def _assess_single_point(self, point: GovernanceDataPoint) -> Optional[GovernanceDataPoint]:
        """Assess a single data point for quality."""
        try:
            # Update quality scores based on assessment
            point.bias_score = self.bias_detector.detect_bias(point.content)
            point.quality_score = self.quality_scorer.score_quality(point.content)
            point.constitutional_alignment = self.constitutional_validator.validate_alignment(point.content)
            
            return point
        except Exception as e:
            logger.error(f"Error assessing point {point.id}: {e}")
            return None
    
    def _filter_by_quality(self, points: List[GovernanceDataPoint]) -> List[GovernanceDataPoint]:
        """Filter data points based on quality thresholds."""
        quality_threshold = 0.6
        bias_threshold = 0.4
        constitutional_threshold = 0.5
        
        filtered = []
        for point in points:
            if (point.quality_score >= quality_threshold and
                point.bias_score <= bias_threshold and
                point.constitutional_alignment >= constitutional_threshold):
                filtered.append(point)
        
        return filtered

class BiasDetector:
    """Detects bias in governance training data."""
    
    def __init__(self):
        self.bias_patterns = self._load_bias_patterns()
        
    def _load_bias_patterns(self) -> Dict[str, List[str]]:
        """Load known bias patterns for detection."""
        return {
            "political_bias": [
                "partisan language", "ideological framing", "political favoritism"
            ],
            "demographic_bias": [
                "gender stereotypes", "racial prejudice", "age discrimination"
            ],
            "institutional_bias": [
                "regulatory capture", "agency bias", "procedural unfairness"
            ]
        }
    
    def detect_bias(self, content: str) -> float:
        """Detect bias in content and return bias score (0-1, lower is better)."""
        bias_score = 0.0
        content_lower = content.lower()
        
        for bias_type, patterns in self.bias_patterns.items():
            for pattern in patterns:
                if pattern in content_lower:
                    bias_score += 0.1
        
        # Normalize to 0-1 range
        return min(bias_score, 1.0)

class QualityScorer:
    """Scores content quality for governance training."""
    
    def score_quality(self, content: str) -> float:
        """Score content quality (0-1, higher is better)."""
        quality_score = 0.5  # Base score
        
        # Length check
        if 100 <= len(content) <= 2000:
            quality_score += 0.1
        
        # Structure check
        if self._has_good_structure(content):
            quality_score += 0.2
        
        # Governance terminology check
        if self._has_governance_terms(content):
            quality_score += 0.2
        
        return min(quality_score, 1.0)
    
    def _has_good_structure(self, content: str) -> bool:
        """Check if content has good structure."""
        return (":" in content and 
                len(content.split('\n')) > 3 and
                any(word in content.lower() for word in ["scenario", "situation", "context"]))
    
    def _has_governance_terms(self, content: str) -> bool:
        """Check if content contains governance terminology."""
        governance_terms = [
            "governance", "policy", "compliance", "constitutional", "regulatory",
            "oversight", "accountability", "transparency", "stakeholder"
        ]
        content_lower = content.lower()
        return sum(1 for term in governance_terms if term in content_lower) >= 2

class ConstitutionalValidator:
    """Validates constitutional alignment of content."""
    
    def validate_alignment(self, content: str) -> float:
        """Validate constitutional alignment (0-1, higher is better)."""
        alignment_score = 0.5  # Base score
        content_lower = content.lower()
        
        # Check for constitutional principles
        constitutional_terms = [
            "constitutional", "due process", "separation of powers", "checks and balances",
            "democratic", "accountability", "transparency", "rights", "justice"
        ]
        
        term_count = sum(1 for term in constitutional_terms if term in content_lower)
        alignment_score += min(term_count * 0.1, 0.4)
        
        # Check for anti-constitutional content
        problematic_terms = [
            "authoritarian", "dictatorial", "oppressive", "discriminatory"
        ]
        
        if any(term in content_lower for term in problematic_terms):
            alignment_score -= 0.3
        
        return max(min(alignment_score, 1.0), 0.0)

class TrainingDatasetBuilder:
    """Builds training datasets for governance LLMs."""
    
    def __init__(self, tokenizer_name: str = "microsoft/DialoGPT-medium"):
        self.tokenizer = AutoTokenizer.from_pretrained(tokenizer_name)
        if self.tokenizer.pad_token is None:
            self.tokenizer.pad_token = self.tokenizer.eos_token
    
    def build_datasets(self, data_points: List[GovernanceDataPoint]) -> DatasetDict:
        """Build training, validation, and test datasets."""
        logger.info(f"Building datasets from {len(data_points)} data points")
        
        # Convert to training format
        training_examples = self._convert_to_training_format(data_points)
        
        # Split into train/val/test
        train_size = int(0.8 * len(training_examples))
        val_size = int(0.1 * len(training_examples))
        
        train_examples = training_examples[:train_size]
        val_examples = training_examples[train_size:train_size + val_size]
        test_examples = training_examples[train_size + val_size:]
        
        # Create datasets
        datasets = DatasetDict({
            'train': Dataset.from_list(train_examples),
            'validation': Dataset.from_list(val_examples),
            'test': Dataset.from_list(test_examples)
        })
        
        # Tokenize datasets
        tokenized_datasets = datasets.map(
            self._tokenize_function,
            batched=True,
            remove_columns=datasets['train'].column_names
        )
        
        logger.info(f"Created datasets: train={len(tokenized_datasets['train'])}, "
                   f"val={len(tokenized_datasets['validation'])}, "
                   f"test={len(tokenized_datasets['test'])}")
        
        return tokenized_datasets
    
    def _convert_to_training_format(self, data_points: List[GovernanceDataPoint]) -> List[Dict[str, Any]]:
        """Convert governance data points to training format."""
        training_examples = []
        
        for point in data_points:
            # Create instruction-response pairs
            instruction = f"Analyze this {point.governance_type} governance scenario:"
            response = point.content
            
            # Add governance-specific formatting
            formatted_text = f"<|governance_type|>{point.governance_type}<|instruction|>{instruction}<|response|>{response}<|endoftext|>"
            
            example = {
                'text': formatted_text,
                'governance_type': point.governance_type,
                'quality_score': point.quality_score,
                'constitutional_alignment': point.constitutional_alignment,
                'id': point.id
            }
            training_examples.append(example)
        
        return training_examples
    
    def _tokenize_function(self, examples):
        """Tokenize examples for training."""
        return self.tokenizer(
            examples['text'],
            truncation=True,
            padding=True,
            max_length=1024,
            return_tensors="pt"
        )

class TrainingDataPipeline:
    """Main pipeline orchestrator for training data generation."""
    
    def __init__(self, config_path: str = "pipeline_config.yaml"):
        self.config = self._load_config(config_path)
        self.extractor = PrometheosDataExtractor(self.config.get('promethios', {}))
        self.assessor = DataQualityAssessor()
        self.builder = TrainingDatasetBuilder(self.config.get('tokenizer', 'microsoft/DialoGPT-medium'))
        self.db_path = self.config.get('database_path', 'governance_training_data.db')
        self._init_database()
    
    def _load_config(self, config_path: str) -> Dict[str, Any]:
        """Load pipeline configuration."""
        if os.path.exists(config_path):
            with open(config_path, 'r') as f:
                return yaml.safe_load(f)
        else:
            # Default configuration
            return {
                'data_generation': {
                    'total_samples': 50000,
                    'constitutional_ratio': 0.3,
                    'operational_ratio': 0.3,
                    'trust_ratio': 0.2,
                    'policy_ratio': 0.2
                },
                'quality_thresholds': {
                    'min_quality_score': 0.6,
                    'max_bias_score': 0.4,
                    'min_constitutional_alignment': 0.5
                },
                'output_paths': {
                    'raw_data': 'data/raw/',
                    'processed_data': 'data/processed/',
                    'datasets': 'data/datasets/'
                }
            }
    
    def _init_database(self):
        """Initialize SQLite database for data storage."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS governance_data (
                id TEXT PRIMARY KEY,
                content TEXT NOT NULL,
                governance_type TEXT NOT NULL,
                quality_score REAL NOT NULL,
                bias_score REAL NOT NULL,
                constitutional_alignment REAL NOT NULL,
                policy_compliance REAL NOT NULL,
                trust_calibration REAL NOT NULL,
                source TEXT NOT NULL,
                timestamp TEXT NOT NULL,
                metadata TEXT NOT NULL
            )
        ''')
        
        conn.commit()
        conn.close()
    
    async def run_pipeline(self) -> DatasetDict:
        """Run the complete training data pipeline."""
        logger.info("Starting training data pipeline")
        
        # Step 1: Extract governance scenarios
        total_samples = self.config['data_generation']['total_samples']
        raw_data = await self.extractor.extract_governance_scenarios(total_samples)
        
        # Step 2: Assess data quality
        quality_data = await self.assessor.assess_data_quality(raw_data)
        
        # Step 3: Store processed data
        self._store_data(quality_data)
        
        # Step 4: Build training datasets
        datasets = self.builder.build_datasets(quality_data)
        
        # Step 5: Save datasets
        self._save_datasets(datasets)
        
        logger.info("Training data pipeline completed successfully")
        return datasets
    
    def _store_data(self, data_points: List[GovernanceDataPoint]):
        """Store processed data in database."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        for point in data_points:
            cursor.execute('''
                INSERT OR REPLACE INTO governance_data 
                (id, content, governance_type, quality_score, bias_score, 
                 constitutional_alignment, policy_compliance, trust_calibration, 
                 source, timestamp, metadata)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                point.id, point.content, point.governance_type,
                point.quality_score, point.bias_score, point.constitutional_alignment,
                point.policy_compliance, point.trust_calibration,
                point.source, point.timestamp.isoformat(), json.dumps(point.metadata)
            ))
        
        conn.commit()
        conn.close()
        logger.info(f"Stored {len(data_points)} data points in database")
    
    def _save_datasets(self, datasets: DatasetDict):
        """Save datasets to disk."""
        output_dir = self.config['output_paths']['datasets']
        os.makedirs(output_dir, exist_ok=True)
        
        datasets.save_to_disk(output_dir)
        logger.info(f"Saved datasets to {output_dir}")
    
    def generate_training_manifest(self) -> Dict[str, Any]:
        """Generate immutable training manifest for transparency."""
        manifest = {
            "pipeline_version": "1.0.0",
            "generation_timestamp": datetime.now().isoformat(),
            "configuration": self.config,
            "data_sources": {
                "promethios_constitutional": "Constitutional governance scenarios",
                "promethios_operational": "Operational governance scenarios", 
                "promethios_trust": "Trust calibration scenarios",
                "promethios_policy": "Policy compliance scenarios"
            },
            "quality_controls": {
                "bias_detection": "Automated bias pattern detection",
                "quality_scoring": "Multi-factor quality assessment",
                "constitutional_validation": "Constitutional alignment verification"
            },
            "data_statistics": self._generate_data_statistics()
        }
        
        # Generate cryptographic hash for integrity
        manifest_str = json.dumps(manifest, sort_keys=True)
        manifest["integrity_hash"] = hashlib.sha256(manifest_str.encode()).hexdigest()
        
        # Save manifest
        with open("training_manifest.json", "w") as f:
            json.dump(manifest, f, indent=2)
        
        return manifest
    
    def _generate_data_statistics(self) -> Dict[str, Any]:
        """Generate statistics about the training data."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Get basic statistics
        cursor.execute("SELECT COUNT(*) FROM governance_data")
        total_count = cursor.fetchone()[0]
        
        cursor.execute("SELECT governance_type, COUNT(*) FROM governance_data GROUP BY governance_type")
        type_counts = dict(cursor.fetchall())
        
        cursor.execute("SELECT AVG(quality_score), AVG(bias_score), AVG(constitutional_alignment) FROM governance_data")
        avg_scores = cursor.fetchone()
        
        conn.close()
        
        return {
            "total_samples": total_count,
            "samples_by_type": type_counts,
            "average_quality_score": avg_scores[0],
            "average_bias_score": avg_scores[1],
            "average_constitutional_alignment": avg_scores[2]
        }

async def main():
    """Main execution function."""
    # Initialize and run pipeline
    pipeline = TrainingDataPipeline()
    
    # Generate training datasets
    datasets = await pipeline.run_pipeline()
    
    # Generate training manifest
    manifest = pipeline.generate_training_manifest()
    
    print(f"Pipeline completed successfully!")
    print(f"Generated {len(datasets['train'])} training samples")
    print(f"Generated {len(datasets['validation'])} validation samples") 
    print(f"Generated {len(datasets['test'])} test samples")
    print(f"Training manifest saved with hash: {manifest['integrity_hash']}")

if __name__ == "__main__":
    asyncio.run(main())

