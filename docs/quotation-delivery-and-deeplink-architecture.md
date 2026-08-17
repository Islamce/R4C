# Quotation Delivery and Deep-Link Architecture

## Scope and MVP boundary

The buyer sales-quotation MVP implements a **secure responsive web approval page** and a synthetic/local test-link generation path. It does not send real email, SMS, WhatsApp, or push notifications; it does not configure Firebase, APNs, VAPID, or any provider credentials; and it does not create a buyer Flutter application.

A quotation state must distinguish `APPROVED_TO_SEND`, `QUEUED`, `DISPATCHED`, `DELIVERED`, and `FAILED` only when corresponding evidence exists. Because no verified email dispatcher is present, the MVP may enter `APPROVED_TO_SEND` and generate a synthetic preview link, but it must not assert `DISPATCHED` or `DELIVERED`.

## Secure buyer web URL

The future delivery adapter creates a cryptographically random opaque token for a single quotation revision and produces a URL such as:

```text
https://<r4c-host>/buyer/quotation/<opaque-token>
```

The server stores only a cryptographic hash of the token. The plaintext token is returned only at issuance and must not be saved to logs, analytics, audit metadata, screenshots, or persistent application records. The URL contains no tenant ID, quotation ID, customer ID, email address, unit identifier, or commercial amount.

On every buyer-page read or decision submission, the server must validate token hash, purpose, quotation revision, expiry, revocation/consumed state, tenant scope, rate-limit outcome, and allowed quotation state. Missing, expired, revoked, consumed, malformed, and foreign tokens return the same generic public error. Acceptance/decline is append-only and idempotently protected; it cannot create a hold, reservation, sale, payment, or lead-WON status.

## Future Flutter deep links

Flutter supports deep links on iOS, Android, and web. A future internal sales notification should route to a non-sensitive identifier such as `/sales/quotations/<quotation-id>` only after normal staff authentication and authorization. A customer-facing notification should prefer the secure web approval URL above; it may open a future buyer app only after that application has a separate customer session and token-exchange policy.[1]

Flutter’s documented behavior differs slightly by cold start and warm start. Router-based navigation can apply a received route to replace the active page set, which is appropriate for routing an authenticated sales user to a quotation or a decision follow-up state.[1]

## Future notification adapter

A future push adapter can use Firebase Cloud Messaging. The Flutter application must request notification permission, obtain a device registration token, and send token-refresh updates to the R4C API. Apple platform setup requires APNs authentication material and push/background capabilities.[2]

The R4C backend, not the Flutter client, owns Firebase/Google credentials. FCM HTTP v1 calls use application-default credentials or service-account-derived short-lived OAuth tokens. Service-account keys must remain in deployment secret storage and never be bundled in the mobile app or committed to source.[3]

| Concern | Required future control |
|---|---|
| Device registration | Tenant/user-scoped device record, platform, push token hash or protected value, app version, active/revoked timestamps. |
| Token rotation | Upsert on each token-refresh event; invalidate old registration safely. |
| Logout | Revoke device registration and delete local session credentials. |
| Notification privacy | Push payload contains only generic message text and a deep-link target; quote prices, customer details, and token secrets are fetched after authorization. |
| Retry evidence | Persist provider message ID, attempts, timestamps, outcome, and error; `DELIVERED` requires verified provider/customer evidence, not enqueue success. |
| Cold/warm start | Route after auth/session restoration; if session expired, retain intended target locally and resume only after successful login. |
| SMS/WhatsApp | Future adapters with separate consent, sender, template, webhook, secret, and delivery-evidence design; not part of this MVP. |

## References

[1] [Flutter — Deep linking](https://docs.flutter.dev/ui/navigation/deep-linking)

[2] [Firebase — Get started with Firebase Cloud Messaging in Flutter apps](https://firebase.google.com/docs/cloud-messaging/flutter/get-started)

[3] [Firebase — Send a message using the FCM HTTP v1 API](https://firebase.google.com/docs/cloud-messaging/send/v1-api)
