import { Body, Controller, Post } from "@nestjs/common";
import { Public } from "../common/public";
import { AuthService } from "./auth.service";
import { LoginDto } from "./auth.dto";

@Controller("auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Post("login")
  login(@Body() body: LoginDto) {
    return this.auth.login(body);
  }
}
