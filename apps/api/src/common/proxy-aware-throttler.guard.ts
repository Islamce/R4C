import { Injectable } from "@nestjs/common";
import { ThrottlerGuard } from "@nestjs/throttler";

@Injectable()
export class ProxyAwareThrottlerGuard extends ThrottlerGuard {
  protected getTracker(request: Record<string, any>): Promise<string> {
    const tracker = request.ips?.[0] ?? request.ip ?? request.socket?.remoteAddress;
    return Promise.resolve(String(tracker ?? "unknown-client"));
  }
}
