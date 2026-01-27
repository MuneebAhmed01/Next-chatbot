import { Controller, Get, Post, Body } from "@nestjs/common";
import { UserService } from "../services/user.service";
import { SignupDto, LoginDto, ForgotPasswordDto, ResetPasswordDto } from "../dto/user.dto";

@Controller("user") 
export class UsersController {
  constructor(private readonly userService: UserService) {}

  @Get("login")
  showLoginPage() {
    return { message: "Welcome to the login page", status: "success" }; 
  }

  @Post("login") // Maps to /user/login
  async login(@Body() loginDto: LoginDto) {
    return this.userService.login(loginDto.email, loginDto.password); // POST /login → Authenticate user credentials
  }

  @Get("signup") // Maps to /user/signup
  showSignupPage() {
    return { message: "Welcome to the signup page", status: "success" }; // GET /signup → Show signup page
  }

  @Post("signup") // Maps to /user/signup
  async signup(@Body() signupDto: SignupDto) {
    return this.userService.signup(
      signupDto.name,
      signupDto.email,
      signupDto.password,
    ); // POST /signup → Create new user
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
}