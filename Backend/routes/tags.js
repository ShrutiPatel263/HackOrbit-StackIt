import express from 'express';
import Tag from '../models/Tag.js';
import { validatePagination } from '../middleware/validation.js';

const router = express.Router();

// Get all tags with usage count
router.get('/', validatePagination, async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;
    const { search } = req.query;

    let query = {};
    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    const tags = await Tag.find(query)
      .sort({ name: 1 })
      .skip(skip)
      .limit(limit)
      .lean();

    res.json({
      tags,
      pagination: {
        page,
        limit,
        hasMore: tags.length === limit
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get popular tags
router.get('/popular', async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 20;

    const tags = await Tag.find({ usageCount: { $gt: 0 } })
      .sort({ usageCount: -1 })
      .limit(limit)
      .lean();

    res.json({ tags });
  } catch (error) {
    next(error);
  }
});

// Get tag suggestions for autocomplete
router.get('/suggestions', async (req, res, next) => {
  try {
    const { q } = req.query;
    
    if (!q || q.length < 2) {
      return res.json({ suggestions: [] });
    }

    const tags = await Tag.find({
      name: { $regex: q, $options: 'i' }
    })
      .select('name')
      .sort({ usageCount: -1, name: 1 })
      .limit(10)
      .lean();

    res.json({ 
      suggestions: tags.map(tag => tag.name) 
    });
  } catch (error) {
    next(error);
  }
});

export default router;