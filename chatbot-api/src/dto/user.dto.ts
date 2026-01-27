import { IsNotEmpty, IsString} from "class-validator"

export class SignupDto {
  @IsNotEmpty()
  name: string;
  email: string;
  password: string;
}

export class LoginDto {
  @IsNotEmpty()
  email: string;
  password: string;
}

export class ForgotPasswordDto {
  @IsNotEmpty()
  email: string;
}

export class ResetPasswordDto {
  token: string;
  newPassword: string;
}
