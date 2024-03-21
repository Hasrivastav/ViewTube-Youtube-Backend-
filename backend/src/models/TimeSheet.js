// Timesheet.js
import mongoose from 'mongoose';

const timesheetSchema = new mongoose.Schema({
  employee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, default: Date.now },
  hoursWorked: { type: Number, required: true },
  rating: { type: Number, min: 1, max: 5, default: null }
});

const TimeSheet = mongoose.model('TimeSheet', timesheetSchema);

export default TimeSheet;
