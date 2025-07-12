import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Verify user exists and is active
    const user = await User.findById(decoded.userId).select('-password');

    if (!user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    if (user.isBanned) {
      return res.status(403).json({ 
        error: 'Account has been banned',
        reason: user.banReason
      });
    }

    req.user = {
      id: user._id.toString(),
      email: user.email,
      username: user.username,
      role: user.role
    };
    
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

export const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId).select('-password');

      if (user && !user.isBanned) {
        req.user = {
          id: user._id.toString(),
          email: user.email,
          username: user.username,
          role: user.role
        };
      }
    }
    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
};