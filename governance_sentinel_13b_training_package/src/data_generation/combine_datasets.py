#!/usr/bin/env python3
"""
Dataset Combination and Validation System
Combines 7B foundation (21,000) + 13B enhanced (15,000) = 36,000 total examples
Validates quality, bias balance, and training readiness
"""

import json
import random
import logging
from typing import Dict, List, Any, Tuple
from datetime import datetime
import os
from pathlib import Path
from collections import defaultdict
import hashlib

class DatasetValidator:
    """Comprehensive dataset validation system"""
    
    def __init__(self):
        self.quality_thresholds = {
            "min_response_length": 100,
            "max_response_length": 5000,
            "required_metadata_fields": ["type", "political_perspective", "bias_checked"],
            "bias_balance_threshold": 0.7,  # Minimum balance score
            "diversity_threshold": 0.8      # Minimum diversity score
        }
        
        self.logger = logging.getLogger(__name__)
    
    def validate_complete_dataset(self, dataset: Dict[str, Any]) -> Dict[str, Any]:
        """Comprehensive dataset validation"""
        validation_results = {
            "timestamp": datetime.now().isoformat(),
            "total_examples": len(dataset.get("training_data", [])),
            "quality_checks": {},
            "bias_analysis": {},
            "diversity_metrics": {},
            "training_readiness": {},
            "issues_found": [],
            "recommendations": []
        }
        
        training_data = dataset.get("training_data", [])
        
        # Quality validation
        validation_results["quality_checks"] = self._validate_quality(training_data)
        
        # Bias analysis
        validation_results["bias_analysis"] = self._analyze_bias_balance(training_data)
        
        # Diversity metrics
        validation_results["diversity_metrics"] = self._calculate_diversity_metrics(training_data)
        
        # Training readiness
        validation_results["training_readiness"] = self._assess_training_readiness(training_data)
        
        # Generate recommendations
        validation_results["recommendations"] = self._generate_recommendations(validation_results)
        
        return validation_results
    
    def _validate_quality(self, training_data: List[Dict]) -> Dict[str, Any]:
        """Validate data quality"""
        quality_metrics = {
            "total_examples": len(training_data),
            "valid_examples": 0,
            "length_violations": 0,
            "missing_metadata": 0,
            "duplicate_content": 0,
            "format_errors": 0
        }
        
        seen_content = set()
        
        for i, example in enumerate(training_data):
            is_valid = True
            
            # Check required fields
            if not all(field in example for field in ["id", "type", "input", "output", "metadata"]):
                quality_metrics["format_errors"] += 1
                is_valid = False
                continue
            
            # Check response length
            output_length = len(example.get("output", ""))
            if output_length < self.quality_thresholds["min_response_length"]:
                quality_metrics["length_violations"] += 1
                is_valid = False
            elif output_length > self.quality_thresholds["max_response_length"]:
                quality_metrics["length_violations"] += 1
                is_valid = False
            
            # Check metadata completeness
            metadata = example.get("metadata", {})
            missing_fields = [field for field in self.quality_thresholds["required_metadata_fields"] 
                            if field not in metadata]
            if missing_fields:
                quality_metrics["missing_metadata"] += 1
                is_valid = False
            
            # Check for duplicates
            content_hash = hashlib.md5(example.get("output", "").encode()).hexdigest()
            if content_hash in seen_content:
                quality_metrics["duplicate_content"] += 1
                is_valid = False
            else:
                seen_content.add(content_hash)
            
            if is_valid:
                quality_metrics["valid_examples"] += 1
        
        quality_metrics["quality_score"] = quality_metrics["valid_examples"] / len(training_data) if training_data else 0
        
        return quality_metrics
    
    def _analyze_bias_balance(self, training_data: List[Dict]) -> Dict[str, Any]:
        """Analyze bias balance across dataset"""
        bias_analysis = {
            "political_balance": {},
            "cultural_diversity": {},
            "demographic_representation": {},
            "perspective_variety": {},
            "overall_bias_score": 0.0
        }
        
        # Political perspective balance
        political_counts = defaultdict(int)
        for example in training_data:
            perspective = example.get("metadata", {}).get("political_perspective")
            if perspective:
                political_counts[perspective] += 1
        
        if political_counts:
            total = sum(political_counts.values())
            expected_per_perspective = total / len(political_counts)
            max_deviation = max(abs(count - expected_per_perspective) for count in political_counts.values())
            political_balance_score = 1.0 - (max_deviation / total)
            bias_analysis["political_balance"] = {
                "counts": dict(political_counts),
                "balance_score": political_balance_score
            }
        
        # Cultural diversity
        cultural_counts = defaultdict(int)
        for example in training_data:
            culture = example.get("metadata", {}).get("cultural_context")
            if culture:
                cultural_counts[culture] += 1
        
        cultural_diversity_score = len(cultural_counts) / 10 if cultural_counts else 0  # Expect ~10 cultures
        bias_analysis["cultural_diversity"] = {
            "counts": dict(cultural_counts),
            "diversity_score": min(1.0, cultural_diversity_score)
        }
        
        # Demographic representation
        demographic_counts = defaultdict(lambda: defaultdict(int))
        for example in training_data:
            demographics = example.get("metadata", {}).get("demographics", {})
            for category, value in demographics.items():
                demographic_counts[category][value] += 1
        
        demo_balance_scores = []
        for category, values in demographic_counts.items():
            if values:
                total = sum(values.values())
                expected_per_value = total / len(values)
                max_deviation = max(abs(count - expected_per_value) for count in values.values())
                balance_score = 1.0 - (max_deviation / total)
                demo_balance_scores.append(balance_score)
        
        demographic_balance_score = sum(demo_balance_scores) / len(demo_balance_scores) if demo_balance_scores else 0
        bias_analysis["demographic_representation"] = {
            "category_counts": {cat: dict(vals) for cat, vals in demographic_counts.items()},
            "balance_score": demographic_balance_score
        }
        
        # Overall bias score
        scores = [
            bias_analysis["political_balance"].get("balance_score", 0),
            bias_analysis["cultural_diversity"].get("diversity_score", 0),
            bias_analysis["demographic_representation"].get("balance_score", 0)
        ]
        bias_analysis["overall_bias_score"] = sum(scores) / len(scores)
        
        return bias_analysis
    
    def _calculate_diversity_metrics(self, training_data: List[Dict]) -> Dict[str, Any]:
        """Calculate diversity metrics"""
        diversity_metrics = {
            "type_distribution": {},
            "domain_coverage": {},
            "complexity_distribution": {},
            "approach_variety": {}
        }
        
        # Type distribution
        type_counts = defaultdict(int)
        for example in training_data:
            example_type = example.get("type")
            if example_type:
                type_counts[example_type] += 1
        
        diversity_metrics["type_distribution"] = dict(type_counts)
        
        # Domain coverage
        domain_counts = defaultdict(int)
        for example in training_data:
            domain = example.get("metadata", {}).get("domain")
            if domain:
                domain_counts[domain] += 1
        
        diversity_metrics["domain_coverage"] = dict(domain_counts)
        
        # Complexity distribution
        complexity_counts = defaultdict(int)
        for example in training_data:
            complexity = example.get("metadata", {}).get("complexity")
            if complexity:
                complexity_counts[complexity] += 1
        
        diversity_metrics["complexity_distribution"] = dict(complexity_counts)
        
        # Approach variety
        approach_counts = defaultdict(int)
        for example in training_data:
            approach = example.get("metadata", {}).get("approach_type")
            if approach:
                approach_counts[approach] += 1
        
        diversity_metrics["approach_variety"] = dict(approach_counts)
        
        return diversity_metrics
    
    def _assess_training_readiness(self, training_data: List[Dict]) -> Dict[str, Any]:
        """Assess training readiness"""
        readiness_assessment = {
            "size_adequacy": False,
            "quality_threshold_met": False,
            "bias_threshold_met": False,
            "diversity_threshold_met": False,
            "format_compliance": False,
            "overall_ready": False
        }
        
        # Size adequacy (expecting 36,000 examples)
        readiness_assessment["size_adequacy"] = len(training_data) >= 30000  # Allow some tolerance
        
        # Quality threshold
        quality_metrics = self._validate_quality(training_data)
        readiness_assessment["quality_threshold_met"] = quality_metrics["quality_score"] >= 0.95
        
        # Bias threshold
        bias_analysis = self._analyze_bias_balance(training_data)
        readiness_assessment["bias_threshold_met"] = bias_analysis["overall_bias_score"] >= self.quality_thresholds["bias_balance_threshold"]
        
        # Diversity threshold
        diversity_metrics = self._calculate_diversity_metrics(training_data)
        type_diversity = len(diversity_metrics["type_distribution"]) >= 5  # Expect at least 5 types
        readiness_assessment["diversity_threshold_met"] = type_diversity
        
        # Format compliance
        format_errors = quality_metrics["format_errors"]
        readiness_assessment["format_compliance"] = format_errors == 0
        
        # Overall readiness
        readiness_assessment["overall_ready"] = all([
            readiness_assessment["size_adequacy"],
            readiness_assessment["quality_threshold_met"],
            readiness_assessment["bias_threshold_met"],
            readiness_assessment["diversity_threshold_met"],
            readiness_assessment["format_compliance"]
        ])
        
        return readiness_assessment
    
    def _generate_recommendations(self, validation_results: Dict[str, Any]) -> List[str]:
        """Generate improvement recommendations"""
        recommendations = []
        
        # Quality recommendations
        quality_score = validation_results["quality_checks"]["quality_score"]
        if quality_score < 0.95:
            recommendations.append(f"Improve data quality: current score {quality_score:.3f}, target 0.95+")
        
        # Bias recommendations
        bias_score = validation_results["bias_analysis"]["overall_bias_score"]
        if bias_score < self.quality_thresholds["bias_balance_threshold"]:
            recommendations.append(f"Improve bias balance: current score {bias_score:.3f}, target {self.quality_thresholds['bias_balance_threshold']}+")
        
        # Size recommendations
        total_examples = validation_results["total_examples"]
        if total_examples < 30000:
            recommendations.append(f"Increase dataset size: current {total_examples}, target 30,000+")
        
        # Training readiness
        if not validation_results["training_readiness"]["overall_ready"]:
            recommendations.append("Address training readiness issues before proceeding with model training")
        
        if not recommendations:
            recommendations.append("Dataset meets all quality standards and is ready for training!")
        
        return recommendations

class DatasetCombiner:
    """Combines 7B foundation and 13B enhanced datasets"""
    
    def __init__(self, foundation_path: str = "data/foundation_7b", enhanced_path: str = "data/enhanced_13b", output_path: str = "data/combined"):
        self.foundation_path = Path(foundation_path)
        self.enhanced_path = Path(enhanced_path)
        self.output_path = Path(output_path)
        self.output_path.mkdir(parents=True, exist_ok=True)
        
        self.validator = DatasetValidator()
        
        # Setup logging
        logging.basicConfig(level=logging.INFO)
        self.logger = logging.getLogger(__name__)
    
    def combine_datasets(self) -> Tuple[Dict[str, Any], Dict[str, Any]]:
        """Combine 7B foundation and 13B enhanced datasets"""
        
        self.logger.info("Starting dataset combination process...")
        
        # Load datasets
        foundation_dataset = self._load_dataset(self.foundation_path / "7b_foundation_dataset.json")
        enhanced_dataset = self._load_dataset(self.enhanced_path / "13b_enhanced_dataset.json")
        
        if not foundation_dataset or not enhanced_dataset:
            raise ValueError("Could not load required datasets")
        
        # Combine datasets
        combined_dataset = {
            "metadata": {
                "version": "governance_sentinel_13b_v1.0",
                "created": datetime.now().isoformat(),
                "foundation_version": foundation_dataset["metadata"]["version"],
                "enhanced_version": enhanced_dataset["metadata"]["version"],
                "total_examples": len(foundation_dataset["training_data"]) + len(enhanced_dataset["training_data"]),
                "components": {
                    "7b_foundation": len(foundation_dataset["training_data"]),
                    "13b_enhanced": len(enhanced_dataset["training_data"])
                }
            },
            "training_data": []
        }
        
        # Add foundation data
        for example in foundation_dataset["training_data"]:
            example["metadata"]["source_layer"] = "7b_foundation"
            combined_dataset["training_data"].append(example)
        
        # Add enhanced data
        for example in enhanced_dataset["training_data"]:
            example["metadata"]["source_layer"] = "13b_enhanced"
            combined_dataset["training_data"].append(example)
        
        # Shuffle for training diversity
        random.shuffle(combined_dataset["training_data"])
        
        # Validate combined dataset
        validation_results = self.validator.validate_complete_dataset(combined_dataset)
        
        # Save combined dataset
        output_file = self.output_path / "governance_sentinel_13b_complete.json"
        with open(output_file, 'w') as f:
            json.dump(combined_dataset, f, indent=2)
        
        # Save validation results
        validation_file = self.output_path / "validation_results.json"
        with open(validation_file, 'w') as f:
            json.dump(validation_results, f, indent=2)
        
        self.logger.info(f"Combined dataset saved to {output_file}")
        self.logger.info(f"Validation results saved to {validation_file}")
        self.logger.info(f"Total examples: {len(combined_dataset['training_data'])}")
        
        return combined_dataset, validation_results
    
    def _load_dataset(self, file_path: Path) -> Dict[str, Any]:
        """Load dataset from JSON file"""
        try:
            with open(file_path, 'r') as f:
                return json.load(f)
        except FileNotFoundError:
            self.logger.error(f"Dataset file not found: {file_path}")
            return None
        except json.JSONDecodeError:
            self.logger.error(f"Invalid JSON in dataset file: {file_path}")
            return None
    
    def create_training_splits(self, combined_dataset: Dict[str, Any]) -> Dict[str, Dict[str, Any]]:
        """Create training, validation, and test splits"""
        
        training_data = combined_dataset["training_data"].copy()
        random.shuffle(training_data)
        
        total_size = len(training_data)
        train_size = int(0.8 * total_size)  # 80% training
        val_size = int(0.1 * total_size)    # 10% validation
        # Remaining 10% for test
        
        splits = {
            "train": {
                "metadata": {
                    **combined_dataset["metadata"],
                    "split": "train",
                    "size": train_size
                },
                "training_data": training_data[:train_size]
            },
            "validation": {
                "metadata": {
                    **combined_dataset["metadata"],
                    "split": "validation",
                    "size": val_size
                },
                "training_data": training_data[train_size:train_size + val_size]
            },
            "test": {
                "metadata": {
                    **combined_dataset["metadata"],
                    "split": "test",
                    "size": total_size - train_size - val_size
                },
                "training_data": training_data[train_size + val_size:]
            }
        }
        
        # Save splits
        for split_name, split_data in splits.items():
            split_file = self.output_path / f"governance_sentinel_13b_{split_name}.json"
            with open(split_file, 'w') as f:
                json.dump(split_data, f, indent=2)
            self.logger.info(f"{split_name.title()} split saved to {split_file} ({split_data['metadata']['size']} examples)")
        
        return splits
    
    def generate_dataset_summary(self, combined_dataset: Dict[str, Any], validation_results: Dict[str, Any]) -> str:
        """Generate comprehensive dataset summary"""
        
        summary = f"""
# Governance Sentinel 13B - Complete Dataset Summary

## Overview
- **Total Examples**: {validation_results['total_examples']:,}
- **7B Foundation**: {combined_dataset['metadata']['components']['7b_foundation']:,} examples
- **13B Enhanced**: {combined_dataset['metadata']['components']['13b_enhanced']:,} examples
- **Created**: {combined_dataset['metadata']['created']}

## Quality Metrics
- **Quality Score**: {validation_results['quality_checks']['quality_score']:.3f}
- **Valid Examples**: {validation_results['quality_checks']['valid_examples']:,}
- **Format Errors**: {validation_results['quality_checks']['format_errors']}
- **Duplicate Content**: {validation_results['quality_checks']['duplicate_content']}

## Bias Analysis
- **Overall Bias Score**: {validation_results['bias_analysis']['overall_bias_score']:.3f}
- **Political Balance**: {validation_results['bias_analysis']['political_balance'].get('balance_score', 0):.3f}
- **Cultural Diversity**: {validation_results['bias_analysis']['cultural_diversity'].get('diversity_score', 0):.3f}
- **Demographic Balance**: {validation_results['bias_analysis']['demographic_representation'].get('balance_score', 0):.3f}

## Training Readiness
- **Overall Ready**: {'✅ Yes' if validation_results['training_readiness']['overall_ready'] else '❌ No'}
- **Size Adequate**: {'✅' if validation_results['training_readiness']['size_adequacy'] else '❌'}
- **Quality Threshold**: {'✅' if validation_results['training_readiness']['quality_threshold_met'] else '❌'}
- **Bias Threshold**: {'✅' if validation_results['training_readiness']['bias_threshold_met'] else '❌'}
- **Format Compliance**: {'✅' if validation_results['training_readiness']['format_compliance'] else '❌'}

## Component Distribution
"""
        
        # Add type distribution
        type_dist = validation_results['diversity_metrics']['type_distribution']
        for type_name, count in type_dist.items():
            percentage = (count / validation_results['total_examples']) * 100
            summary += f"- **{type_name.replace('_', ' ').title()}**: {count:,} ({percentage:.1f}%)\n"
        
        summary += "\n## Recommendations\n"
        for rec in validation_results['recommendations']:
            summary += f"- {rec}\n"
        
        return summary

def main():
    """Combine and validate complete 13B training dataset"""
    combiner = DatasetCombiner()
    
    print("🚀 Starting Dataset Combination Process...")
    print("Combining 7B foundation (21,000) + 13B enhanced (15,000) = 36,000 examples")
    
    try:
        # Combine datasets
        combined_dataset, validation_results = combiner.combine_datasets()
        
        # Create training splits
        splits = combiner.create_training_splits(combined_dataset)
        
        # Generate summary
        summary = combiner.generate_dataset_summary(combined_dataset, validation_results)
        
        # Save summary
        summary_file = combiner.output_path / "dataset_summary.md"
        with open(summary_file, 'w') as f:
            f.write(summary)
        
        print(f"✅ Dataset combination complete!")
        print(f"📊 Total examples: {len(combined_dataset['training_data']):,}")
        print(f"📁 Combined dataset: data/combined/governance_sentinel_13b_complete.json")
        print(f"📋 Summary: {summary_file}")
        
        # Print key metrics
        print(f"\n📈 Key Metrics:")
        print(f"  - Quality Score: {validation_results['quality_checks']['quality_score']:.3f}")
        print(f"  - Bias Balance: {validation_results['bias_analysis']['overall_bias_score']:.3f}")
        print(f"  - Training Ready: {'✅ Yes' if validation_results['training_readiness']['overall_ready'] else '❌ No'}")
        
        # Print splits
        print(f"\n📂 Training Splits:")
        for split_name, split_data in splits.items():
            print(f"  - {split_name.title()}: {split_data['metadata']['size']:,} examples")
        
        if validation_results['training_readiness']['overall_ready']:
            print("\n🎯 Dataset is ready for 13B model training!")
        else:
            print("\n⚠️  Dataset needs improvements before training:")
            for rec in validation_results['recommendations']:
                print(f"    - {rec}")
        
    except Exception as e:
        print(f"❌ Error during dataset combination: {e}")
        raise

if __name__ == "__main__":
    main()

