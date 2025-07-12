import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { validateRegister, validateLogin } from '../middleware/validation.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Register
router.post('/register', validateRegister, async (req, res, next) => {
  try {
    const { email, password, username } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      return res.status(409).json({ 
        error: existingUser.email === email ? 'Email already exists' : 'Username already exists'
      });
    }

    // Create user
    const user = new User({
      email,
      username,
      password
    });

    await user.save();

    // Generate JWT
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.status(201).json({
      message: 'User registered successfully',
      user,
      token
    });
  } catch (error) {
    next(error);
  }
});

// Login
router.post('/login', validateLogin, async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (user.isBanned) {
      return res.status(403).json({ 
        error: 'Account has been banned',
        reason: user.banReason
      });
    }

    // Verify password
    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    // Remove password from response
    user.password = undefined;

    res.json({
      message: 'Login successful',
      user,
      token
    });
  } catch (error) {
    next(error);
  }
});

// Get current user
router.get('/me', protect , async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    next(error);
  }
});

// Refresh token
router.post('/refresh', protect, async (req, res, next) => {
  try {
    const token = jwt.sign(
      { userId: req.user.id, email: req.user.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.json({ token });
  } catch (error) {
    next(error);
  }
});

// Update profile
router.put('/profile',protect, async (req, res, next) => {
  try {
    const { username, bio, avatar } = req.body;
    const updates = {};

    if (username) {
      // Check if username is already taken
      const existingUser = await User.findOne({ 
        username, 
        _id: { $ne: req.user.id } 
      });
      
      if (existingUser) {
        return res.status(409).json({ error: 'Username already taken' });
      }
      updates.username = username;
    }

    if (bio !== undefined) updates.bio = bio;
    if (avatar !== undefined) updates.avatar = avatar;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      updates,
      { new: true, runValidators: true }
    );

    res.json({
      message: 'Profile updated successfully',
      user
    });
  } catch (error) {
    next(error);
  }
});

export default router;