import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true })
  _id: string;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email: string;

  @Prop({ trim: true })
  mobileNumber?: string;

  @Prop({ min: 0 })
  age?: number;

  @Prop({ type: [String], default: [] })
  interests?: string[];

  @Prop({ type: [String], default: [] })
  ongoingCourses?: string[];

  @Prop({ trim: true })
  timeNeeded?: string;

  @Prop({ required: true })
  password: string;

  @Prop()
  imageUrl: string;

  @Prop({ default: 'student', enum: ['student', 'teacher', 'admin'] })
  role: string;

  @Prop()
  headline?: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
