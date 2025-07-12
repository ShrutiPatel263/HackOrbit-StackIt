import express from 'express';
import User from '../models/User.js';
import Question from '../models/Question.js';
import Answer from '../models/Answer.js';
import Tag from '../models/Tag.js';
import Notification from '../models/Notification.js';
import { protect } from '../middleware/auth.js';
import { validatePagination } from '../middleware/validation.js';

const router = express.Router();

// Apply admin middleware to all routes
router.use(protect);

// Get platform statistics
router.get('/stats', async (req, res, next) => {
  try {
    const [
      totalUsers,
      totalQuestions,
      totalAnswers,
      totalTags,
      recentQuestions,
      recentAnswers
    ] = await Promise.all([
      User.countDocuments({ isBanned: false }),
      Question.countDocuments({ isDeleted: false }),
      Answer.countDocuments({ isDeleted: false }),
      Tag.countDocuments(),
      Question.find({ isDeleted: false })
        .populate('author', 'username')
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
      Answer.find({ isDeleted: false })
        .populate('author', 'username')
        .populate('question', 'title')
        .sort({ createdAt: -1 })
        .limit(5)
        .lean()
    ]);

    res.json({
      stats: {
        totalUsers,
        totalQuestions,
        totalAnswers,
        totalTags
      },
      recentActivity: {
        questions: recentQuestions,
        answers: recentAnswers
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get all users with pagination
router.get('/users', validatePagination, async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const { search, role, status } = req.query;

    let query = {};

    if (search) {
      query.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    if (role) {
      query.role = role;
    }

    if (status === 'banned') {
      query.isBanned = true;
    } else if (status === 'active') {
      query.isBanned = false;
    }

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    res.json({
      users,
      pagination: {
        page,
        limit,
        hasMore: users.length === limit
      }
    });
  } catch (error) {
    next(error);
  }
});

// Ban/unban user
router.put('/users/:id/ban', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { banned, reason } = req.body;

    // Prevent banning other admins
    const targetUser = await User.findById(id);
    
    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (targetUser.role === 'admin') {
      return res.status(403).json({ error: 'Cannot ban admin users' });
    }

    const updates = {
      isBanned: banned,
      banReason: banned ? reason : null,
      bannedAt: banned ? new Date() : null
    };

    await User.findByIdAndUpdate(id, updates);

    // Create notification for user
    if (banned) {
      const notification = new Notification({
        recipient: id,
        type: 'system',
        message: `Your account has been banned. Reason: ${reason}`,
        relatedType: 'ban'
      });
      await notification.save();
    }

    res.json({ 
      message: banned ? 'User banned successfully' : 'User unbanned successfully' 
    });
  } catch (error) {
    next(error);
  }
});

// Delete question (admin)
router.delete('/questions/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const question = await Question.findById(id).populate('author', 'username');

    if (!question) {
      return res.status(404).json({ error: 'Question not found' });
    }

    // Soft delete
    question.isDeleted = true;
    await question.save();

    // Notify question owner
    const notification = new Notification({
      recipient: question.author._id,
      type: 'system',
      message: `Your question "${question.title}" was removed by an admin. Reason: ${reason}`,
      relatedType: 'moderation'
    });
    await notification.save();

    res.json({ message: 'Question deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// Delete answer (admin)
router.delete('/answers/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const answer = await Answer.findById(id).populate('author', 'username');

    if (!answer) {
      return res.status(404).json({ error: 'Answer not found' });
    }

    // Soft delete
    answer.isDeleted = true;
    await answer.save();

    // Update question answer count
    await Question.findByIdAndUpdate(answer.question, {
      $inc: { answerCount: -1 }
    });

    // Notify answer owner
    const notification = new Notification({
      recipient: answer.author._id,
      type: 'system',
      message: `Your answer was removed by an admin. Reason: ${reason}`,
      relatedType: 'moderation'
    });
    await notification.save();

    res.json({ message: 'Answer deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// Send platform-wide announcement
router.post('/announcements', async (req, res, next) => {
  try {
    const { message, title } = req.body;

    if (!message || !title) {
      return res.status(400).json({ error: 'Title and message are required' });
    }

    // Get all active users
    const users = await User.find({ isBanned: false }).select('_id');

    // Create notifications for all users
    const notifications = users.map(user => ({
      recipient: user._id,
      type: 'announcement',
      message: `${title}: ${message}`,
      relatedType: 'announcement'
    }));

    await Notification.insertMany(notifications);

    res.json({ 
      message: 'Announcement sent successfully',
      recipientCount: users.length
    });
  } catch (error) {
    next(error);
  }
});

// Get activity reports
router.get('/reports', async (req, res, next) => {
  try {
    const { period = '7d' } = req.query;
    
    let dateFilter;
    switch (period) {
      case '24h':
        dateFilter = new Date(Date.now() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        dateFilter = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        dateFilter = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        dateFilter = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    }

    const [
      newUsers,
      newQuestions,
      newAnswers,
      topUsers
    ] = await Promise.all([
      User.countDocuments({ createdAt: { $gte: dateFilter } }),
      Question.countDocuments({ 
        createdAt: { $gte: dateFilter },
        isDeleted: false 
      }),
      Answer.countDocuments({ 
        createdAt: { $gte: dateFilter },
        isDeleted: false 
      }),
      User.find({ isBanned: false })
        .select('username reputation')
        .sort({ reputation: -1 })
        .limit(10)
        .lean()
    ]);

    res.json({
      period,
      metrics: {
        newUsers,
        newQuestions,
        newAnswers
      },
      topUsers
    });
  } catch (error) {
    next(error);
  }
});

export default router;