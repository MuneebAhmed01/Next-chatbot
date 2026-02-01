import { Controller, Get, Post, Delete, Body } from "@nestjs/common";
import { UserService } from "../services/user.service";

@Controller("user")
export class UsersController {
  constructor(
    private readonly userService: UserService
  ) {}

  @Get("profile")
  async getUserProfile(@Body() body: { userId: string }) {
    return this.userService.getUserById(body.userId);
  }

  @Post("update-profile")
  async updateProfile(@Body() body: { userId: string; name?: string; email?: string }) {
    return this.userService.updateUserProfile(body.userId, { name: body.name, email: body.email });
  }

  @Get("credits")
  async getUserCredits(@Body() body: { userId: string }) {
    return this.userService.getUserById(body.userId);
  }

  @Post("add-credits")
  async addCredits(@Body() body: { userId: string; credits: number }) {
    return this.userService.addCredits(body.userId, body.credits);
  }

  @Post("deduct-credits")
  async deductCredits(@Body() body: { userId: string; credits: number }) {
    return this.userService.deductCredits(body.userId, body.credits);
  }

  @Delete("delete")
  async deleteUser(@Body() body: { userId: string }) {
    return this.userService.deleteUser(body.userId);
  }
}
