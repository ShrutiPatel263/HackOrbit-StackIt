import express from 'express';
import Vote from '../models/Vote.js';
import Question from '../models/Question.js';
import Answer from '../models/Answer.js';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';
import { validateVote } from '../middleware/validation.js';

const router = express.Router();

// Cast vote
router.post('/', protect , validateVote, async (req, res, next) => {
  try {
    const { type, target_type, target_id } = req.body;
    const userId = req.user.id;

    // Verify target exists and get author
    let target;
    if (target_type === 'question') {
      target = await Question.findById(target_id);
    } else {
      target = await Answer.findById(target_id);
    }

    if (!target || target.isDeleted) {
      return res.status(404).json({ error: `${target_type} not found` });
    }

    // Prevent self-voting
    if (target.author.toString() === userId) {
      return res.status(400).json({ error: 'Cannot vote on your own content' });
    }

    // Check for existing vote
    const existingVote = await Vote.findOne({
      user: userId,
      targetId: target_id
    });

    let message = '';
    let reputationChange = 0;

    if (existingVote) {
      if (existingVote.voteType === type) {
        // Remove vote (toggle off)
        await Vote.deleteOne({ _id: existingVote._id });
        
        // Reverse reputation change
        reputationChange = existingVote.voteType === 'up' ? -10 : 2;
        message = 'Vote removed';
      } else {
        // Change vote type
        existingVote.voteType = type;
        await existingVote.save();
        
        // Calculate reputation change (remove old, add new)
        const oldChange = existingVote.voteType === 'up' ? -10 : 2;
        const newChange = type === 'up' ? 10 : -2;
        reputationChange = oldChange + newChange;
        message = 'Vote updated';
      }
    } else {
      // Create new vote
      const newVote = new Vote({
        user: userId,
        targetType: target_type,
        targetId: target_id,
        voteType: type
      });
      await newVote.save();

      reputationChange = type === 'up' ? 10 : -2;
      message = 'Vote cast successfully';
    }

    // Update target owner's reputation
    if (reputationChange !== 0) {
      await User.findByIdAndUpdate(target.author, {
        $inc: { reputation: reputationChange }
      });
    }

    // Calculate new vote score
    const votes = await Vote.find({ targetId: target_id });
    const voteScore = votes.reduce((sum, vote) => 
      sum + (vote.voteType === 'up' ? 1 : -1), 0
    );

    // Update target vote score
    if (target_type === 'question') {
      await Question.findByIdAndUpdate(target_id, { voteScore });
    } else {
      await Answer.findByIdAndUpdate(target_id, { voteScore });
    }

    // Get user's current vote
    const userVote = await Vote.findOne({
      user: userId,
      targetId: target_id
    });

    res.json({
      message,
      voteScore,
      userVote: userVote ? userVote.voteType : null
    });
  } catch (error) {
    next(error);
  }
});

// Get user's vote for a target
router.get('/:targetType/:targetId',protect, async (req, res, next) => {
  try {
    const { targetType, targetId } = req.params;
    const userId = req.user.id;

    if (!['question', 'answer'].includes(targetType)) {
      return res.status(400).json({ error: 'Invalid target type' });
    }

    const vote = await Vote.findOne({
      user: userId,
      targetId: targetId
    });

    res.json({ 
      userVote: vote ? vote.voteType : null 
    });
  } catch (error) {
    next(error);
  }
});

export default router;