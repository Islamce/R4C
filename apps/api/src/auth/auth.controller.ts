import { Body, Controller, HttpCode, Post } from "@nestjs/common";
import { Public } from "../common/public";
import { AuthSessionRateLimit, LoginRateLimit, PasswordResetRateLimit } from "../common/rate-limit";
import { AuthService } from "./auth.service";
import { LoginDto, RefreshTokenDto, RequestPasswordResetDto, ResetPasswordDto } from "./auth.dto";

@Controller("auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @LoginRateLimit()
  @Post("login")
  login(@Body() body: LoginDto) {
    return this.auth.login(body);
  }

  @Public()
  @AuthSessionRateLimit()
  @Post("refresh")
  @HttpCode(200)
  refresh(@Body() body: RefreshTokenDto) {
    return this.auth.refresh(body);
  }

  @Public()
  @AuthSessionRateLimit()
  @Post("logout")
  @HttpCode(200)
  logout(@Body() body: RefreshTokenDto) {
    return this.auth.logout(body);
  }

  @Public()
  @PasswordResetRateLimit()
  @Post("password-reset/request")
  @HttpCode(202)
  requestPasswordReset(@Body() body: RequestPasswordResetDto) {
    return this.auth.requestPasswordReset(body);
  }

  @Public()
  @PasswordResetRateLimit()
  @Post("password-reset/confirm")
  @HttpCode(200)
  resetPassword(@Body() body: ResetPasswordDto) {
    return this.auth.resetPassword(body);
  }
}
