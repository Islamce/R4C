# i18n & Localized Commercial Content Scope Gate

**Status:** Evidence gathered; **no localization implementation authorized**.  
**Date:** 14 August 2026  
**Authority:** R0 Product Reset Blueprint is the governing baseline.  
**Purpose:** Close the previously unexamined localization gap by distinguishing the existing UI i18n/RTL foundation from unimplemented localization of commercial and document-backed content.

## Verified R0 position

R0 is **not silent** on localization. It lists **“Localization/RTL”** in the Platform Core capabilities to keep and reuse, and its frontend strategy explicitly directs the product to reuse the existing **“i18n/RTL foundation”** rather than rewrite the frontend. [R0 §3, §13](product-reset-blueprint.md)

> “Platform Core — KEEP/REUSE … Localization/RTL.”  
> “Reuse existing Next.js application, session boundary, AppShell, i18n/RTL foundation, API client and error-state patterns.” — [R0 §3, §13](product-reset-blueprint.md)

R0 does **not** name Arabic, English, a specific locale set, a locale fallback policy, translated commercial records, translated document versions, or a migration strategy for localized content. It therefore authorizes reuse of the platform foundation, but does not authorize a content-localization data model by implication.

## Verified current state

| Area | Verified evidence | Scope implication |
| --- | --- | --- |
| UI locale foundation | `apps/web/lib/i18n.ts` implements the `en` and `ar` locale union, English and Arabic dictionaries, locale normalization, and `rtl` direction for Arabic. | The web platform already has a bilingual UI/RTL mechanism; no new foundational i18n library is justified by current evidence. |
| UI formatting | Existing web components use `Intl` formatting with `ar-SA` or `en-GB` according to the selected locale. | Date/number/currency presentation is a presentation-layer capability, separate from translation of stored commercial data. |
| R0 product intent | R0 retains Localization/RTL as a reusable Platform Core concern and directs reuse in the frontend. | A future commercial experience should use the existing foundation, subject to approved content decisions. |
| Document foundation | `Document` contains `code`, `title`, `discipline`, `documentType`, and lifecycle data. `DocumentVersion` contains revision/file/storage/review fields. Neither model has `locale`, `language`, `translationOf`, or equivalent relationship metadata. | C02 media references are language-neutral links to existing document versions; they do not establish localized document/media semantics. |
| C02 media | `ProjectMedia`, `BuildingMedia`, and `UnitMedia` contain owner, document-version reference, and sort order only. | The media layer cannot currently select a localized asset/version by locale. |
| C01 commercial content | Project has `name`, `description`; DevelopmentPhase has `name`, `description`; Building and Floor have `name`; UnitType has `name`, `description`; Unit has `orientation` and `view`. | These are plausible presentation-content candidates, but no current field is modeled as a translation or assigned a locale. |
| C02 commercial content | `PaymentPlanInstallment.label` is optional free text. Price currency is ISO code; revisions, dates, shares, statuses, and sort orders are structured/system data. | Only the label is a plausible localized display field; it is not currently localized. |
| C03 commercial content | Customer first/last name, Lead `source`, consent channel/purpose, and SalesActivity notes are stored as single values. | These fields have different semantics: PII, free-text provenance, legal/operational evidence, and internal notes must not be automatically treated as translatable public content. |

## Current text-field classification

This inventory describes current schema evidence only. It does **not** designate fields for translation.

| Domain | Current field(s) | Likely semantic class | Current locale support |
| --- | --- | --- | --- |
| Project | `name`, `description` | Public/commercial presentation candidate, subject to publication decisions | Single value only |
| DevelopmentPhase | `name`, `description` | Commercial presentation candidate | Single value only |
| Building / Floor | `name` | Commercial presentation candidate | Single value only |
| UnitType | `name`, `description` | Commercial presentation candidate | Single value only |
| Unit | `orientation`, `view`, `code`, `number` | `orientation`/`view` may be display vocabulary; code/number are identifiers | Single value only |
| PaymentPlanInstallment | `label` | Commercial display label candidate | Single value only |
| Document | `title`, `discipline`, `documentType` | Document metadata; public visibility and translation semantics unapproved | Single value only |
| DocumentVersion | `fileName`, `revision`, `mimeType`, storage identifiers | File/version technical metadata, not automatically display translation content | No locale field |
| Commercial media | owner/document-version IDs and `sortOrder` | Reference metadata only | No locale field |
| Customer | first/last name, phone, email | PII/identity, not ordinary UI translation content | Single value only |
| Lead | `source`, consent channel/purpose | Provenance and consent evidence; must preserve evidentiary meaning | Single value only |
| SalesActivity | `notes` | Internal activity evidence | Single value only |

## Implementation boundary once approved

| Area | Evidence-supported direction | Not authorized by this scope gate |
| --- | --- | --- |
| UI labels and RTL | Reuse the existing `en`/`ar` UI dictionaries, locale cookie/session handling, and RTL direction foundation if a commercial UI is later delivered. | Replacing the i18n library, adding a new frontend stack, or declaring the current dictionaries complete for Commercial. |
| Commercial content | Decide explicitly which published commercial fields need locale variants before altering models or contracts. | Adding translation tables, JSON locale maps, columns, migrations, or API fields. |
| Documents and media | Treat document/media localization as undecided because the foundation lacks locale metadata. | Assuming a DocumentVersion is a translation, auto-selecting media by locale, or duplicating documents. |
| Internal and evidentiary text | Preserve Customer identity, Lead source/consent evidence, and SalesActivity notes as governed business evidence unless a future decision defines a lawful and auditable translation need. | Machine translation, automatic rewriting, public exposure, or mutation of evidence records. |
| Data and migration discipline | Any approved schema work must be additive, explicit, tenant-safe, contract-reviewed, and rehearsed on clean and upgrade paths. | Prisma `db push`, baseline edits, destructive backfill, or silent replacement of canonical values. |

## Open decisions before any i18n implementation

| ID | Decision required | Why it cannot be inferred safely |
| --- | --- | --- |
| I18N-D01 | Confirm the supported locale set and priority: Arabic/English only, or a broader locale strategy. | R0 preserves localization/RTL but does not name a required language set. Existing UI support for `en`/`ar` is implementation evidence, not a product-content mandate. |
| I18N-D02 | Define which audience and surface need localized content: public catalog, authenticated Commercial, customer portal, documents/media, or all. | R0 distinguishes public, commercial, and future portal surfaces; it does not make their localized-content requirements equivalent. |
| I18N-D03 | Select the exact commercial fields that need locale variants and classify fields that must remain canonical/evidentiary. | Current strings mix display content, identifiers, PII, provenance, consent evidence, and internal notes. |
| I18N-D04 | Choose the localized-content model and ownership: companion translation records, approved localized versions, or another design. | No schema model establishes locale, fallback, revision, translation relationship, publishing, or audit behavior. |
| I18N-D05 | Define fallback, requiredness, and publication rules for missing translations. | No R0 rule specifies whether an untranslated value can appear publicly, which locale is canonical, or when a translation is publishable. |
| I18N-D06 | Define localized document/media behavior, including whether language belongs to Document, DocumentVersion, media association, or presentation selection. | The existing Document/DocumentVersion and C02 media models contain no locale/language relationship. |
| I18N-D07 | Define search, sort, uniqueness, slug/code, and identifier behavior across localized fields. | Codes/numbers are current canonical keys; changing how localized names are searched or constrained affects contracts and data integrity. |
| I18N-D08 | Define translation authoring, review, audit, correction, and retention controls. | Commercial publishing and consent/evidence obligations make content governance a business rule, not a library configuration choice. |
| I18N-D09 | Confirm locale-specific formatting, RTL accessibility, and fallback requirements for future Commercial/public journeys. | The platform has technical `en`/`ar`/RTL support, but R0 does not specify journey-level accessibility or formatting acceptance criteria. |
| I18N-D10 | Decide whether historic commercial data requires migration/backfill and who approves it. | Existing commercial records are single-value; any backfill could alter display meaning and needs controlled evidence. |

## Explicit stop

No i18n code, schema, migration, API contract, document/media mutation, data backfill, or public/commercial UI change is authorized by this document. This is an evidence and decision gate only.

## References

- [R0 Product Reset Blueprint](product-reset-blueprint.md) §§3, 6, 13
- `apps/web/lib/i18n.ts`
- `apps/api/prisma/schema.prisma` — Project, C01/C02/C03, Document, and DocumentVersion models
- `docs/c02-pricing-media-scope.md`
- `docs/c03-customer-leads-scope.md`
