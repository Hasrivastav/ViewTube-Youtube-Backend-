// routes.js
import express from 'express';
import { register, login } from '../controllers/authController.js';
import { createTimesheet, updateTimesheet } from '../controllers/timeSheetController.js';
import { submitRating } from '../controllers/ratingController.js';
import { authorizeManager, authorizeEmployee } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Authentication routes
router.get('/', (req, res) => {
    res.send('Hello');
  });
router.post('/register', register);
router.post('/login', login);

// Timesheet routes
router.post('/timesheets', authorizeEmployee, createTimesheet);
router.put('/timesheets/:timesheetId', authorizeEmployee, updateTimesheet);

// Rating routes
router.post('/ratings', authorizeManager, submitRating);

export default router;
