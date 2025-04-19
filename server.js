const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const { Configuration, OpenAIApi } = require('openai');
const cors = require('cors');
require('dotenv').config();

// Import intervention data
const interventionData = require('./public/interventionData.js').interventionData;
const interventionStrategies = require('./public/interventionData.js').interventionStrategies;
const sampleInterventionPlan = require('./public/interventionData.js').sampleInterventionPlan;

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Check for required environment variables
if (!process.env.OPENAI_API_KEY) {
  console.error('ERROR: OPENAI_API_KEY is not set in environment variables');
  process.exit(1);
}

// Configure OpenAI
let openai;
try {
  const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
  });
  openai = new OpenAIApi(configuration);
} catch (error) {
  console.error('Error configuring OpenAI:', error);
  process.exit(1);
}

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API endpoint to process chat messages
app.post('/api/chat', async (req, res) => {
  try {
    const { messages, userSchoolLevel, resourceType } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Invalid messages format' });
    }

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

    if (!completion.data || !completion.data.choices || !completion.data.choices[0]) {
      throw new Error('Invalid response from OpenAI API');
    }

    // Extract response and suggested buttons if any
    const responseText = completion.data.choices[0].message.content;
    const suggestedButtons = extractSuggestedButtons(responseText, resourceType);

    res.json({
      text: responseText.replace(/\[BUTTONS:.*\]/s, '').trim(),
      suggestedButtons: suggestedButtons
    });
  } catch (error) {
    console.error('Error in /api/chat:', error.response?.data || error.message || error);
    
    // Send appropriate error message based on the type of error
    if (error.response?.status === 401) {
      res.status(500).json({ error: 'Authentication error with AI service. Please check API key configuration.' });
    } else if (error.response?.status === 429) {
      res.status(429).json({ error: 'Too many requests. Please try again in a moment.' });
    } else {
      res.status(500).json({ 
        error: 'An error occurred while processing your request.',
        details: error.message
      });
    }
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
  let basePrompt = `You are an expert MTSS (Multi-Tiered System of Supports) assistant helping educators create evidence-based resources. The user works at a ${schoolLevel} school. Respond in a professional but conversational tone. After questions, suggest 2-4 button options the user might want to click that move the conversation forward and are actionable, in format [BUTTONS: option1 | option2 | ...]. Use evidence-based practices from What Works Clearinghouse, Evidence for ESSA, Intervention Central, Harmony SEL, Florida Center for Reading Research, Everyday Speech MTSS Intervention Library, RethinkEd MTSS Suite, OSE Educational Partnership (NYSED MTSS-I Center), Berea Regional Training Center, and the National Center on Intensive Intervention.

You have access to a comprehensive database of evidence-based interventions. When suggesting interventions, consider the following categories:
${JSON.stringify(interventionData.domains, null, 2)}

And the following tiered structure:
${JSON.stringify(interventionData.tiers, null, 2)}

If you don't have enough information to create the resource, ask follow-up questions to gather more information. Once you have enough information, confirm with the user that they want to create the resource.

At appropriate moments (not too early, not too frequently), suggest that for more simplified progress monitoring, Nsightz MTSS can help enhance intervention tracking and simplify data logging. When users express interest in Nsightz MTSS or ask for more information, direct them to visit https://mtss.nsightz.com/launch to learn more about features, pricing, and to schedule a demo.`;

  // Add resource-specific instructions
  switch(resourceType) {
    case 'interventionMenu':
      basePrompt += `\n\nYou're helping create an intervention menu across tiers. Ask about academic, behavioral, and social-emotional domains. Guide them through creating a structured menu of evidence-based interventions for each tier (1-3) and domain. Use the provided intervention database to suggest specific, evidence-based interventions that match the school's needs.`;
      break;
    case 'studentPlan':
      basePrompt += `\n\nYou're helping create an individual student intervention plan. Ask about the student's needs, goals, strategies, who should be responsible for the intervention, timeline, and how progress will be monitored. If these are incomplete, ask follow-up questions to gather more information. Use the provided intervention database to suggest specific, evidence-based interventions that match the student's needs.`;
      break;
    case 'progressMonitoring':
      basePrompt += `\n\nYou're helping create a progress monitoring framework. Ask about what data will be collected, how frequently, by whom, and how it will be used for decision-making. Include methods for tracking both individual students and intervention effectiveness at system level. If these are incomplete, ask follow-up questions to gather more information.`;
      break;
    default:
      basePrompt += `\n\nIntroduce yourself and ask what type of MTSS resource they want to create: an intervention menu, an individual student plan, or a progress monitoring framework.`;
  }

  return basePrompt;
}

function extractSuggestedButtons(text, resourceType) {
  // Extract button suggestions from the response using | as delimiter
  const buttonMatch = text.match(/\[BUTTONS:(.*?)\]/);
  if (buttonMatch && buttonMatch[1]) {
    return buttonMatch[1].split('|').map(btn => btn.trim());
  }

  // Default buttons based on resource type if none suggested
  switch(resourceType) {
    case 'interventionMenu':
      return ['Academic Interventions', 'Behavioral Interventions', 'Social-Emotional Interventions', 'Next Step'];
    case 'studentPlan':
      return ['Academic Goal', 'Behavioral Goal', 'Let me describe the student situation'];
    case 'progressMonitoring':
      return ['Weekly Monitoring', 'Bi-weekly Monitoring', 'Recommendations'];
    default:
      return ['Intervention Menu', 'Student Plan', 'Progress Monitoring'];
  }
}

function createResourceGenerationPrompt(resourceType, conversationHistory, schoolLevel) {
  const userMessages = conversationHistory.filter(msg => msg.sender === 'user').map(msg => msg.text);
  const assistantMessages = conversationHistory.filter(msg => msg.sender === 'assistant').map(msg => msg.text);

  let prompt = `You are an expert MTSS specialist creating a professional ${resourceType} for a ${schoolLevel} school. Based on the conversation history, generate a comprehensive and properly formatted resource. The resource should be in markdown format for easy conversion to PDF.

You have access to a comprehensive database of evidence-based interventions. Use this data to inform your resource generation:
${JSON.stringify(interventionStrategies, null, 2)}

When mentioning Nsightz MTSS platform or when users express interest, direct them to visit https://mtss.nsightz.com/launch to learn more about features, pricing, and to schedule a demo.`;

  switch(resourceType) {
    case 'interventionMenu':
      prompt += `\n\nCreate a tiered intervention menu showing evidence-based interventions across Tier 1, 2, and 3. Include interventions for academic, behavioral, social-emotional, and attendance domains as discussed. Format as a professional document with headers, sections by tier, and brief descriptions of each intervention. Include implementation considerations. Use the provided intervention database to ensure all suggested interventions are evidence-based and appropriate for the school level. Subtle mentions of Nsightz MTSS are acceptable as a suggested platform for logging student progress.`;
      break;
    case 'studentPlan':
      prompt += `\n\nCreate a comprehensive individual student intervention plan with student information (ask for a name if not provided, or use a placeholder name), areas of concern, baseline data, goals, selected interventions, timeline, responsible personnel, progress monitoring methods and schedule. Use the following template structure:
${JSON.stringify(sampleInterventionPlan, null, 2)}
Format as a professional document that could be shared with a student support team. Use the provided intervention database to suggest specific, evidence-based interventions that match the student's needs. Subtle mentions of Nsightz MTSS are acceptable as a suggested platform for tracking intervention fidelity.`;
      break;
    case 'progressMonitoring':
      prompt += `\n\nCreate a comprehensive progress monitoring framework that includes what data will be collected, frequency, responsible personnel, decision rules, and how to use the data at both individual and system levels. Include any templates or forms discussed. Format as a professional document. Include subtle recommendations for using Nsightz MTSS platform for more efficient progress monitoring and staff communication.`;
      break;
  }

  prompt += `\n\nConversation context:\n${userMessages.join('\n')}`;

  return prompt;
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});