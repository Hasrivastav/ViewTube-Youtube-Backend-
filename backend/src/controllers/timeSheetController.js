// timesheetController.js
import Timesheet from '../models/TimeSheet.js';

export const createTimesheet = async (req, res) => {
  try {
    const { hoursWorked } = req.body;
    const newTimesheet = new Timesheet({ employee: req.userId, hoursWorked });
    await newTimesheet.save();
    res.status(201).json({ message: 'Timesheet created successfully' });
  } catch (error) {
    console.error('Timesheet creation error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateTimesheet = async (req, res) => {
  try {
    const { timesheetId } = req.params;
    const { hoursWorked } = req.body;
    const timesheet = await Timesheet.findById(timesheetId);
    if (!timesheet) {
      return res.status(404).json({ message: 'Timesheet not found' });
    }
    if (timesheet.rating) {
      return res.status(403).json({ message: 'Timesheet has already been rated. Cannot update.' });
    }
    if (timesheet.employee.toString() !== req.userId) {
      return res.status(403).json({ message: 'Unauthorized to update this timesheet' });
    }
    timesheet.hoursWorked = hoursWorked;
    await timesheet.save();
    res.json({ message: 'Timesheet updated successfully' });
  } catch (error) {
    console.error('Timesheet update error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getTimesheets = async (req, res) => {
    try {
      let timesheets;
      if (req.user.role === 'employee') {
        timesheets = await Timesheet.find({ employee: req.user._id });
      } else if (req.user.role === 'manager') {
        timesheets = await Timesheet.find().populate('employee');
      }
      res.json(timesheets);
    } catch (error) {
      console.error('Timesheets retrieval error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  };