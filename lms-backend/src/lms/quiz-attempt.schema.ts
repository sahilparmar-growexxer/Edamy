import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type QuizAttemptDocument = HydratedDocument<QuizAttempt>;

@Schema({ _id: false })
export class QuizQuestionResult {
  @Prop({ required: true })
  questionId: string;

  @Prop({ required: true })
  selectedIndex: number;

  @Prop({ required: true })
  correctIndex: number;

  @Prop({ required: true })
  isCorrect: boolean;
}

const QuizQuestionResultSchema =
  SchemaFactory.createForClass(QuizQuestionResult);

@Schema({ timestamps: true })
export class QuizAttempt {
  @Prop({ required: true })
  _id: string;

  @Prop({ required: true })
  courseId: string;

  @Prop({ required: true })
  quizId: string;

  @Prop({ required: true })
  studentId: string;

  @Prop({ type: [QuizQuestionResultSchema], default: [] })
  answers: QuizQuestionResult[];

  @Prop({ required: true })
  score: number;

  @Prop({ required: true })
  total: number;

  @Prop({ required: true })
  submittedAt: string;
}

export const QuizAttemptSchema = SchemaFactory.createForClass(QuizAttempt);
