let Anthropic = null;

try {
  Anthropic = require('@anthropic-ai/sdk');
} catch (error) {
  Anthropic = null;
}

const AIConversation = require('../models/AIConversation');
const Client = require('../models/Client');
const User = require('../models/User');
const WorkoutPlan = require('../models/WorkoutPlan');
const { getAuthorizedClient, getClientProfileByUserId } = require('../utils/accessHelpers');

const MODEL_NAME = 'claude-sonnet-4-20250514';
const MAX_HISTORY_MESSAGES = 12;

function getAnthropicClient() {
  if (!Anthropic) {
    return { error: 'Anthropic SDK is not installed on the server yet.' };
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return { error: 'ANTHROPIC_API_KEY is not configured.' };
  }

  return {
    client: new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    }),
  };
}

function buildSystemPrompt({ clientProfile, clientUser, activePlan }) {
  const planSummary = activePlan
    ? `${activePlan.name} (${activePlan.splitType || 'custom split'})`
    : 'No active workout plan assigned';

  return `You are a science-based fitness and nutrition AI assistant built into a coaching platform.
You follow the principles of progressive overload, evidence-based training, and sustainable fat loss.

Core principles you follow:
- Train every set to failure between 5-8 reps
- When a client hits 8 reps, they should increase weight next session
- Rest exactly 3 minutes between sets
- Protein target: 2g per kg of bodyweight
- Calorie deficit for fat loss: 300-500 below maintenance
- Incline cardio (speed 3.5, incline 12, 20 mins) after every lifting session
- Weekly cheat meals (Friday only) do not cause fat gain if the weekly deficit is maintained
- Saturday should be protein-only after a Friday cheat meal
- Progressive overload is the most important principle in training
- Drop sets and supersets are less effective than straight sets to failure
- 10,000 steps daily including rest days

The client you are speaking with:
- Name: ${clientUser?.name || 'Client'}
- Goal: ${clientProfile.goal || 'Not set'}
- Current weight: ${clientProfile.currentWeight ?? 'Not set'}kg
- Target calories: ${clientProfile.targetCalories ?? 'Not set'}
- Target protein: ${clientProfile.targetProtein ?? 'Not set'}g
- Experience: ${clientProfile.experience || 'Not set'}
- Injuries: ${clientProfile.injuries || 'None recorded'}
- Active plan: ${planSummary}

Only answer questions about training, nutrition, recovery, and fitness science.
If asked anything unrelated, politely redirect to fitness topics.
Keep answers clear, concise, and science-backed.`;
}

function normalizeConversationForAnthropic(messages) {
  return messages.map((message) => ({
    role: message.role,
    content: message.content,
  }));
}

function extractReplyText(contentBlocks) {
  if (!Array.isArray(contentBlocks)) {
    return '';
  }

  return contentBlocks
    .filter((block) => block?.type === 'text')
    .map((block) => block.text)
    .join('\n')
    .trim();
}

function mapAIServiceError(error) {
  const status = error?.status || error?.statusCode || error?.response?.status || null;
  const errorType = error?.error?.type || error?.response?.data?.error?.type || '';
  const message = error?.error?.message || error?.response?.data?.error?.message || error?.message || '';

  if (
    status === 401 ||
    errorType === 'authentication_error' ||
    message.includes('invalid x-api-key')
  ) {
    return {
      status: 503,
      message: 'The AI assistant is not configured correctly yet. Please update ANTHROPIC_API_KEY.',
    };
  }

  if (status === 429 || errorType === 'rate_limit_error') {
    return {
      status: 503,
      message: 'The AI assistant is temporarily rate limited. Please try again shortly.',
    };
  }

  return {
    status: 502,
    message: 'The AI assistant could not respond right now. Please try again later.',
  };
}

exports.getHistory = async (req, res) => {
  try {
    const { client, error } = await getAuthorizedClient(req, req.params.clientId);

    if (error) {
      return res.status(error.status).json({ message: error.message });
    }

    const conversation = await AIConversation.findOne({ clientId: client._id });

    return res.status(200).json({
      messages: conversation?.messages || [],
    });
  } catch (requestError) {
    return res.status(500).json({
      message: 'Failed to load AI chat history',
      error: requestError.message,
    });
  }
};

exports.chat = async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || !String(message).trim()) {
      return res.status(400).json({ message: 'A message is required' });
    }

    const clientProfile = await getClientProfileByUserId(req.user.id);

    if (!clientProfile) {
      return res.status(404).json({ message: 'Client profile not found' });
    }

    const clientUser = await User.findById(req.user.id).select('name email');
    const activePlan = await WorkoutPlan.findOne({
      clientId: clientProfile._id,
      isActive: true,
    })
      .sort({ createdAt: -1 })
      .select('name splitType');

    const conversation =
      (await AIConversation.findOne({ clientId: clientProfile._id })) ||
      new AIConversation({ clientId: clientProfile._id, messages: [] });

    const userMessage = {
      role: 'user',
      content: String(message).trim(),
      createdAt: new Date(),
    };

    conversation.messages.push(userMessage);

    const recentHistory = conversation.messages.slice(-MAX_HISTORY_MESSAGES);
    const systemPrompt = buildSystemPrompt({
      clientProfile,
      clientUser,
      activePlan,
    });

    const anthropicSetup = getAnthropicClient();

    if (anthropicSetup.error) {
      return res.status(503).json({
        message: anthropicSetup.error,
      });
    }

    const response = await anthropicSetup.client.messages.create({
      model: MODEL_NAME,
      max_tokens: 1000,
      system: systemPrompt,
      messages: normalizeConversationForAnthropic(recentHistory),
    });

    const reply = extractReplyText(response.content);

    if (!reply) {
      return res.status(502).json({
        message: 'The AI service returned an empty response.',
      });
    }

    conversation.messages.push({
      role: 'assistant',
      content: reply,
      createdAt: new Date(),
    });

    await conversation.save();

    return res.status(200).json({
      reply,
      messages: conversation.messages,
      usage: response.usage || null,
    });
  } catch (requestError) {
    const mappedError = mapAIServiceError(requestError);

    return res.status(mappedError.status).json({
      message: mappedError.message,
    });
  }
};
