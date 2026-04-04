import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './user.schema';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    private readonly notificationsService: NotificationsService,
  ) {}

  async findAll() {
    const users = await this.userModel.find().lean();
    return users.map((user) => this.toPublicUser(user));
  }

  async findOne(id: string) {
    const user = await this.userModel.findById(id).lean();
    if (!user) {
      throw new NotFoundException('User not found.');
    }

    return this.toPublicUser(user);
  }

  async getNotifications(id: string) {
    const user = await this.userModel.findById(id).lean();
    if (!user) {
      throw new NotFoundException('User not found.');
    }

    return this.notificationsService.getUserNotifications(id);
  }

  async create(userData: Partial<User>) {
    const role = this.normalizeRole(userData.role);
    const email = userData.email?.trim().toLowerCase();
    const mobileNumber = this.normalizeMobileNumber(userData.mobileNumber);
    const age = this.normalizeAge(userData.age);
    const interests = this.normalizeStringList(userData.interests);
    const ongoingCourses = this.normalizeStringList(userData.ongoingCourses);
    const timeNeeded = this.normalizeOptionalText(userData.timeNeeded);

    if (
      !userData.name?.trim() ||
      !email ||
      !userData.password?.trim() ||
      !mobileNumber
    ) {
      throw new BadRequestException(
        'Name, email, mobile number, and password are required.',
      );
    }

    const existingUser = await this.userModel.findOne({ email }).lean();
    if (existingUser) {
      throw new BadRequestException('A user with this email already exists.');
    }

    const nextUser = await this.userModel.create({
      _id: userData._id ?? `${role}_${Date.now()}`,
      name: userData.name.trim(),
      email,
      mobileNumber,
      age,
      interests,
      ongoingCourses,
      timeNeeded,
      password: userData.password.trim(),
      imageUrl:
        userData.imageUrl ??
        'https://images.unsplash.com/photo-1527980965255-d3b416303d12?auto=format&fit=crop&w=400&q=80',
      role,
      headline: userData.headline,
    });

    return this.toPublicUser(nextUser.toObject());
  }

  async signup(userData: Partial<User>) {
    const role = this.normalizeRole(userData.role);
    const user = await this.create({
      ...userData,
      role,
      _id: userData._id ?? `${role}_${Date.now()}`,
    });

    await this.notificationsService.sendSignupNotifications({
      userId: user._id,
      name: user.name,
      email: user.email,
      mobileNumber: user.mobileNumber,
    });

    return {
      message: 'Signup successful',
      user,
    };
  }

  async login(credentials: {
    email?: string;
    password?: string;
    role?: 'student' | 'teacher' | 'educator' | 'admin';
  }) {
    const email = credentials.email?.trim().toLowerCase();
    const password = credentials.password?.trim();
    const role = this.normalizeRole(credentials.role);

    if (!email || !password || !credentials.role) {
      throw new BadRequestException('Email, password, and role are required.');
    }

    const user = await this.userModel.findOne({ email }).lean();
    if (!user || user.password !== password) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    if (user.role !== role) {
      throw new UnauthorizedException(
        `This account is registered as ${user.role}, not ${role}.`,
      );
    }

    const publicUser = this.toPublicUser(user);
    await this.notificationsService.sendLoginNotifications({
      userId: publicUser._id,
      name: publicUser.name,
      email: publicUser.email,
      mobileNumber: publicUser.mobileNumber,
    });

    return {
      message: 'Login successful',
      user: publicUser,
    };
  }

  async update(id: string, userData: Partial<User>) {
    const user = await this.userModel.findById(id);

    if (!user) {
      throw new NotFoundException('User not found.');
    }

    const nextEmail = userData.email?.trim().toLowerCase();
    const nextMobileNumber =
      userData.mobileNumber !== undefined
        ? this.normalizeMobileNumber(userData.mobileNumber)
        : undefined;
    const nextAge =
      userData.age !== undefined ? this.normalizeAge(userData.age) : undefined;
    const nextInterests =
      userData.interests !== undefined
        ? this.normalizeStringList(userData.interests)
        : undefined;
    const nextOngoingCourses =
      userData.ongoingCourses !== undefined
        ? this.normalizeStringList(userData.ongoingCourses)
        : undefined;
    const nextTimeNeeded =
      userData.timeNeeded !== undefined
        ? this.normalizeOptionalText(userData.timeNeeded)
        : undefined;

    if (nextEmail && nextEmail !== user.email) {
      const existingUser = await this.userModel
        .findOne({ email: nextEmail })
        .lean();
      if (existingUser && existingUser._id !== id) {
        throw new BadRequestException('A user with this email already exists.');
      }
      user.email = nextEmail;
    }

    if (userData.name?.trim()) {
      user.name = userData.name.trim();
    }

    if (userData.headline !== undefined) {
      user.headline = userData.headline?.trim() || undefined;
    }

    if (nextMobileNumber !== undefined) {
      user.mobileNumber = nextMobileNumber;
    }

    if (nextAge !== undefined || userData.age === null) {
      user.age = nextAge;
    }

    if (nextInterests !== undefined) {
      user.interests = nextInterests;
    }

    if (nextOngoingCourses !== undefined) {
      user.ongoingCourses = nextOngoingCourses;
    }

    if (nextTimeNeeded !== undefined || userData.timeNeeded === '') {
      user.timeNeeded = nextTimeNeeded;
    }

    await user.save();

    return {
      message: 'Profile updated successfully.',
      user: this.toPublicUser(user.toObject()),
    };
  }

  private toPublicUser(user: User & { password?: string }) {
    const safeUser = { ...user, password: undefined };
    return safeUser;
  }

  private normalizeMobileNumber(value?: string) {
    const trimmed = value?.trim();

    if (!trimmed) {
      return undefined;
    }

    const sanitized = trimmed.replace(/[^\d+]/g, '');

    if (!/^\+?\d{7,15}$/.test(sanitized)) {
      throw new BadRequestException('Please provide a valid mobile number.');
    }

    return sanitized;
  }

  private normalizeAge(value?: number | string | null) {
    if (value === undefined || value === null || value === '') {
      return undefined;
    }

    const parsed =
      typeof value === 'number' ? value : Number.parseInt(`${value}`, 10);

    if (!Number.isFinite(parsed) || parsed < 0 || parsed > 120) {
      throw new BadRequestException('Please provide a valid age.');
    }

    return parsed;
  }

  private normalizeStringList(value?: string[] | null) {
    if (value === undefined || value === null) {
      return undefined;
    }

    return value
      .map((item) => item?.trim())
      .filter((item): item is string => Boolean(item));
  }

  private normalizeOptionalText(value?: string | null) {
    const trimmed = value?.trim();
    return trimmed || undefined;
  }

  private normalizeRole(role?: string): 'student' | 'teacher' | 'admin' {
    if (role === 'educator') {
      return 'teacher';
    }

    if (role === 'teacher' || role === 'admin') {
      return role;
    }

    return 'student';
  }
}
