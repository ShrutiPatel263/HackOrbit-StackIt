import { body, param, query, validationResult } from 'express-validator';

export const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

// Auth validation
export const validateRegister = [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('username').isLength({ min: 3, max: 30 }).withMessage('Username must be 3-30 characters'),
  validateRequest
];

export const validateLogin = [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
  validateRequest
];

// Question validation
export const validateQuestion = [
  body('title').isLength({ min: 10, max: 200 }).withMessage('Title must be 10-200 characters'),
  body('description').isLength({ min: 20 }).withMessage('Description must be at least 20 characters'),
  body('tags').isArray({ min: 1, max: 5 }).withMessage('Must have 1-5 tags'),
  validateRequest
];

// Answer validation
export const validateAnswer = [
  body('content').isLength({ min: 10 }).withMessage('Answer must be at least 10 characters'),
  param('questionId').isUUID().withMessage('Invalid question ID'),
  validateRequest
];

// Vote validation
export const validateVote = [
  body('type').isIn(['up', 'down']).withMessage('Vote type must be up or down'),
  body('target_type').isIn(['question', 'answer']).withMessage('Invalid target type'),
  body('target_id').isUUID().withMessage('Invalid target ID'),
  validateRequest
];

// Pagination validation
export const validatePagination = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be 1-50'),
  validateRequest
];