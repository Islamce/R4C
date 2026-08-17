# R4C Governed WBS Bulk Import

## Purpose

The R4C Projects workspace now includes a **CSV/XLSX WBS bulk-import wizard**. It parses the selected file locally in the user’s browser, sends only normalized WBS rows to the server for a tenant-scoped dry run, presents the resulting hierarchy and validation findings, and requires an explicit final commit before any database row is created.

> **No WBS record is created during file selection or validation.** The commit creates all validated rows atomically and records a single batch audit event.

## Operator workflow

| Step | Operator action | System behavior |
|---|---|---|
| 1 | Open **Projects** and choose **Import WBS**. | The wizard is available only after a project exists. |
| 2 | Select the target project and download a CSV or XLSX template if needed. | The template documents the accepted column names and contains an illustrative hierarchy. |
| 3 | Select a `.csv` or `.xlsx` file. | The browser reads the first worksheet only. Raw spreadsheet bytes are not uploaded to the API. |
| 4 | Run validation. | The API revalidates the normalized rows against the selected project and current tenant state. |
| 5 | Review the findings and hierarchy. | The operator can export a CSV error report; final commit remains disabled while any issue is present. |
| 6 | Select **Commit validated WBS**. | The server rechecks the preview checksum and live state, writes parents before children in one transaction, and stores a batch audit event. |

## File contract

The controlled templates contain the following columns. `Code` and `Name` are mandatory. The other columns are optional.

| Column | Required | Validation and persistence behavior |
|---|---:|---|
| `Code` | Yes | Trimmed, normalized to uppercase, maximum 40 characters, and unique within the selected project. |
| `Name` | Yes | Trimmed project package name, 2–160 characters. |
| `Parent Code` | No | Must reference either another valid row in the same import or an existing WBS code in the same selected project. |
| `Sort Order` | No | Whole number from 0 to 999,999; defaults to `0`. |
| `Planned Start` | No | Valid date stored as `plannedFrom`. |
| `Planned Finish` | No | Valid date stored as `plannedTo` and cannot precede Planned Start. |
| `Weight` | No | Number from 0 to 1,000,000 with up to four decimal places; defaults to `0`. |

The client enforces an **8 MB** file-size limit and a maximum of **5,000** imported WBS rows. The server independently applies the 5,000-row limit.

## Validation gates

The server checks the target project using both `tenantId` and `projectId`. It blocks the commit for duplicate codes in the spreadsheet, codes that already exist in the project, unknown parent codes, self-parenting, circular parent chains, invalid date order, or a changed preview checksum.

| Gate | Result if it fails |
|---|---|
| Permission | The preview and commit routes require `wbs:create`. |
| Tenant/project boundary | The project lookup is scoped to the current authenticated tenant. Unknown or cross-tenant projects return not found. |
| Preview integrity | Commit requires the SHA-256 checksum returned by the reviewed preview. |
| Concurrency | Commit rechecks imported codes and hierarchy state inside the database transaction. A change after preview produces a conflict instead of a partial import. |
| Atomicity | A failed node creation or audit event rolls back the full batch. |
| Traceability | A successful batch creates `WBS_IMPORT_COMMITTED`, storing the source file name, checksum, count, and created WBS codes. |

## API boundaries

The web application exposes narrow same-origin routes. These forward the authenticated session only to the specific supported backend routes.

| Method | Web route | Backend route | Purpose |
|---|---|---|---|
| `POST` | `/api/projects/{projectId}/wbs/import/preview` | `/projects/{projectId}/wbs/import/preview` | Dry-run validation and hierarchy preview. |
| `POST` | `/api/projects/{projectId}/wbs/import/commit` | `/projects/{projectId}/wbs/import/commit` | Explicit atomic commit of the reviewed rows. |

## Quality assurance

The import logic has focused mock-backed service tests for an existing tenant-scoped parent, parent-before-child creation order, batch audit evidence, duplicate spreadsheet codes, and codes that already exist in the project. It is run through:

```bash
pnpm --filter @r4c/api test:wbs-import
```

The web workspace production build verifies the CSV/XLSX parsing dependency, import UI, and both Next.js API route boundaries.

## Dependency acknowledgement

The browser parser and template generator use the open-source [SheetJS Community Edition](https://github.com/SheetJS/sheetjs) spreadsheet toolkit. It is used only in the browser for parsing the selected CSV/XLSX file and generating controlled templates; raw spreadsheet files are not accepted by the R4C backend.
