import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type NotificationDocument = HydratedDocument<Notification>;

@Schema({ timestamps: true })
export class Notification {
  @Prop({ required: true })
  _id: string;

  @Prop({ required: true, index: true })
  userId: string;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  message: string;

  @Prop({ required: true })
  type: 'signup' | 'login' | 'enrollment' | 'system';

  @Prop({ default: false })
  isRead: boolean;

  @Prop()
  createdAtLabel?: string;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);
