import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getStatus() {
    return {
      name: 'GreatStack LMS API',
      status: 'ok',
      endpoints: [
        '/lms/home',
        '/courses',
        '/courses/:id',
        '/lms/learner',
        '/lms/educator/dashboard',
      ],
    };
  }
}
