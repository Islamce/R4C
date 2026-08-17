# CI Dependency Research Notes

The current WBS import and template workflow needs browser-side CSV and XLSX handling without retaining the high-severity `xlsx` dependency or adding a vulnerable Node-only dependency tree.

| Candidate | Verified capability | Decision relevance |
|---|---|---|
| [ExcelJS](https://github.com/exceljs/exceljs) | Workbook read/write project with 15,437 repository stars and MIT license. | Rejected for this web client after local production audit found high-severity `brace-expansion` findings through its `archiver`/`unzipper` dependency tree. |
| [Papa Parse](https://github.com/mholt/PapaParse) | Browser CSV parser documented as RFC 4180-correct, handling quoted cells and line breaks, with no runtime dependencies. | Retained for bounded local CSV intake. |
| [read-excel-file](https://github.com/catamphetamine/read-excel-file) | Browser-specific `readSheet()` can load an XLSX `File`, `Blob`, or `ArrayBuffer`, returning rows of strings, numbers, booleans, or `Date` values. | Selected for XLSX reading only. A committed static XLSX template asset preserves template download without embedding an XLSX-writing dependency into the production bundle. |

> Final local verification: `pnpm audit --prod --audit-level high` completed with **No known vulnerabilities found** after selecting `read-excel-file` for XLSX reading and Papa Parse for CSV parsing. `pnpm build` also completed successfully, and the static XLSX template returned HTTP 200 from the local web runtime.

## References

[1]: https://github.com/exceljs/exceljs
[2]: https://github.com/mholt/PapaParse
[3]: https://github.com/catamphetamine/read-excel-file
