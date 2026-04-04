import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type EnrollmentDocument = HydratedDocument<Enrollment>;

@Schema({ timestamps: true })
export class Enrollment {
  @Prop({ required: true })
  _id: string;

  @Prop({ required: true, index: true })
  studentId: string;

  @Prop({ required: true, index: true })
  courseId: string;

  @Prop({ required: true, min: 0, max: 100 })
  progressPercent: number;

  @Prop({ required: true })
  purchaseDate: string;

  @Prop({ required: true })
  lastLesson: string;
}

export const EnrollmentSchema = SchemaFactory.createForClass(Enrollment);
