import mongoose from 'mongoose';
// Kolekcija user_progress (Dijagram: Progress data model / MongoDB)
const Progress = new mongoose.Schema({
  userId: { type:String, index:true, required:true },
  courseId: String,
  progressPercentage: { type:Number, default:0 },
  completedLessons: [{ lessonId:String, completedAt:Date }],
  testResults: [{ testId:String, lessonId:String, score:Number, passed:Boolean, submittedAt:Date }],
  recommendedNextLessonId: String,
  enrollmentStatus: String,
  courseTitle: String,
  lastActivityAt: Date
}, { timestamps:true });
Progress.index({ userId:1, courseId:1 }, { unique:false });
export const UserProgress = mongoose.model('UserProgress', Progress);
