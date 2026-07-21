export const tenantMessages = {
  en: {
    "tenant.login.subtitle": "Your organization is resolved securely from this workspace address. Enter only your email and password.",
    "tenant.login.organization": "Signing in to",
    "tenant.login.failed": "Organization could not be resolved",
    "tenant.login.failedHelp": "Check the workspace subdomain. For local development, use the documented ?tenant=CODE override.",
    "tenant.login.credentialsHelp": "Check the email and password assigned by your organization, then try again.",
  },
  ar: {
    "tenant.login.subtitle": "يتم تحديد مؤسستك بأمان من عنوان مساحة العمل. أدخل البريد الإلكتروني وكلمة المرور فقط.",
    "tenant.login.organization": "تسجيل الدخول إلى",
    "tenant.login.failed": "تعذر تحديد المؤسسة",
    "tenant.login.failedHelp": "تحقق من النطاق الفرعي لمساحة العمل. للتطوير المحلي استخدم ‎?tenant=CODE‎ كما هو موضح في التوثيق.",
    "tenant.login.credentialsHelp": "تحقق من البريد الإلكتروني وكلمة المرور المخصصين من مؤسستك ثم أعد المحاولة.",
  },
} as const;

export type TenantMessageKey = keyof typeof tenantMessages.en;
