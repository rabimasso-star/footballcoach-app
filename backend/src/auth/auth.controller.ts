import {
  Body,
  Controller,
  Post,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";
import { PrismaService } from "./prisma.service";

@Controller("auth")
export class AuthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  @Post("seed-demo")
  async seedDemo() {
    const hashedPassword = await bcrypt.hash("demo1234", 10);

    const coach = await this.prisma.coach.upsert({
      where: { email: "demo@footballcoach.local" },
      update: {
        password: hashedPassword,
        name: "Demo Coach",
        club: "Demo Club",
      },
      create: {
        email: "demo@footballcoach.local",
        password: hashedPassword,
        name: "Demo Coach",
        club: "Demo Club",
      },
    });

    return {
      message: "Demo coach created",
      coach: {
        id: coach.id,
        email: coach.email,
        name: coach.name,
      },
    };
  }

  @Post("login")
  async login(@Body() body: { email?: string; password?: string }) {
    const email = body.email?.trim().toLowerCase();
    const password = body.password?.trim();

    if (!email || !password) {
      throw new UnauthorizedException("Email and password are required.");
    }

    const coach = await this.prisma.coach.findUnique({
      where: { email },
    });

    if (!coach) {
      throw new UnauthorizedException("Invalid email or password.");
    }

    const validPassword = await bcrypt.compare(password, coach.password);

    if (!validPassword) {
      throw new UnauthorizedException("Invalid email or password.");
    }

    const accessToken = await this.jwtService.signAsync({
      sub: coach.id,
      email: coach.email,
      name: coach.name,
    });

    return {
      accessToken,
      coach: {
        id: coach.id,
        email: coach.email,
        name: coach.name,
        club: coach.club,
      },
    };
  }
}