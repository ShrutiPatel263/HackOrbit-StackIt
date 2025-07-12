import express from 'express';
import Answer from '../models/Answer.js';
import Question from '../models/Question.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import { authenticateToken } from '../middleware/auth.js';
import { validateAnswer } from '../middleware/validation.js';

const router = express.Router();

// Create answer
router.post('/:questionId', authenticateToken, validateAnswer, async (req, res, next) => {
  try {
    const { questionId } = req.params;
    const { content } = req.body;

    // Verify question exists
    const question = await Question.findById(questionId).populate('author', 'username');

    if (!question || question.isDeleted) {
      return res.status(404).json({ error: 'Question not found' });
    }

    // Create answer
    const answer = new Answer({
      content,
      question: questionId,
      author: req.user.id
    });

    await answer.save();

    // Update question answer count
    await Question.findByIdAndUpdate(questionId, {
      $inc: { answerCount: 1 }
    });

    // Create notification for question owner
    if (question.author._id.toString() !== req.user.id) {
      const notification = new Notification({
        recipient: question.author._id,
        type: 'answer',
        message: `${req.user.username} answered your question: "${question.title}"`,
        relatedId: answer._id,
        relatedType: 'answer',
        sender: req.user.id
      });
      await notification.save();
    }

    await answer.populate('author', 'username reputation avatar');

    res.status(201).json({
      message: 'Answer created successfully',
      answer
    });
  } catch (error) {
    next(error);
  }
});

// Update answer
router.put('/:id', authenticateToken, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { content } = req.body;

    if (!content || content.length < 10) {
      return res.status(400).json({ error: 'Answer content must be at least 10 characters' });
    }

    const answer = await Answer.findById(id);

    if (!answer || answer.isDeleted) {
      return res.status(404).json({ error: 'Answer not found' });
    }

    if (answer.author.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to edit this answer' });
    }

    answer.content = content;
    await answer.save();

    await answer.populate('author', 'username reputation avatar');

    res.json({
      message: 'Answer updated successfully',
      answer
    });
  } catch (error) {
    next(error);
  }
});

// Accept answer
router.post('/:id/accept', authenticateToken, async (req, res, next) => {
  try {
    const { id } = req.params;

    const answer = await Answer.findById(id).populate('question');

    if (!answer || answer.isDeleted) {
      return res.status(404).json({ error: 'Answer not found' });
    }

    const question = await Question.findById(answer.question._id);

    if (question.author.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Only question owner can accept answers' });
    }

    // Unaccept any previously accepted answers
    await Answer.updateMany(
      { question: answer.question._id },
      { isAccepted: false }
    );

    // Accept this answer
    answer.isAccepted = true;
    await answer.save();

    // Update question status
    question.hasAcceptedAnswer = true;
    await question.save();

    // Update reputation for answer author (+15 points)
    await User.findByIdAndUpdate(answer.author, {
      $inc: { reputation: 15 }
    });

    // Create notification for answer author
    if (answer.author.toString() !== req.user.id) {
      const notification = new Notification({
        recipient: answer.author,
        type: 'accept',
        message: 'Your answer was accepted!',
        relatedId: answer._id,
        relatedType: 'answer',
        sender: req.user.id
      });
      await notification.save();
    }

    res.json({ message: 'Answer accepted successfully' });
  } catch (error) {
    next(error);
  }
});

// Delete answer
router.delete('/:id', authenticateToken, async (req, res, next) => {
  try {
    const { id } = req.params;

    const answer = await Answer.findById(id);

    if (!answer || answer.isDeleted) {
      return res.status(404).json({ error: 'Answer not found' });
    }

    if (answer.author.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to delete this answer' });
    }

    // Soft delete
    answer.isDeleted = true;
    await answer.save();

    // Update question answer count
    await Question.findByIdAndUpdate(answer.question, {
      $inc: { answerCount: -1 }
    });

    // Update question accepted answer status if this was the accepted answer
    if (answer.isAccepted) {
      await Question.findByIdAndUpdate(answer.question, {
        hasAcceptedAnswer: false
      });
    }

    res.json({ message: 'Answer deleted successfully' });
  } catch (error) {
    next(error);
  }
});

export default router;