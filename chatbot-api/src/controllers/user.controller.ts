import { Controller, Get, Post, Body } from "@nestjs/common";
import { UserService } from "../services/user.service";
import { AuthService } from "../auth/auth.service";

@Controller("user")
export class UsersController {
  constructor(
    private readonly userService: UserService,
    private readonly authService: AuthService
  ) {}

  @Get("login")
  showLoginPage() {
    return { message: "Welcome to the login page", status: "success" };
  }

  @Post("google-auth")
  async googleAuth(@Body() body: { email: string; name: string; googleId: string }) {
    return this.authService.googleLogin(body.email, body.name, body.googleId);
  }

  @Get("profile")
  async getUserProfile(@Body() body: { userId: string }) {
    return this.userService.getUserById(body.userId);
  }

  @Post("update-profile")
  async updateProfile(@Body() body: { userId: string; name?: string; email?: string }) {
    return this.userService.updateUserProfile(body.userId, { name: body.name, email: body.email });
  }
}
