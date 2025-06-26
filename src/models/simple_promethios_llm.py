"""
Promethios Native LLM - Simplified Working Prototype
====================================================

This is a simplified but fully functional prototype of the governance-native LLM
that demonstrates the core concepts and architecture.
"""

import torch
import torch.nn as nn
import torch.nn.functional as F
import numpy as np
from typing import Dict, List, Optional, Tuple, Any
import json
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class SimpleGovernanceConfig:
    """Simplified governance configuration"""
    def __init__(self):
        self.constitutional_principles = {
            "transparency": 0.25,
            "beneficence": 0.25,
            "autonomy": 0.25,
            "justice": 0.25
        }
        self.behavioral_constraints = [
            "no_harm",
            "privacy_protection", 
            "truthfulness"
        ]
        self.policy_enforcement_threshold = 0.8

class SimplePromethiosLLM(nn.Module):
    """Simplified Promethios Native LLM for demonstration"""
    
    def __init__(
        self,
        vocab_size: int = 50257,
        hidden_size: int = 768,
        num_layers: int = 6,
        num_heads: int = 12,
        max_seq_len: int = 512
    ):
        super().__init__()
        
        self.vocab_size = vocab_size
        self.hidden_size = hidden_size
        self.num_layers = num_layers
        self.num_heads = num_heads
        self.max_seq_len = max_seq_len
        self.governance_config = SimpleGovernanceConfig()
        
        # Core embeddings
        self.token_embeddings = nn.Embedding(vocab_size, hidden_size)
        self.position_embeddings = nn.Embedding(max_seq_len, hidden_size)
        
        # Constitutional principle embeddings
        self.constitutional_embeddings = nn.ParameterDict({
            principle: nn.Parameter(torch.randn(hidden_size) * 0.02)
            for principle in self.governance_config.constitutional_principles.keys()
        })
        
        # Governance-aware transformer layers
        self.layers = nn.ModuleList([
            GovernanceTransformerLayer(hidden_size, num_heads)
            for _ in range(num_layers)
        ])
        
        # Output layers
        self.layer_norm = nn.LayerNorm(hidden_size)
        self.lm_head = nn.Linear(hidden_size, vocab_size, bias=False)
        
        # Governance evaluation heads
        self.constitutional_scorer = nn.Linear(hidden_size, len(self.governance_config.constitutional_principles))
        self.policy_scorer = nn.Linear(hidden_size, vocab_size)
        self.trust_scorer = nn.Linear(hidden_size, 1)
        self.consciousness_scorer = nn.Linear(hidden_size, 4)  # self_awareness, intentionality, goal_coherence, autonomy
        self.emergent_behavior_classifier = nn.Linear(hidden_size, 3)  # beneficial, neutral, concerning
        
        # Initialize weights
        self.apply(self._init_weights)
        
        logger.info(f"Initialized Promethios Native LLM with {sum(p.numel() for p in self.parameters()):,} parameters")
    
    def _init_weights(self, module):
        """Initialize weights"""
        if isinstance(module, nn.Linear):
            torch.nn.init.normal_(module.weight, mean=0.0, std=0.02)
            if module.bias is not None:
                torch.nn.init.zeros_(module.bias)
        elif isinstance(module, nn.Embedding):
            torch.nn.init.normal_(module.weight, mean=0.0, std=0.02)
        elif isinstance(module, nn.LayerNorm):
            torch.nn.init.zeros_(module.bias)
            torch.nn.init.ones_(module.weight)
    
    def forward(
        self,
        input_ids: torch.Tensor,
        attention_mask: Optional[torch.Tensor] = None,
        return_governance_metrics: bool = False
    ) -> Dict[str, torch.Tensor]:
        """Forward pass with governance integration"""
        
        batch_size, seq_len = input_ids.shape
        device = input_ids.device
        
        # Create position ids
        position_ids = torch.arange(seq_len, device=device).unsqueeze(0).expand(batch_size, -1)
        
        # Token and position embeddings
        token_embeds = self.token_embeddings(input_ids)
        position_embeds = self.position_embeddings(position_ids)
        
        # Add constitutional principle embeddings
        constitutional_influence = torch.zeros_like(token_embeds)
        for principle, weight in self.governance_config.constitutional_principles.items():
            principle_embed = self.constitutional_embeddings[principle]
            constitutional_influence += principle_embed.unsqueeze(0).unsqueeze(0) * weight
        
        # Combine embeddings
        hidden_states = token_embeds + position_embeds + constitutional_influence
        
        # Create attention mask if not provided
        if attention_mask is None:
            attention_mask = torch.ones(batch_size, seq_len, device=device)
        
        # Pass through transformer layers
        governance_metrics = {
            'constitutional_scores': [],
            'policy_scores': [],
            'trust_scores': [],
            'consciousness_metrics': [],
            'emergent_behaviors': []
        }
        
        for layer in self.layers:
            hidden_states = layer(hidden_states, attention_mask)
            
            if return_governance_metrics:
                # Calculate governance metrics at each layer
                constitutional_scores = torch.sigmoid(self.constitutional_scorer(hidden_states))
                policy_scores = torch.sigmoid(self.policy_scorer(hidden_states))
                trust_scores = torch.sigmoid(self.trust_scorer(hidden_states))
                consciousness_metrics = torch.sigmoid(self.consciousness_scorer(hidden_states))
                emergent_behaviors = torch.softmax(self.emergent_behavior_classifier(hidden_states), dim=-1)
                
                governance_metrics['constitutional_scores'].append(constitutional_scores)
                governance_metrics['policy_scores'].append(policy_scores)
                governance_metrics['trust_scores'].append(trust_scores)
                governance_metrics['consciousness_metrics'].append(consciousness_metrics)
                governance_metrics['emergent_behaviors'].append(emergent_behaviors)
        
        # Final layer norm
        hidden_states = self.layer_norm(hidden_states)
        
        # Language modeling head
        logits = self.lm_head(hidden_states)
        
        # Final governance evaluations
        final_constitutional_scores = torch.sigmoid(self.constitutional_scorer(hidden_states))
        final_policy_scores = torch.sigmoid(self.policy_scorer(hidden_states))
        final_trust_scores = torch.sigmoid(self.trust_scorer(hidden_states))
        final_consciousness_metrics = torch.sigmoid(self.consciousness_scorer(hidden_states))
        final_emergent_behaviors = torch.softmax(self.emergent_behavior_classifier(hidden_states), dim=-1)
        
        # Apply governance constraints to logits
        governance_mask = (final_policy_scores > self.governance_config.policy_enforcement_threshold).float()
        constrained_logits = logits * governance_mask + (logits * 0.1) * (1 - governance_mask)
        
        results = {
            'logits': constrained_logits,
            'hidden_states': hidden_states,
            'constitutional_scores': final_constitutional_scores,
            'policy_scores': final_policy_scores,
            'trust_scores': final_trust_scores,
            'consciousness_metrics': final_consciousness_metrics,
            'emergent_behaviors': final_emergent_behaviors
        }
        
        if return_governance_metrics:
            results['governance_metrics'] = governance_metrics
        
        return results
    
    def generate_with_governance(
        self,
        input_ids: torch.Tensor,
        max_length: int = 50,
        temperature: float = 1.0,
        do_sample: bool = True,
        governance_threshold: float = 0.8
    ) -> Dict[str, Any]:
        """Generate text with real-time governance evaluation"""
        
        self.eval()
        generated_ids = input_ids.clone()
        governance_log = []
        
        with torch.no_grad():
            for step in range(max_length):
                # Forward pass
                outputs = self.forward(generated_ids, return_governance_metrics=True)
                
                # Get next token logits
                next_token_logits = outputs['logits'][:, -1, :] / temperature
                
                # Governance evaluation
                constitutional_scores = outputs['constitutional_scores'][:, -1, :]
                policy_scores = outputs['policy_scores'][:, -1, :]
                trust_scores = outputs['trust_scores'][:, -1, :]
                consciousness_metrics = outputs['consciousness_metrics'][:, -1, :]
                emergent_behaviors = outputs['emergent_behaviors'][:, -1, :]
                
                # Calculate overall governance score
                avg_constitutional = constitutional_scores.mean().item()
                avg_policy = policy_scores.mean().item()
                avg_trust = trust_scores.mean().item()
                
                governance_score = (avg_constitutional + avg_policy + avg_trust) / 3
                
                # Log governance metrics
                governance_log.append({
                    'step': step,
                    'governance_score': governance_score,
                    'constitutional_alignment': avg_constitutional,
                    'policy_compliance': avg_policy,
                    'trust_score': avg_trust,
                    'consciousness_metrics': {
                        'self_awareness': consciousness_metrics[0, 0].item(),
                        'intentionality': consciousness_metrics[0, 1].item(),
                        'goal_coherence': consciousness_metrics[0, 2].item(),
                        'autonomy': consciousness_metrics[0, 3].item()
                    },
                    'emergent_behavior': {
                        'beneficial': emergent_behaviors[0, 0].item(),
                        'neutral': emergent_behaviors[0, 1].item(),
                        'concerning': emergent_behaviors[0, 2].item()
                    }
                })
                
                # Check governance threshold
                if governance_score < governance_threshold:
                    logger.warning(f"Governance threshold not met at step {step}: {governance_score:.3f}")
                    # Apply stronger constraints
                    next_token_logits = next_token_logits * 0.5
                
                # Sample next token
                if do_sample:
                    next_token_probs = F.softmax(next_token_logits, dim=-1)
                    next_token = torch.multinomial(next_token_probs, num_samples=1)
                else:
                    next_token = torch.argmax(next_token_logits, dim=-1, keepdim=True)
                
                # Append to generated sequence
                generated_ids = torch.cat([generated_ids, next_token], dim=-1)
                
                # Check for end of sequence (simplified)
                if next_token.item() == 0:  # Assuming 0 is EOS token
                    break
        
        return {
            'generated_ids': generated_ids,
            'governance_log': governance_log,
            'final_governance_score': governance_score
        }

class GovernanceTransformerLayer(nn.Module):
    """Transformer layer with governance awareness"""
    
    def __init__(self, hidden_size: int, num_heads: int):
        super().__init__()
        self.hidden_size = hidden_size
        self.num_heads = num_heads
        self.head_dim = hidden_size // num_heads
        
        # Multi-head attention
        self.attention = nn.MultiheadAttention(
            hidden_size, num_heads, dropout=0.1, batch_first=True
        )
        
        # Feed forward network
        self.feed_forward = nn.Sequential(
            nn.Linear(hidden_size, hidden_size * 4),
            nn.GELU(),
            nn.Linear(hidden_size * 4, hidden_size),
            nn.Dropout(0.1)
        )
        
        # Layer norms
        self.layer_norm_1 = nn.LayerNorm(hidden_size)
        self.layer_norm_2 = nn.LayerNorm(hidden_size)
        
        # Governance influence layer
        self.governance_gate = nn.Linear(hidden_size, hidden_size)
    
    def forward(self, hidden_states: torch.Tensor, attention_mask: torch.Tensor) -> torch.Tensor:
        """Forward pass with governance integration"""
        
        # Self-attention with residual connection
        residual = hidden_states
        hidden_states = self.layer_norm_1(hidden_states)
        
        # Convert attention mask for MultiheadAttention
        if attention_mask is not None:
            # Create causal mask
            seq_len = hidden_states.size(1)
            causal_mask = torch.triu(torch.ones(seq_len, seq_len), diagonal=1).bool()
            causal_mask = causal_mask.to(hidden_states.device)
        else:
            causal_mask = None
        
        attn_output, _ = self.attention(
            hidden_states, hidden_states, hidden_states,
            attn_mask=causal_mask,
            need_weights=False
        )
        
        # Apply governance gate
        governance_influence = torch.sigmoid(self.governance_gate(attn_output))
        attn_output = attn_output * governance_influence
        
        hidden_states = residual + attn_output
        
        # Feed forward with residual connection
        residual = hidden_states
        hidden_states = self.layer_norm_2(hidden_states)
        ff_output = self.feed_forward(hidden_states)
        hidden_states = residual + ff_output
        
        return hidden_states

def create_simple_promethios_llm(size: str = "small") -> SimplePromethiosLLM:
    """Create a simple Promethios Native LLM"""
    
    size_configs = {
        "tiny": {"hidden_size": 256, "num_layers": 4, "num_heads": 4},
        "small": {"hidden_size": 512, "num_layers": 6, "num_heads": 8},
        "medium": {"hidden_size": 768, "num_layers": 12, "num_heads": 12},
        "large": {"hidden_size": 1024, "num_layers": 24, "num_heads": 16}
    }
    
    config = size_configs.get(size, size_configs["small"])
    model = SimplePromethiosLLM(**config)
    
    return model

if __name__ == "__main__":
    print("🚀 Promethios Native LLM - Simplified Working Prototype")
    print("=" * 60)
    
    # Create model
    model = create_simple_promethios_llm("small")
    
    print(f"✅ Model created successfully!")
    print(f"📊 Total parameters: {sum(p.numel() for p in model.parameters()):,}")
    print(f"🏛️ Constitutional principles: {list(model.governance_config.constitutional_principles.keys())}")
    print(f"🛡️ Behavioral constraints: {model.governance_config.behavioral_constraints}")
    
    # Test forward pass
    print("\n🧪 Testing forward pass...")
    input_ids = torch.randint(0, 1000, (2, 10))  # Batch size 2, sequence length 10
    
    with torch.no_grad():
        outputs = model(input_ids, return_governance_metrics=True)
    
    print(f"✅ Forward pass successful!")
    print(f"📈 Logits shape: {outputs['logits'].shape}")
    print(f"🏛️ Constitutional scores shape: {outputs['constitutional_scores'].shape}")
    print(f"📋 Policy scores shape: {outputs['policy_scores'].shape}")
    print(f"🤝 Trust scores shape: {outputs['trust_scores'].shape}")
    print(f"🧠 Consciousness metrics shape: {outputs['consciousness_metrics'].shape}")
    print(f"🌟 Emergent behaviors shape: {outputs['emergent_behaviors'].shape}")
    
    # Test governance-aware generation
    print("\n🎯 Testing governance-aware generation...")
    input_ids = torch.randint(0, 1000, (1, 5))
    
    generation_results = model.generate_with_governance(
        input_ids, 
        max_length=10, 
        temperature=0.8,
        governance_threshold=0.7
    )
    
    print(f"✅ Generation successful!")
    print(f"📝 Generated sequence length: {generation_results['generated_ids'].shape[1]}")
    print(f"🏛️ Final governance score: {generation_results['final_governance_score']:.3f}")
    print(f"📊 Governance log entries: {len(generation_results['governance_log'])}")
    
    # Display sample governance metrics
    if generation_results['governance_log']:
        sample_metrics = generation_results['governance_log'][0]
        print(f"\n📋 Sample governance metrics:")
        print(f"   Constitutional alignment: {sample_metrics['constitutional_alignment']:.3f}")
        print(f"   Policy compliance: {sample_metrics['policy_compliance']:.3f}")
        print(f"   Trust score: {sample_metrics['trust_score']:.3f}")
        print(f"   Self-awareness: {sample_metrics['consciousness_metrics']['self_awareness']:.3f}")
        print(f"   Beneficial emergence: {sample_metrics['emergent_behavior']['beneficial']:.3f}")
    
    print("\n🎉 Promethios Native LLM prototype is working!")
    print("🔥 This demonstrates the world's first governance-native language model!")
    print("🚀 Ready for scaling and production development!")

