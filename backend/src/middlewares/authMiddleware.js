// authMiddleware.js
import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';

export const authorizeManager = async (req, res, next) => {
  const token = req.headers.authorization.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  try {
    const decoded = jwt.verify(token, 'secretkey');
    const user = await User.findById(decoded.userId);
    if (!user || user.role !== 'manager') {
      return res.status(403).json({ message: 'Forbidden' });
    }
    req.user = user;
    next();
  } catch (error) {
    console.error('Authorization error:', error);
    return res.status(401).json({ message: 'Unauthorized' });
  }
};

export const authorizeEmployee = async (req, res, next) => {
  const token = req.headers.authorization.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  try {
    const decoded = jwt.verify(token, 'secretkey');
    const user = await User.findById(decoded.userId);
    if (!user || user.role !== 'employee') {
      return res.status(403).json({ message: 'Forbidden' });
    }
    req.user = user;
    next();
  } catch (error) {
    console.error('Authorization error:', error);
    return res.status(401).json({ message: 'Unauthorized' });
  }
};
