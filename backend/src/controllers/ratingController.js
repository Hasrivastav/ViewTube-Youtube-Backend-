// ratingController.js
import Rating from '../models/Rating.js';

export const submitRating = async (req, res) => {
  try {
    const { timesheetId, rating } = req.body;
    const manager = await User.findById(req.userId);
    if (!manager || manager.role !== 'manager') {
      return res.status(403).json({ message: 'Unauthorized. Only managers can submit ratings' });
    }
    const existingRating = await Rating.findOne({ timesheet: timesheetId });
    if (existingRating) {
      return res.status(400).json({ message: 'Rating already submitted for this timesheet' });
    }
    const newRating = new Rating({ timesheet: timesheetId, manager: req.userId, rating });
    await newRating.save();
    res.status(201).json({ message: 'Rating submitted successfully' });
  } catch (error) {
    console.error('Rating submission error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
