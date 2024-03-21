import mongoose from 'mongoose';

const { Schema } = mongoose;

const ratingSchema = new Schema({
  timesheet: { type: Schema.Types.ObjectId, ref: 'Timesheet', required: true },
  manager: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  rating: { type: Number, required: true, min: 1, max: 5 }
});

const Rating = mongoose.model('Rating', ratingSchema);

export default Rating;
