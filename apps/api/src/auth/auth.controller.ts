import { Body, Controller, HttpCode, Post } from "@nestjs/common";
import { Public } from "../common/public";
import { AuthSessionRateLimit, LoginRateLimit } from "../common/rate-limit";
import { AuthService } from "./auth.service";
import { LoginDto, RefreshTokenDto } from "./auth.dto";

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
}
