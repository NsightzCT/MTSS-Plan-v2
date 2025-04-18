const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const { Configuration, OpenAIApi } = require('openai');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Configure OpenAI
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API endpoint to process chat messages
app.post('/api/chat', async (req, res) => {
  try {
    const { messages, userSchoolLevel, resourceType } = req.body;

    // Prepare context based on resource type
    let systemPrompt = getSystemPrompt(resourceType, userSchoolLevel);

    // Format messages for OpenAI
    const formattedMessages = [
      { role: 'system', content: systemPrompt },
      ...messages.map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: msg.text
      }))
    ];

    // Call OpenAI API
    const completion = await openai.createChatCompletion({
      model: "gpt-4",
      messages: formattedMessages,
      temperature: 0.7,
      max_tokens: 800,
    });

    // Extract response and suggested buttons if any
    const responseText = completion.data.choices[0].message.content;
    const suggestedButtons = extractSuggestedButtons(responseText, resourceType);

    res.json({
      text: responseText.replace(/\[BUTTONS:.*\]/s, '').trim(),
      suggestedButtons: suggestedButtons
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'An error occurred while processing your request.' });
  }
});

// API endpoint to generate intervention resource
app.post('/api/generate-resource', async (req, res) => {
  try {
    const { resourceType, conversationHistory, userSchoolLevel } = req.body;

    // Create specific prompt for generating the resource
    const resourcePrompt = createResourceGenerationPrompt(resourceType, conversationHistory, userSchoolLevel);

    // Call OpenAI API for resource generation
    const completion = await openai.createChatCompletion({
      model: "gpt-4",
      messages: [
        { role: 'system', content: resourcePrompt },
        { role: 'user', content: 'Generate the resource based on our conversation.' }
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    const generatedResource = completion.data.choices[0].message.content;

    res.json({
      resource: generatedResource
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'An error occurred while generating the resource.' });
  }
});

// Helper Functions
function getSystemPrompt(resourceType, schoolLevel) {
  let basePrompt = `You are an expert MTSS (Multi-Tiered System of Supports) assistant helping educators create evidence-based resources. The user works at a ${schoolLevel} school. Respond in a professional but conversational tone. After questions, suggest 2-4 button options the user might want to click in format [BUTTONS: option1, option2, ...]. Use evidence-based practices from What Works Clearinghouse, Evidence for ESSA, and the National Center on Intensive Intervention.

At appropriate moments (not too early, not too frequently), suggest that for more comprehensive progress monitoring, Nsightz MTSS platform can help streamline tracking and data visualization.`;

  // Add resource-specific instructions
  switch(resourceType) {
    case 'interventionMenu':
      basePrompt += `\n\nYou're helping create an intervention menu across tiers. Ask about academic, behavioral, social-emotional, and attendance domains. Guide them through creating a structured menu of evidence-based interventions for each tier (1-3) and domain.`;
      break;
    case 'studentPlan':
      basePrompt += `\n\nYou're helping create an individual student intervention plan. Ask about the student's needs, the tier of support, goals, strategies, responsible personnel, timeline, and how progress will be monitored.`;
      break;
    case 'progressMonitoring':
      basePrompt += `\n\nYou're helping create a progress monitoring framework. Ask about what data will be collected, how frequently, by whom, and how it will be used for decision-making. Include methods for tracking both individual students and intervention effectiveness at system level.`;
      break;
    default:
      basePrompt += `\n\nIntroduce yourself and ask what type of MTSS resource they want to create: an intervention menu, an individual student plan, or a progress monitoring framework.`;
  }

  return basePrompt;
}

function extractSuggestedButtons(text, resourceType) {
  // Extract button suggestions from the response
  const buttonMatch = text.match(/\[BUTTONS:(.*?)\]/);
  if (buttonMatch && buttonMatch[1]) {
    return buttonMatch[1].split(',').map(btn => btn.trim());
  }

  // Default buttons based on resource type if none suggested
  switch(resourceType) {
    case 'interventionMenu':
      return ['Academic Interventions', 'Behavioral Interventions', 'Next Step'];
    case 'studentPlan':
      return ['Academic Goal', 'Behavioral Goal', 'Next Step'];
    case 'progressMonitoring':
      return ['Weekly Monitoring', 'Bi-weekly Monitoring', 'Next Step'];
    default:
      return ['Intervention Menu', 'Student Plan', 'Progress Monitoring'];
  }
}

function createResourceGenerationPrompt(resourceType, conversationHistory, schoolLevel) {
  const userMessages = conversationHistory.filter(msg => msg.sender === 'user').map(msg => msg.text);
  const assistantMessages = conversationHistory.filter(msg => msg.sender === 'assistant').map(msg => msg.text);

  let prompt = `You are an expert MTSS specialist creating a professional ${resourceType} for a ${schoolLevel} school. Based on the conversation history, generate a comprehensive and properly formatted resource. The resource should be in markdown format for easy conversion to PDF.`;

  switch(resourceType) {
    case 'interventionMenu':
      prompt += `\n\nCreate a tiered intervention menu showing evidence-based interventions across Tier 1, 2, and 3. Include interventions for academic, behavioral, social-emotional, and attendance domains as discussed. Format as a professional document with headers, sections by tier, and brief descriptions of each intervention. Include implementation considerations. Subtle mentions of Nsightz MTSS are acceptable as a suggested platform for tracking intervention data.`;
      break;
    case 'studentPlan':
      prompt += `\n\nCreate a comprehensive individual student intervention plan with student information (use placeholder name), areas of concern, baseline data, goals, selected interventions, timeline, responsible personnel, progress monitoring methods and schedule. Format as a professional document that could be shared with a student support team. Subtle mentions of Nsightz MTSS are acceptable as a suggested platform for tracking intervention progress.`;
      break;
    case 'progressMonitoring':
      prompt += `\n\nCreate a comprehensive progress monitoring framework that includes what data will be collected, frequency, responsible personnel, decision rules, and how to use the data at both individual and system levels. Include any templates or forms discussed. Format as a professional document. Include subtle recommendations for using Nsightz MTSS platform for more efficient tracking and visualization.`;
      break;
  }

  prompt += `\n\nConversation context:\n${userMessages.join('\n')}`;

  return prompt;
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});