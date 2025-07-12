import express from 'express';
import Notification from '../models/Notification.js';
import { protect } from '../middleware/auth.js';
import { validatePagination } from '../middleware/validation.js';

const router = express.Router();

// Get user notifications
router.get('/', protect, validatePagination, async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const { unread_only } = req.query;

    if (!req.user) {
      return res.status(401).json({ message: 'User not found' });
    }
    let query = { recipient: req.user.id };
    
    if (unread_only === 'true') {
      query.isRead = false;
    }

    const notifications = await Notification.find(query)
      .populate('sender', 'username avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    res.json({
      notifications,
      pagination: {
        page,
        limit,
        hasMore: notifications.length === limit
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get unread notification count
router.get('/unread-count', protect , async (req, res, next) => {
  try {
    const count = await Notification.countDocuments({
      recipient: req.user.id,
      isRead: false
    });

    res.json({ unreadCount: count });
  } catch (error) {
    next(error);
  }
});

// Mark notification as read
router.put('/:id/read', protect, async (req, res, next) => {
  try {
    const { id } = req.params;

    await Notification.findOneAndUpdate(
      { _id: id, recipient: req.user.id },
      { isRead: true }
    );

    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    next(error);
  }
});

// Mark all notifications as read
router.put('/mark-all-read', protect , async (req, res, next) => {
  try {
    await Notification.updateMany(
      { recipient: req.user.id, isRead: false },
      { isRead: true }
    );

    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    next(error);
  }
});

// Delete notification
router.delete('/:id',protect, async (req, res, next) => {
  try {
    const { id } = req.params;

    await Notification.findOneAndDelete({
      _id: id,
      recipient: req.user.id
    });

    res.json({ message: 'Notification deleted' });
  } catch (error) {
    next(error);
  }
});

export default router;