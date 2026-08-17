"use client";

import { readSheet } from "read-excel-file/browser";
import Papa from "papaparse";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
} from "react";
import { clientApi, ClientApiError } from "../lib/client-api";
import type {
  ProjectRecord,
  WbsImportCommitReceipt,
  WbsImportIssue,
  WbsImportPreview,
  WbsImportRowPayload,
} from "../lib/types";
import { useI18n } from "./I18nProvider";

type ImportStage = "select" | "validating" | "review" | "committing" | "complete";
type TemplateFormat = "csv" | "xlsx";

type ParseProblem = {
  rowNumber: number;
  field: string;
  message: string;
};

const TEMPLATE_ROWS = [
  ["Code", "Name", "Parent Code", "Sort Order", "Planned Start", "Planned Finish", "Weight"],
  ["1", "Project delivery", "", "1", "2026-01-01", "2026-12-31", "100"],
  ["1.1", "Design", "1", "10", "2026-01-01", "2026-03-31", "25"],
  ["1.2", "Construction", "1", "20", "2026-04-01", "2026-11-30", "65"],
  ["1.3", "Handover", "1", "30", "2026-12-01", "2026-12-31", "10"],
] as const;

function cleanHeader(value: unknown) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s_\-]+/g, "");
}

function stringValue(value: unknown) {
  return String(value ?? "").trim();
}

function optionalNumber(value: unknown, field: string, rowNumber: number, problems: ParseProblem[]) {
  const text = stringValue(value);
  if (!text) return undefined;
  const number = Number(text.replace(/,/g, ""));
  if (!Number.isFinite(number)) {
    problems.push({ rowNumber, field, message: `${field} must be a number.` });
    return undefined;
  }
  return number;
}

function optionalInteger(value: unknown, field: string, rowNumber: number, problems: ParseProblem[]) {
  const number = optionalNumber(value, field, rowNumber, problems);
  if (number === undefined) return undefined;
  if (!Number.isInteger(number) || number < 0) {
    problems.push({ rowNumber, field, message: `${field} must be a whole number of zero or more.` });
    return undefined;
  }
  return number;
}

function optionalDate(value: unknown, field: string, rowNumber: number, problems: ParseProblem[]) {
  const text = stringValue(value);
  if (!text) return undefined;
  const parsed = new Date(text);
  if (Number.isNaN(parsed.getTime())) {
    problems.push({ rowNumber, field, message: `${field} must be a valid date.` });
    return undefined;
  }
  return parsed.toISOString().slice(0, 10);
}

function downloadBlob(name: string, type: string, content: BlobPart) {
  const anchor = document.createElement("a");
  const url = URL.createObjectURL(new Blob([content], { type }));
  anchor.href = url;
  anchor.download = name;
  anchor.click();
  URL.revokeObjectURL(url);
}

function csvCell(value: unknown) {
  const text = String(value ?? "");
  const safe = /^[=+\-@]/.test(text) ? `'${text}` : text;
  return /[",\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

function rowIssueMessage(issue: WbsImportIssue, arabic: boolean) {
  if (!arabic) return issue.message;
  const messages: Record<WbsImportIssue["reasonCode"], string> = {
    DUPLICATE_CODE: "رمز هيكل العمل مكرر في الملف.",
    DATE_ORDER: "يجب أن يكون تاريخ النهاية المخطط في أو بعد تاريخ البداية.",
    SELF_PARENT: "لا يمكن أن تكون الحزمة الرئيسية هي الحزمة نفسها.",
    PARENT_NOT_FOUND: "رمز الحزمة الرئيسية غير موجود في المشروع أو في ملف الاستيراد.",
    HIERARCHY_CYCLE: "تحتوي علاقة الحزم الرئيسية على حلقة غير صالحة.",
    EXISTING_CODE: "رمز هيكل العمل موجود بالفعل في المشروع المحدد.",
  };
  return messages[issue.reasonCode];
}

export function WbsImportWizard({
  projects,
  onClose,
  onImported,
}: {
  projects: ProjectRecord[];
  onClose: () => void;
  onImported: () => Promise<void> | void;
}) {
  const { locale } = useI18n();
  const arabic = locale === "ar";
  const text = (english: string, arabicText: string) => (arabic ? arabicText : english);
  const inputRef = useRef<HTMLInputElement>(null);
  const [projectId, setProjectId] = useState(projects[0]?.id ?? "");
  const [stage, setStage] = useState<ImportStage>("select");
  const [sourceName, setSourceName] = useState<string | null>(null);
  const [rows, setRows] = useState<WbsImportRowPayload[]>([]);
  const [localProblems, setLocalProblems] = useState<ParseProblem[]>([]);
  const [preview, setPreview] = useState<WbsImportPreview | null>(null);
  const [receipt, setReceipt] = useState<WbsImportCommitReceipt | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!projects.some((project) => project.id === projectId)) {
      setProjectId(projects[0]?.id ?? "");
    }
  }, [projectId, projects]);

  const selectedProject = projects.find((project) => project.id === projectId);
  const orderedPreviewRows = useMemo(
    () => [...(preview?.rows ?? [])].sort((left, right) => left.rowNumber - right.rowNumber),
    [preview],
  );

  function resetImport() {
    setStage("select");
    setSourceName(null);
    setRows([]);
    setLocalProblems([]);
    setPreview(null);
    setReceipt(null);
    setNotice(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  function downloadTemplate(format: TemplateFormat) {
    if (format === "csv") {
      downloadBlob(
        "r4c-wbs-import-template.csv",
        "text/csv;charset=utf-8",
        `\ufeff${TEMPLATE_ROWS.map((row) => row.map(csvCell).join(",")).join("\n")}`,
      );
      return;
    }
    const anchor = document.createElement("a");
    anchor.href = "/templates/r4c-wbs-import-template.xlsx";
    anchor.download = "r4c-wbs-import-template.xlsx";
    anchor.click();
  }

  async function readFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    resetImport();
    if (!file) return;
    const lowerName = file.name.toLowerCase();
    if (!lowerName.endsWith(".csv") && !lowerName.endsWith(".xlsx")) {
      setNotice(text("Select a .csv or .xlsx file.", "اختر ملفاً بصيغة ‎.csv أو ‎.xlsx."));
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setNotice(text("The file exceeds the 8 MB review limit.", "يتجاوز الملف حد المراجعة البالغ 8 ميغابايت."));
      return;
    }

    try {
      let matrix: unknown[][];
      if (lowerName.endsWith(".csv")) {
        const parsed = Papa.parse<string[]>(await file.text(), { skipEmptyLines: "greedy" });
        if (parsed.errors.length) {
          setNotice(text("The CSV file could not be read.", "تعذرت قراءة ملف CSV."));
          return;
        }
        matrix = parsed.data;
      } else {
        matrix = await readSheet(file);
      }
      if (matrix.length < 2) {
        setNotice(text("The file must contain a header row and at least one WBS row.", "يجب أن يحتوي الملف على صف عناوين وصف واحد على الأقل لهيكل العمل."));
        return;
      }
      const header = matrix[0] ?? [];
      const headerMap = new Map(header.map((value, index) => [cleanHeader(value), index]));
      const codeIndex = headerMap.get("code");
      const nameIndex = headerMap.get("name");
      if (codeIndex === undefined || nameIndex === undefined) {
        setNotice(text("Required columns are Code and Name. Download the template for the exact format.", "الأعمدة الإلزامية هي الرمز والاسم. نزّل القالب للتنسيق الصحيح."));
        return;
      }

      const parentIndex = headerMap.get("parentcode");
      const sortIndex = headerMap.get("sortorder");
      const plannedFromIndex = headerMap.get("plannedstart");
      const plannedToIndex = headerMap.get("plannedfinish");
      const weightIndex = headerMap.get("weight");
      const problems: ParseProblem[] = [];
      const parsedRows: WbsImportRowPayload[] = [];

      matrix.slice(1).forEach((sheetRow, offset) => {
        const rowNumber = offset + 2;
        const valueAt = (index: number | undefined) => (index === undefined ? "" : sheetRow[index]);
        const code = stringValue(valueAt(codeIndex));
        const name = stringValue(valueAt(nameIndex));
        if (!code || !name) {
          problems.push({
            rowNumber,
            field: !code ? "Code" : "Name",
            message: !code
              ? text("Code is required.", "الرمز مطلوب.")
              : text("Name is required.", "الاسم مطلوب."),
          });
          return;
        }
        const sortOrder = optionalInteger(valueAt(sortIndex), "Sort Order", rowNumber, problems);
        const weight = optionalNumber(valueAt(weightIndex), "Weight", rowNumber, problems);
        const plannedFrom = optionalDate(valueAt(plannedFromIndex), "Planned Start", rowNumber, problems);
        const plannedTo = optionalDate(valueAt(plannedToIndex), "Planned Finish", rowNumber, problems);
        parsedRows.push({
          rowNumber,
          code,
          name,
          ...(stringValue(valueAt(parentIndex)) ? { parentCode: stringValue(valueAt(parentIndex)) } : {}),
          ...(sortOrder === undefined ? {} : { sortOrder }),
          ...(plannedFrom ? { plannedFrom } : {}),
          ...(plannedTo ? { plannedTo } : {}),
          ...(weight === undefined ? {} : { weight }),
        });
      });

      if (parsedRows.length > 5000) {
        problems.push({
          rowNumber: 0,
          field: "File",
          message: text("A single import is limited to 5,000 WBS rows.", "يقتصر الاستيراد الواحد على 5,000 صف لهيكل العمل."),
        });
      }
      setSourceName(file.name);
      setRows(parsedRows);
      setLocalProblems(problems);
      setNotice(
        problems.length
          ? text("Correct the file-format issues before server validation.", "صحح مشاكل تنسيق الملف قبل التحقق من الخادم.")
          : text("File read successfully. Review its tenant-scoped validation before committing.", "تمت قراءة الملف بنجاح. راجع التحقق المقيد بالمستأجر قبل الاعتماد."),
      );
    } catch {
      setNotice(text("The file could not be read. Use the provided CSV/XLSX template.", "تعذرت قراءة الملف. استخدم قالب CSV/XLSX المقدم."));
    }
  }

  async function validateImport() {
    if (!projectId || !rows.length || localProblems.length) return;
    setStage("validating");
    setNotice(null);
    try {
      const result = await clientApi<WbsImportPreview>(
        `/api/projects/${encodeURIComponent(projectId)}/wbs/import/preview`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ rows, sourceName }),
        },
      );
      setPreview(result);
      setStage("review");
      setNotice(
        result.canCommit
          ? text("Validation passed. Review the hierarchy and commit only when ready.", "نجح التحقق. راجع الهيكل واعتمد الاستيراد فقط عند الجاهزية.")
          : text("Validation found issues. Export and correct them before committing.", "عثر التحقق على مشاكل. صدّرها وصححها قبل الاعتماد."),
      );
    } catch (error) {
      setStage("select");
      setNotice(
        error instanceof ClientApiError && error.status === 403
          ? text("Your role does not include WBS import authority.", "لا يتضمن دورك صلاحية استيراد هيكل العمل.")
          : text("Validation could not be completed. Confirm the selected project and try again.", "تعذر إكمال التحقق. تأكد من المشروع المحدد ثم أعد المحاولة."),
      );
    }
  }

  function exportProblems() {
    const records = preview?.issues ?? [];
    const lines = [
      ["Spreadsheet row", "WBS code", "Field", "Issue"],
      ...records.map((issue) => [issue.rowNumber, issue.code, issue.field, issue.message]),
      ...localProblems.map((problem) => [problem.rowNumber || "", "", problem.field, problem.message]),
    ];
    downloadBlob(
      "r4c-wbs-import-errors.csv",
      "text/csv;charset=utf-8",
      `\ufeff${lines.map((line) => line.map(csvCell).join(",")).join("\n")}`,
    );
  }

  async function commitImport() {
    if (!preview?.canCommit || !projectId) return;
    setStage("committing");
    setNotice(null);
    try {
      const result = await clientApi<WbsImportCommitReceipt>(
        `/api/projects/${encodeURIComponent(projectId)}/wbs/import/commit`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ rows, sourceName, previewChecksum: preview.checksum }),
        },
      );
      setReceipt(result);
      setStage("complete");
      await onImported();
      setNotice(
        text(
          `${result.createdCount} WBS nodes were committed and recorded in the audit trail.`,
          `تم اعتماد ${result.createdCount} من عقد هيكل العمل وتسجيلها في مسار التدقيق.`,
        ),
      );
    } catch (error) {
      setStage("review");
      setNotice(
        error instanceof ClientApiError && error.status === 409
          ? text("The project WBS changed after review. Validate the source file again.", "تغير هيكل العمل في المشروع بعد المراجعة. تحقق من الملف المصدر مرة أخرى.")
          : text("The validated import was not committed. Review the source and try again.", "لم يتم اعتماد الاستيراد المتحقق منه. راجع المصدر ثم أعد المحاولة."),
      );
    }
  }

  const issues = preview?.issues ?? [];
  const canValidate = Boolean(projectId && rows.length && !localProblems.length && stage === "select");

  return (
    <section className="wbs-import-wizard" aria-labelledby="wbs-import-title">
      <header className="wbs-import-heading">
        <div>
          <p className="eyebrow">{text("Governed project controls", "ضوابط المشروع المحكومة")}</p>
          <h2 id="wbs-import-title">{text("Bulk WBS import", "استيراد مجمّع لهيكل العمل")}</h2>
          <p>
            {text(
              "Parse the file in this browser, run a tenant-scoped dry run, review the hierarchy, then commit one atomic, audited import.",
              "تتم قراءة الملف في هذا المتصفح، ثم يُجرى تحقق تجريبي مقيد بالمستأجر وتُراجع البنية قبل اعتماد استيراد ذري ومسجل في التدقيق.",
            )}
          </p>
        </div>
        <button className="button button-secondary" type="button" onClick={onClose}>
          {text("Close", "إغلاق")}
        </button>
      </header>

      <div className="wbs-import-governance" role="note">
        <strong>{text("No records are created during validation.", "لا يتم إنشاء أي سجلات أثناء التحقق.")}</strong>
        <span>{text("Only a role with wbs:create can validate and commit this import.", "فقط الدور الذي يملك wbs:create يستطيع التحقق من هذا الاستيراد واعتماده.")}</span>
      </div>

      <div className="wbs-import-toolbar">
        <label>
          <span>{text("Target project", "المشروع المستهدف")}</span>
          <select value={projectId} onChange={(event) => { setProjectId(event.target.value); resetImport(); }} disabled={stage === "committing" || stage === "complete"}>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>{project.code} — {project.name}</option>
            ))}
          </select>
        </label>
        <div className="wbs-template-actions">
          <span>{text("Start with the controlled template", "ابدأ بالقالب المحكوم")}</span>
          <button className="button button-secondary" type="button" onClick={() => downloadTemplate("csv")}>{text("CSV template", "قالب CSV")}</button>
          <button className="button button-secondary" type="button" onClick={() => downloadTemplate("xlsx")}>{text("XLSX template", "قالب XLSX")}</button>
        </div>
      </div>

      <div className="wbs-import-dropzone">
        <input ref={inputRef} id="wbs-import-file" type="file" accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" onChange={readFile} disabled={stage === "validating" || stage === "committing" || stage === "complete"} />
        <label htmlFor="wbs-import-file">
          <strong>{text("Select CSV or XLSX", "اختر CSV أو XLSX")}</strong>
          <span>{text("Maximum 8 MB / 5,000 WBS rows. The first worksheet is used.", "الحد الأقصى 8 ميغابايت / 5,000 صف لهيكل العمل. تستخدم ورقة العمل الأولى.")}</span>
        </label>
        {sourceName ? <code>{sourceName}</code> : null}
      </div>

      {notice ? <div className={`wbs-import-notice ${issues.length || localProblems.length ? "notice-warning" : ""}`}>{notice}</div> : null}

      {localProblems.length ? (
        <section className="wbs-import-issues" aria-live="polite">
          <div className="wbs-import-section-heading">
            <div>
              <p className="eyebrow">{text("File-format review", "مراجعة تنسيق الملف")}</p>
              <h3>{text("Correct these rows before validation", "صحح هذه الصفوف قبل التحقق")}</h3>
            </div>
            <button className="button button-secondary" type="button" onClick={exportProblems}>{text("Export errors", "تصدير الأخطاء")}</button>
          </div>
          <ul>
            {localProblems.map((problem, index) => <li key={`${problem.rowNumber}-${problem.field}-${index}`}><strong>{problem.rowNumber ? `${text("Row", "الصف")} ${problem.rowNumber}` : text("File", "الملف")}</strong><span>{problem.message}</span></li>)}
          </ul>
        </section>
      ) : null}

      {rows.length && !localProblems.length && !preview ? (
        <section className="wbs-import-ready">
          <div>
            <strong>{rows.length}</strong>
            <span>{text("parsed WBS rows ready for tenant-scoped validation", "صفاً من هيكل العمل جاهز للتحقق المقيد بالمستأجر")}</span>
          </div>
          <button className="button button-primary" type="button" onClick={validateImport} disabled={!canValidate}>
            {stage === "validating" ? text("Validating…", "جارٍ التحقق…") : text("Run validation", "تشغيل التحقق")}
          </button>
        </section>
      ) : null}

      {preview ? (
        <>
          <section className="wbs-import-summary" aria-label={text("Validation summary", "ملخص التحقق")}>
            <div><span>{text("Rows received", "الصفوف المستلمة")}</span><strong>{preview.summary.receivedRows}</strong></div>
            <div><span>{text("Ready", "جاهز")}</span><strong>{preview.summary.validRows}</strong></div>
            <div className={preview.summary.invalidRows ? "is-problem" : ""}><span>{text("Issues", "المشكلات")}</span><strong>{preview.summary.invalidRows}</strong></div>
            <div><span>{text("Root packages", "حزم رئيسية")}</span><strong>{preview.summary.rootRows}</strong></div>
            <div><span>{text("Parent links", "روابط الحزمة الرئيسية")}</span><strong>{preview.summary.existingParentLinks + preview.summary.importedParentLinks}</strong></div>
          </section>

          {issues.length ? (
            <section className="wbs-import-issues" aria-live="polite">
              <div className="wbs-import-section-heading">
                <div>
                  <p className="eyebrow">{text("Dry-run findings", "نتائج التحقق التجريبي")}</p>
                  <h3>{text("Commit is blocked until these issues are corrected", "يُمنع الاعتماد حتى تصحيح هذه المشكلات")}</h3>
                </div>
                <button className="button button-secondary" type="button" onClick={exportProblems}>{text("Export errors", "تصدير الأخطاء")}</button>
              </div>
              <ul>
                {issues.map((issue, index) => <li key={`${issue.rowNumber}-${issue.reasonCode}-${index}`}><strong>{text("Row", "الصف")} {issue.rowNumber} · {issue.code}</strong><span>{rowIssueMessage(issue, arabic)}</span></li>)}
              </ul>
            </section>
          ) : null}

          <section className="wbs-import-preview">
            <div className="wbs-import-section-heading">
              <div>
                <p className="eyebrow">{text("Hierarchy preview", "معاينة الهيكل")}</p>
                <h3>{text("Reviewed WBS hierarchy", "هيكل العمل المُراجع")}</h3>
              </div>
              <span>{text("Target", "الهدف")}: <strong>{selectedProject?.code}</strong></span>
            </div>
            <div className="wbs-import-table-wrap">
              <table>
                <thead><tr><th>{text("Row", "الصف")}</th><th>{text("Code / package", "الرمز / الحزمة")}</th><th>{text("Parent", "الرئيسية")}</th><th>{text("Plan dates", "تواريخ الخطة")}</th><th>{text("Weight", "الوزن")}</th></tr></thead>
                <tbody>
                  {orderedPreviewRows.map((row) => (
                    <tr key={row.rowNumber}>
                      <td>{row.rowNumber}</td>
                      <td><div className="wbs-preview-node" style={{ paddingInlineStart: `${row.depth * 1.1}rem` }}><code>{row.code}</code><span>{row.name}</span></div></td>
                      <td>{row.parentCode ? <><code>{row.parentCode}</code><small>{row.parentSource === "existing" ? text("Existing", "موجود") : text("Imported", "مستورد")}</small></> : text("Root", "رئيسية")}</td>
                      <td>{row.plannedFrom || "—"} <span aria-hidden="true">→</span> {row.plannedTo || "—"}</td>
                      <td>{row.weight || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <footer className="wbs-import-commit-bar">
            <div>
              <strong>{preview.canCommit ? text("Ready for governed commit", "جاهز للاعتماد المحكوم") : text("Commit remains blocked", "يبقى الاعتماد محظوراً")}</strong>
              <span>{preview.canCommit ? text("This action will create the displayed WBS nodes atomically and record one batch audit event.", "سينشئ هذا الإجراء عقد هيكل العمل المعروضة بصورة ذرية ويسجل حدث تدقيق واحداً للاستيراد.") : text("No WBS record will be created until the source is corrected and validation passes.", "لن يتم إنشاء أي سجل لهيكل العمل حتى تصحيح المصدر ونجاح التحقق.")}</span>
            </div>
            <div>
              <button className="button button-secondary" type="button" onClick={resetImport} disabled={stage === "committing"}>{text("Start over", "البدء من جديد")}</button>
              <button className="button button-primary" type="button" onClick={commitImport} disabled={!preview.canCommit || stage === "committing" || stage === "complete"}>{stage === "committing" ? text("Committing…", "جارٍ الاعتماد…") : text("Commit validated WBS", "اعتماد هيكل العمل المتحقق منه")}</button>
            </div>
          </footer>
        </>
      ) : null}

      {receipt ? <div className="success-banner">{text(`Import receipt: ${receipt.createdCount} WBS nodes committed.`, `إيصال الاستيراد: تم اعتماد ${receipt.createdCount} من عقد هيكل العمل.`)}</div> : null}
    </section>
  );
}
