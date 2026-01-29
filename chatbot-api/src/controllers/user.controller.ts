import { Controller, Get, Post, Body } from "@nestjs/common";
import { UserService } from "../services/user.service";
import { SignupDto, LoginDto, ForgotPasswordDto, ResetPasswordDto } from "../dto/user.dto";

@Controller("user")
export class UsersController {
  constructor(private readonly userService: UserService) { }

  @Get("login")
  showLoginPage() {
    return { message: "Welcome to the login page", status: "success" };
  }

  @Post("login")
  async login(@Body() loginDto: LoginDto) {
    return this.userService.login(loginDto.email, loginDto.password);
  }

  @Get("signup")
  showSignupPage() {
    return { message: "Welcome to the signup page", status: "success" };
  }

  @Post("signup")
  async signup(@Body() body: { name: string; email: string; password: string }) {
    return this.userService.initiateSignup(body.name, body.email, body.password);
  }

  @Post("forgot-password")
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.userService.forgotPassword(forgotPasswordDto.email);
  }

  @Post("reset-password")
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.userService.resetPassword(
      resetPasswordDto.token,
      resetPasswordDto.newPassword,
    );
  }

  @Post("verify-otp")
  async verifyOTP(@Body() body: { email: string; otp: string }) {
    return this.userService.verifyOTPAndSignup(body.email, body.otp);
  }

  @Post("resend-otp")
  async resendOTP(@Body() body: { email: string }) {
    return this.userService.resendOTP(body.email);
  }

  @Post("google-auth")
  async googleAuth(@Body() body: { email: string; name: string; googleId: string }) {
    return this.userService.googleLogin(body.email, body.name, body.googleId);
  }
}
