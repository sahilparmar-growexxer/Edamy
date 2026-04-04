import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CoursesModule } from './courses/courses.module';
import { UsersModule } from './users/users.module';
import { LmsModule } from './lms/lms.module';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri:
          configService.get<string>('MONGODB_URI') ??
          configService.get<string>('MONGODB_API_KEY') ??
          '',
        dbName: configService.get<string>('MONGODB_DB_NAME') ?? 'lms',
      }),
    }),
    CoursesModule,
    UsersModule,
    LmsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
