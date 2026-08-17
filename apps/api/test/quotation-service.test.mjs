import assert from "node:assert/strict";
import test from "node:test";
import { QuotationService } from "../dist/quotations/quotation.service.js";

const snapshot = {
  id: "quotation-a",
  tenantId: "tenant-a",
  quotationNumber: "SQ-DEMO-01",
  revision: 1,
  status: "APPROVED_TO_SEND",
  expiresAt: new Date(Date.now() + 60 * 60 * 1000),
  currency: "SAR",
  snapshotChecksum: "snapshot-checksum",
  priceSnapshot: { listPriceMinor: "125000000" },
  paymentPlanSnapshot: { installments: [] },
  customerSnapshot: { displayName: "Synthetic Customer" },
  unitSnapshot: { code: "B2-804" },
  termsSnapshot: { body: "Synthetic terms" },
  customerDecisions: [],
};

function makeService({ expired = false, quotationStatus = "APPROVED_TO_SEND", tokenFound = true, claimCount = 1 } = {}) {
  const calls = { holds: 0, reservations: 0, quotationUpdates: [], tokenUpdates: [], decisions: [], audit: [] };
  const token = {
    id: "token-a",
    tenantId: "tenant-a",
    quotationId: "quotation-a",
    tokenHash: "irrelevant",
    purpose: "SYNTHETIC_QUOTATION_PREVIEW",
    expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    consumedAt: null,
    revokedAt: null,
    quotation: { ...snapshot, status: quotationStatus, expiresAt: expired ? new Date(Date.now() - 60_000) : snapshot.expiresAt },
  };
  const transaction = {
    quotationApprovalToken: {
      updateMany: async (command) => {
        calls.tokenUpdates.push(command);
        const isAtomicClaim = command.where?.id === token.id && Boolean(command.where?.expiresAt);
        return { count: isAtomicClaim ? claimCount : 1 };
      },
    },
    customerDecision: {
      create: async ({ data }) => {
        const decision = { id: `decision-${calls.decisions.length + 1}`, ...data, createdAt: new Date() };
        calls.decisions.push(decision);
        return decision;
      },
    },
    salesQuotation: {
      update: async (command) => {
        calls.quotationUpdates.push(command);
        return command;
      },
    },
    auditEvent: { create: async ({ data }) => { calls.audit.push(data); return data; } },
  };
  const prisma = {
    quotationApprovalToken: { findUnique: async () => tokenFound ? token : null },
    salesQuotation: { updateMany: async (command) => { calls.quotationUpdates.push(command); return { count: 1 }; } },
    unitHold: { create: async () => { calls.holds += 1; } },
    reservation: { create: async () => { calls.reservations += 1; } },
    $transaction: async (callback) => callback(transaction),
  };
  const service = new QuotationService(prisma, { record: async () => undefined });
  return { service, calls };
}

test("customer acceptance consumes the opaque token once, records an auditable decision, and creates no hold or reservation", async () => {
  const { service, calls } = makeService();
  const result = await service.recordCustomerDecision(
    { token: "opaque-preview-token", decision: "ACCEPTED" },
    { userAgent: "quotation-test", ipAddress: "127.0.0.1" },
  );

  assert.equal(result.receipt.decision, "ACCEPTED");
  assert.equal(calls.decisions.length, 1);
  assert.equal(calls.decisions[0].identityEvidence.method, "SYNTHETIC_PREVIEW_TOKEN");
  assert.equal(calls.holds, 0);
  assert.equal(calls.reservations, 0);
  assert.equal(calls.tokenUpdates[0].data.consumedAt instanceof Date, true);
  assert.equal(calls.quotationUpdates.some((entry) => entry.data?.status === "CUSTOMER_ACCEPTED"), true);
  assert.equal(calls.audit[0].action, "SALES_QUOTATION_CUSTOMER_ACCEPTED");
});

test("expired quotation tokens return the generic public error and do not create a decision", async () => {
  const { service, calls } = makeService({ expired: true });
  await assert.rejects(
    () => service.recordCustomerDecision({ token: "opaque-preview-token", decision: "DECLINED" }, {}),
    /Quotation link is unavailable/,
  );
  assert.equal(calls.decisions.length, 0);
  assert.equal(calls.holds, 0);
  assert.equal(calls.reservations, 0);
});

test("already-decided quotations reject a customer decision with the generic public error", async () => {
  const { service, calls } = makeService({ quotationStatus: "CUSTOMER_ACCEPTED" });
  await assert.rejects(
    () => service.recordCustomerDecision({ token: "opaque-preview-token", decision: "DECLINED" }, {}),
    /Quotation link is unavailable/,
  );
  assert.equal(calls.decisions.length, 0);
  assert.equal(calls.tokenUpdates.length, 0);
});

test("superseded quotation tokens reject a customer decision with the generic public error", async () => {
  const { service, calls } = makeService({ quotationStatus: "SUPERSEDED" });
  await assert.rejects(
    () => service.recordCustomerDecision({ token: "opaque-preview-token", decision: "ACCEPTED" }, {}),
    /Quotation link is unavailable/,
  );
  assert.equal(calls.decisions.length, 0);
  assert.equal(calls.tokenUpdates.length, 0);
});

test("concurrent decision submission is rejected when the optimistic token claim loses", async () => {
  const { service, calls } = makeService({ claimCount: 0 });
  await assert.rejects(
    () => service.recordCustomerDecision({ token: "opaque-preview-token", decision: "ACCEPTED" }, {}),
    /Quotation link is unavailable/,
  );
  assert.equal(calls.decisions.length, 0);
  assert.equal(calls.tokenUpdates.length, 1);
  assert.equal(calls.holds, 0);
  assert.equal(calls.reservations, 0);
});

test("modified or malformed tokens return only the generic public error", async () => {
  const { service, calls } = makeService({ tokenFound: false });
  await assert.rejects(
    () => service.recordCustomerDecision({ token: "modified-or-malformed-token", decision: "ACCEPTED" }, {}),
    /Quotation link is unavailable/,
  );
  assert.equal(calls.decisions.length, 0);
  assert.equal(calls.tokenUpdates.length, 0);
});

test("clarification requests require a non-empty comment before token consumption", async () => {
  const { service, calls } = makeService();
  await assert.rejects(
    () => service.recordCustomerDecision({ token: "opaque-preview-token", decision: "CLARIFICATION_REQUESTED" }, {}),
    /clarification request requires a comment/,
  );
  assert.equal(calls.decisions.length, 0);
  assert.equal(calls.tokenUpdates.length, 0);
});

test("quotation lifecycle source keeps customer acceptance separate from reservation permission paths", async () => {
  const source = await import("node:fs/promises").then((fs) => fs.readFile(new URL("../src/quotations/quotation.service.ts", import.meta.url), "utf8"));
  assert.match(source, /SALES_QUOTATION_CUSTOMER_/);
  assert.doesNotMatch(source, /unitHold\.create/);
  assert.doesNotMatch(source, /reservation\.create/);
  assert.match(source, /SalesQuotationStatus\.CUSTOMER_ACCEPTED/);
});


test("staff quotation detail lookup is tenant-scoped and does not expose a foreign tenant quotation", async () => {
  let receivedWhere;
  const prisma = {
    salesQuotation: {
      findFirst: async ({ where }) => {
        receivedWhere = where;
        return null;
      },
    },
  };
  const service = new QuotationService(prisma, { record: async () => undefined });
  await assert.rejects(
    () => service.detail({ userId: "sales-user-a", tenantId: "tenant-a", permissions: ["commercial:quotation:read-own"] }, "foreign-quotation"),
    /Quotation not found/,
  );
  assert.equal(receivedWhere.tenantId, "tenant-a");
  assert.equal(receivedWhere.id, "foreign-quotation");
  assert.deepEqual(receivedWhere.lead, { assignedToId: "sales-user-a" });
});

test("quotation HTTP surface keeps staff lifecycle permission-gated and public token routes rate-limited", async () => {
  const source = await import("node:fs/promises").then((fs) => fs.readFile(new URL("../src/quotations/quotation.controller.ts", import.meta.url), "utf8"));
  assert.match(source, /@RequirePermissions\("commercial:quotation:create"\)/);
  assert.match(source, /@RequirePermissions\("commercial:quotation:review"\)/);
  assert.match(source, /@RequirePermissions\("commercial:quotation:withdraw"\)/);
  assert.match(source, /@Public\(\)/);
  assert.match(source, /@QuotationApprovalRateLimit\(\)/);
});
