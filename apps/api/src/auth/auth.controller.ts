import { Body, Controller, Post } from "@nestjs/common";
import { Public } from "../common/public";
import { LoginRateLimit } from "../common/rate-limit";
import { AuthService } from "./auth.service";
import { LoginDto } from "./auth.dto";

@Controller("auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @LoginRateLimit()
  @Post("login")
  login(@Body() body: LoginDto) {
    return this.auth.login(body);
  }
}
