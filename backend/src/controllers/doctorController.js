const ChatHistory = require('../models/ChatHistory');
const SearchHistory = require('../models/SearchHistory');
const Document = require('../models/Document');
const { sendSuccess, sendError } = require('../utils/response');

/**
 * Log a patient record search query (Doctor only action)
 */
const saveSearchQuery = async (req, res) => {
  const { query, resultsCount } = req.body;

  try {
    if (!query) {
      return sendError(res, 'Search query cannot be empty', 400);
    }

    const log = new SearchHistory({
      doctorId: req.user.id,
      query,
      resultsCount: resultsCount || 0
    });

    await log.save();
    return sendSuccess(res, log, 'Search query logged successfully', 201);
  } catch (error) {
    return sendError(res, 'Failed to log search query', 500, error.message);
  }
};

/**
 * Fetch search history for the logged in doctor
 */
const getSearchHistory = async (req, res) => {
  try {
    const history = await SearchHistory.find({ doctorId: req.user.id })
      .sort({ timestamp: -1 })
      .limit(100);
    return sendSuccess(res, history, 'Search history retrieved successfully');
  } catch (error) {
    return sendError(res, 'Failed to retrieve search history', 500, error.message);
  }
};

/**
 * Fetch all chat sessions for the logged in doctor
 */
const getChatSessions = async (req, res) => {
  try {
    const sessions = await ChatHistory.find({ doctorId: req.user.id })
      .select('title timestamp')
      .sort({ timestamp: -1 });
    return sendSuccess(res, sessions, 'Chat sessions retrieved successfully');
  } catch (error) {
    return sendError(res, 'Failed to fetch chat sessions', 500, error.message);
  }
};

/**
 * Create a new chat session thread
 */
const createChatSession = async (req, res) => {
  const { title } = req.body;

  try {
    const session = new ChatHistory({
      doctorId: req.user.id,
      title: title || 'New Consultation Session',
      messages: []
    });

    await session.save();
    return sendSuccess(res, session, 'Chat session created successfully', 201);
  } catch (error) {
    return sendError(res, 'Failed to create chat session', 500, error.message);
  }
};

/**
 * Fetch messages inside a specific chat session
 */
const getChatSessionDetails = async (req, res) => {
  const { id } = req.params;

  try {
    const session = await ChatHistory.findOne({ _id: id, doctorId: req.user.id });
    if (!session) {
      return sendError(res, 'Chat session not found', 404);
    }
    return sendSuccess(res, session, 'Chat session details retrieved successfully');
  } catch (error) {
    return sendError(res, 'Failed to fetch session details', 500, error.message);
  }
};

/**
 * Add a QA dialogue message exchange in a chat session
 */
const addMessageToSession = async (req, res) => {
  const { id } = req.params;
  const { question, answer } = req.body;

  try {
    if (!question || !answer) {
      return sendError(res, 'Question and answer text are required', 400);
    }

    const session = await ChatHistory.findOne({ _id: id, doctorId: req.user.id });
    if (!session) {
      return sendError(res, 'Chat session not found', 404);
    }

    // Append user question and assistant answer
    session.messages.push({ role: 'user', content: question });
    session.messages.push({ role: 'assistant', content: answer });
    
    // Auto update title if it was default
    if (session.title === 'New Consultation Session' && question.length > 5) {
      session.title = question.substring(0, 30) + (question.length > 30 ? '...' : '');
    }

    await session.save();
    return sendSuccess(res, session, 'Messages added to session successfully');
  } catch (error) {
    return sendError(res, 'Failed to append messages', 500, error.message);
  }
};

/**
 * Delete a specific chat session thread
 */
const deleteChatSession = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await ChatHistory.deleteOne({ _id: id, doctorId: req.user.id });
    if (result.deletedCount === 0) {
      return sendError(res, 'Chat session not found to delete', 404);
    }
    return sendSuccess(res, null, 'Chat session deleted successfully');
  } catch (error) {
    return sendError(res, 'Failed to delete chat session', 500, error.message);
  }
};

/**
 * Fetch stats summary for the Doctor dashboard
 */
const getDoctorStats = async (req, res) => {
  try {
    const chatSessionsCount = await ChatHistory.countDocuments({ doctorId: req.user.id });
    const totalSearchesCount = await SearchHistory.countDocuments({ doctorId: req.user.id });
    const totalDocumentsCount = await Document.countDocuments({});

    // Fetch last 5 search queries
    const recentQueries = await SearchHistory.find({ doctorId: req.user.id })
      .sort({ timestamp: -1 })
      .limit(5);

    return sendSuccess(res, {
      sessionsCount: chatSessionsCount,
      searchesCount: totalSearchesCount,
      documentsCount: totalDocumentsCount,
      recentQueries
    }, 'Doctor statistics retrieved successfully');
  } catch (error) {
    return sendError(res, 'Failed to fetch doctor stats', 500, error.message);
  }
};

module.exports = {
  saveSearchQuery,
  getSearchHistory,
  getChatSessions,
  createChatSession,
  getChatSessionDetails,
  addMessageToSession,
  deleteChatSession,
  getDoctorStats
};
