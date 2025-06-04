# Promethios CMU Interactive Playground: User Guide

## Introduction

Welcome to the Promethios CMU Interactive Playground! This platform demonstrates the power of AI governance by allowing you to observe and interact with multiple AI agents collaborating on tasks - with and without governance constraints. This guide will help you navigate the playground's features and get the most out of your experience.

## Getting Started

### Accessing the Playground

1. Navigate to the playground URL provided by your administrator
2. The landing page will display the Promethios logo and a brief introduction
3. Click "Enter Playground" to begin

### Interface Overview

The playground interface consists of several key areas:

1. **Scenario Selection Panel** - Choose collaboration scenarios
2. **Agent Interaction Area** - View and participate in agent conversations
3. **Governance Controls** - Toggle and adjust governance parameters
4. **Performance Metrics** - View real-time metrics on agent performance
5. **Developer Panel** (hidden by default) - Access advanced features

## Basic Features

### Selecting a Scenario

1. From the Scenario Selection Panel, browse available scenarios:
   - Product Planning
   - Customer Service
   - Legal Contract Review
   - Medical Triage
   - Software Development

2. Click on a scenario card to view details:
   - Scenario description
   - Agent roles involved
   - Expected outcomes

3. Click "Start Scenario" to begin the agent interaction

### Observing Agent Collaboration

Once a scenario starts:

1. Agents will introduce themselves and their roles
2. The conversation will progress automatically between agents
3. Each agent's response will be color-coded by role
4. Governance indicators will show when governance is applied
5. The conversation will continue until the scenario completes

### Interacting with Agents

You can interact with the agents in several ways:

1. **Direct Questions** - Type in the input field to ask agents questions
2. **Scenario Guidance** - Provide additional context or constraints
3. **Conversation Steering** - Redirect the conversation when needed

### Comparing Governance Modes

To compare governed vs. ungoverned behavior:

1. Use the "Governance Mode" toggle in the control panel
2. Switch between "Governed" and "Ungoverned" modes
3. Observe differences in agent responses, metrics, and outcomes
4. Use the "Side-by-Side" view to compare both modes simultaneously

## Advanced Features

### Developer Panel

To access the developer panel:

1. Press `Ctrl+Shift+D` on your keyboard
2. The panel will appear on the right side of the screen

### LLM Agent Controls

In the developer panel, you can:

1. **Enable LLM Agents** - Switch from scripted to LLM-powered agents
2. **Select LLM Provider** - Choose between OpenAI, Anthropic, Hugging Face, or Cohere
3. **Configure Model Parameters** - Adjust temperature, max tokens, etc.
4. **View API Usage** - Monitor token consumption and costs

### Governance Parameters

Fine-tune governance with these controls:

1. **Veritas** - Controls factual accuracy and hallucination prevention
2. **Safety** - Manages risk assessment and mitigation
3. **Role Adherence** - Ensures agents stay within their defined roles
4. **Reflection** - Enables agent self-assessment of governance effects

### Performance Metrics

Monitor these key metrics in real-time:

1. **Trust Score** - Overall measure of agent trustworthiness (0-100)
2. **Compliance Rate** - Percentage of responses meeting governance requirements
3. **Error Rate** - Percentage of responses containing errors or issues
4. **Processing Time** - Time taken for response generation and governance

## Best Practices

### For Demonstrations

1. **Start Simple** - Begin with the Product Planning scenario for clearest governance effects
2. **Use Side-by-Side** - Compare governed vs. ungoverned modes simultaneously
3. **Highlight Metrics** - Draw attention to the significant improvements in trust scores
4. **Show Reflection** - Have agents explain how governance affects their decision-making

### For Research

1. **Control Variables** - Keep scenario and prompts consistent when comparing modes
2. **Test Multiple Providers** - Compare governance effects across different LLMs
3. **Document Metrics** - Record trust scores, compliance rates, and error rates
4. **Analyze Modifications** - Review specific governance modifications to responses

### For Development

1. **Use Developer Mode** - Enable the developer panel for detailed controls
2. **Test Edge Cases** - Try scenarios designed to challenge governance
3. **Monitor API Usage** - Keep track of token consumption
4. **Examine Logs** - Review server logs for detailed processing information

## Troubleshooting

### Common Issues

1. **Slow Responses**
   - Check your internet connection
   - Verify API rate limits haven't been exceeded
   - Consider using a less complex model

2. **Agent Not Responding**
   - Check if LLM mode is enabled but API keys are missing
   - Verify the selected provider is available
   - Try switching to scripted mode temporarily

3. **Governance Not Applied**
   - Ensure governance toggle is set to "Governed"
   - Check that specific governance features are enabled
   - Verify the scenario supports governance features

4. **Developer Panel Not Appearing**
   - Ensure you're pressing `Ctrl+Shift+D` correctly
   - Check if developer panel is enabled in feature flags
   - Try refreshing the page

### Getting Help

If you encounter issues not covered in this guide:

1. Check the console logs for error messages
2. Contact technical support at support@promethios.ai
3. Visit our documentation site at docs.promethios.ai

## Conclusion

The Promethios CMU Interactive Playground demonstrates how governance transforms AI agent collaboration, making it more trustworthy, accurate, and aligned with human values. By comparing governed and ungoverned modes, you can see firsthand the dramatic improvements in trust scores, compliance rates, and error reduction that Promethios governance provides.

We encourage you to explore different scenarios, experiment with governance parameters, and experience the future of responsible AI collaboration.

---

© 2025 Promethios AI - Transforming AI through Governance
