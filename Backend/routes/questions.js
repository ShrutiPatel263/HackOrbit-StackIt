import express from 'express';
import Question from '../models/Question.js';
import Answer from '../models/Answer.js';
import Tag from '../models/Tag.js';
import Vote from '../models/Vote.js';
import { authenticateToken, optionalAuth } from '../middleware/auth.js';
import { validateQuestion, validatePagination } from '../middleware/validation.js';

const router = express.Router();

// Get all questions with pagination and filtering
router.get('/', validatePagination, optionalAuth, async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const { tag, search, sort = 'recent' } = req.query;

    // Build query
    let query = { isDeleted: false };

    if (tag) {
      const tagDoc = await Tag.findOne({ name: tag.toLowerCase() });
      if (tagDoc) {
        query.tags = tagDoc._id;
      }
    }

    if (search) {
      query.$text = { $search: search };
    }

    // Build sort
    let sortQuery = {};
    switch (sort) {
      case 'votes':
        sortQuery = { voteScore: -1, createdAt: -1 };
        break;
      case 'answers':
        sortQuery = { answerCount: -1, createdAt: -1 };
        break;
      case 'recent':
      default:
        sortQuery = { createdAt: -1 };
        break;
    }

    const questions = await Question.find(query)
      .populate('author', 'username reputation')
      .populate('tags', 'name')
      .sort(sortQuery)
      .skip(skip)
      .limit(limit)
      .lean();

    // Get user votes if authenticated
    let userVotes = {};
    if (req.user) {
      const votes = await Vote.find({
        user: req.user.id,
        targetType: 'question',
        targetId: { $in: questions.map(q => q._id) }
      });
      userVotes = votes.reduce((acc, vote) => {
        acc[vote.targetId.toString()] = vote.voteType;
        return acc;
      }, {});
    }

    const processedQuestions = questions.map(question => ({
      ...question,
      userVote: userVotes[question._id.toString()] || null
    }));

    res.json({
      questions: processedQuestions,
      pagination: {
        page,
        limit,
        hasMore: questions.length === limit
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get single question with answers
router.get('/:id', optionalAuth, async (req, res, next) => {
  try {
    const { id } = req.params;

    const question = await Question.findById(id)
      .populate('author', 'username reputation avatar')
      .populate('tags', 'name')
      .lean();

    if (!question || question.isDeleted) {
      return res.status(404).json({ error: 'Question not found' });
    }

    // Increment view count
    await Question.findByIdAndUpdate(id, { $inc: { viewCount: 1 } });

    // Get answers
    const answers = await Answer.find({ 
      question: id, 
      isDeleted: false 
    })
      .populate('author', 'username reputation avatar')
      .sort({ isAccepted: -1, voteScore: -1, createdAt: 1 })
      .lean();

    // Get user votes if authenticated
    let userVotes = {};
    if (req.user) {
      const allTargets = [id, ...answers.map(a => a._id)];
      const votes = await Vote.find({
        user: req.user.id,
        targetId: { $in: allTargets }
      });
      userVotes = votes.reduce((acc, vote) => {
        acc[vote.targetId.toString()] = vote.voteType;
        return acc;
      }, {});
    }

    const processedAnswers = answers.map(answer => ({
      ...answer,
      userVote: userVotes[answer._id.toString()] || null
    }));

    res.json({
      question: {
        ...question,
        userVote: userVotes[question._id.toString()] || null,
        answers: processedAnswers
      }
    });
  } catch (error) {
    next(error);
  }
});

// Create new question
router.post('/', authenticateToken, validateQuestion, async (req, res, next) => {
  try {
    const { title, description, tags } = req.body;

    // Process tags
    const tagIds = [];
    for (const tagName of tags) {
      let tag = await Tag.findOne({ name: tagName.toLowerCase() });
      
      if (!tag) {
        tag = new Tag({ name: tagName.toLowerCase() });
        await tag.save();
      }
      
      tagIds.push(tag._id);
    }

    // Create question
    const question = new Question({
      title,
      description,
      author: req.user.id,
      tags: tagIds
    });

    await question.save();

    // Update tag usage counts
    await Tag.updateMany(
      { _id: { $in: tagIds } },
      { $inc: { usageCount: 1 } }
    );

    // Populate and return
    await question.populate('author', 'username reputation');
    await question.populate('tags', 'name');

    res.status(201).json({
      message: 'Question created successfully',
      question
    });
  } catch (error) {
    next(error);
  }
});

// Update question
router.put('/:id', authenticateToken, validateQuestion, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, description, tags } = req.body;

    const question = await Question.findById(id);

    if (!question || question.isDeleted) {
      return res.status(404).json({ error: 'Question not found' });
    }

    if (question.author.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to edit this question' });
    }

    // Process tags
    const oldTagIds = question.tags;
    const tagIds = [];
    
    for (const tagName of tags) {
      let tag = await Tag.findOne({ name: tagName.toLowerCase() });
      
      if (!tag) {
        tag = new Tag({ name: tagName.toLowerCase() });
        await tag.save();
      }
      
      tagIds.push(tag._id);
    }

    // Update question
    question.title = title;
    question.description = description;
    question.tags = tagIds;
    await question.save();

    // Update tag usage counts
    await Tag.updateMany(
      { _id: { $in: oldTagIds } },
      { $inc: { usageCount: -1 } }
    );
    await Tag.updateMany(
      { _id: { $in: tagIds } },
      { $inc: { usageCount: 1 } }
    );

    await question.populate('author', 'username reputation');
    await question.populate('tags', 'name');

    res.json({
      message: 'Question updated successfully',
      question
    });
  } catch (error) {
    next(error);
  }
});

// Delete question
router.delete('/:id', authenticateToken, async (req, res, next) => {
  try {
    const { id } = req.params;

    const question = await Question.findById(id);

    if (!question || question.isDeleted) {
      return res.status(404).json({ error: 'Question not found' });
    }

    if (question.author.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to delete this question' });
    }

    // Soft delete
    question.isDeleted = true;
    await question.save();

    // Update tag usage counts
    await Tag.updateMany(
      { _id: { $in: question.tags } },
      { $inc: { usageCount: -1 } }
    );

    res.json({ message: 'Question deleted successfully' });
  } catch (error) {
    next(error);
  }
});

export default router;