import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type CourseDocument = HydratedDocument<Course>;

@Schema({ _id: false })
export class CourseRating {
  @Prop({ required: true })
  _id: string;

  @Prop({ required: true })
  userId: string;

  @Prop({ required: true })
  rating: number;
}

const CourseRatingSchema = SchemaFactory.createForClass(CourseRating);

@Schema({ _id: false })
export class Lecture {
  @Prop({ required: true })
  lectureId: string;

  @Prop({ required: true })
  lectureTitle: string;

  @Prop({ required: true })
  lectureDuration: number;

  @Prop({ required: true })
  lectureUrl: string;

  @Prop({ required: true })
  isPreviewFree: boolean;

  @Prop({ required: true })
  lectureOrder: number;
}

const LectureSchema = SchemaFactory.createForClass(Lecture);

@Schema({ _id: false })
export class Chapter {
  @Prop({ required: true })
  chapterId: string;

  @Prop({ required: true })
  chapterOrder: number;

  @Prop({ required: true })
  chapterTitle: string;

  @Prop({ type: [LectureSchema], default: [] })
  chapterContent: Lecture[];
}

const ChapterSchema = SchemaFactory.createForClass(Chapter);

@Schema({ _id: false })
export class QuizQuestion {
  @Prop({ required: true })
  questionId: string;

  @Prop({ required: true })
  question: string;

  @Prop({ type: [String], default: [] })
  options: string[];

  @Prop({ required: true })
  correctOptionIndex: number;
}

const QuizQuestionSchema = SchemaFactory.createForClass(QuizQuestion);

@Schema({ _id: false })
export class Quiz {
  @Prop({ required: true })
  quizId: string;

  @Prop({ required: true })
  title: string;

  @Prop()
  description?: string;

  @Prop({ type: [QuizQuestionSchema], default: [] })
  questions: QuizQuestion[];
}

const QuizSchema = SchemaFactory.createForClass(Quiz);

@Schema({ timestamps: true })
export class Course {
  @Prop({ required: true })
  _id: string;

  @Prop({ required: true })
  category: string;

  @Prop({ required: true })
  level: string;

  @Prop({ required: true })
  courseTitle: string;

  @Prop({ required: true })
  shortDescription: string;

  @Prop({ required: true })
  courseDescription: string;

  @Prop({ required: true })
  coursePrice: number;

  @Prop({ default: false })
  isPublished: boolean;

  @Prop({ default: 0 })
  discount: number;

  @Prop({ type: [ChapterSchema], default: [] })
  courseContent: Chapter[];

  @Prop({ type: [QuizSchema], default: [] })
  quizzes: Quiz[];

  @Prop()
  courseThumbnailKey: string;

  @Prop({ required: true })
  educatorId: string;

  @Prop({ required: true })
  educatorName: string;

  @Prop({ type: [String], default: [] })
  enrolledStudents: string[];

  @Prop({ type: [CourseRatingSchema], default: [] })
  courseRatings: CourseRating[];

  @Prop()
  durationLabel: string;

  @Prop({ default: 0 })
  lessonsCount: number;

  @Prop()
  courseThumbnail: string;
}

export const CourseSchema = SchemaFactory.createForClass(Course);
