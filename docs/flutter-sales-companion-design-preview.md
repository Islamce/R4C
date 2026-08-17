# Internal Sales Flutter Design Preview

## Status

> **FLUTTER DESIGN PREVIEW — APPLICATION NOT YET IMPLEMENTED**

No R4C Flutter project was found (`pubspec.yaml` is absent), so the quotation MVP adds an implementation-grade synthetic visual prototype at `/design-preview?surface=flutter`. It is not a Flutter scaffold, mobile release, customer app, FCM integration, device-token registration, Firebase project, APNs setup, or production API mutation.

## Covered internal-sales screens

| Screen | Design-preview purpose | Governing API/lifecycle contract |
|---|---|---|
| Sales sign-in | Internal staff identity boundary. | Existing JWT login/refresh, tenant membership, and role permissions. |
| Active projects | Switch only among accessible active projects. | Tenant-scoped project/commercial read endpoints. |
| Inventory search | Find governed available units. | Current commercial inventory read contracts; no local status mutation. |
| Unit detail | Show canonical unit, published price, and availability evidence. | Published price/read and unit-status controls remain server authoritative. |
| Lead/interest capture | Record sales interest and preferred unit. | Existing Customer/Lead/activity controls and consent evidence. |
| Customer timeline | Show customer activity and quotation journey. | Lead/activity visibility follows own/all-lead permission scope. |
| Quotation drafts | View own or tenant-authorized quotation drafts. | `commercial:quotation:read-own` / `read-all`. |
| Quotation builder | Submit controlled terms, payment plan, and validity for review. | `commercial:quotation:create`; source price and payment plan are server validated. |
| Internal review | Clearly signal manager review and self-approval denial. | `commercial:quotation:review`; draft → internal review → approved-to-send. |
| Customer decision | Display recorded accept/decline/clarification evidence. | Customer decision is append-only and cannot reserve inventory. |
| Reservation handoff | Prompt separately authorized internal follow-up. | Existing `commercial:reservation:confirm`; never invoked automatically by acceptance. |
| Offline and expired-session states | Bound retry and reauthentication behavior. | Offline drafts require idempotent replay design; pricing is never recalculated client-side. |

## Alignment rules

The design preview uses the existing R4C commercial terminology, visual tokens, buyer-quotation lifecycle, tenant isolation, Arabic/RTL direction, and no-reservation safety language. A future Flutter implementation must use a versioned mobile API facade, secure platform storage for session material, device registration only after consent, and server-owned notification credentials. It must not call database/storage services directly or calculate authoritative pricing on-device.

## Deferred mobile work

The following remains explicitly deferred: buyer Flutter application, FCM, APNs, VAPID, Firebase project creation, device-token registration and rotation, push delivery, mobile store signing/release, external communications, and production API mutation.
