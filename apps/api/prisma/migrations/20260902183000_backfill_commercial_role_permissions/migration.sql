-- Existing tenants can predate the complete commercial workflow permission set.
-- Reconcile role grants forward-only without reseeding users or replacing data.
WITH required_permissions(code, name) AS (
  VALUES
    ('commercial:read', 'Commercial Read'),
    ('commercial:manage', 'Commercial Manage'),
    ('commercial:status', 'Commercial Status'),
    ('commercial:price:view-published', 'Commercial Price View Published'),
    ('commercial:price:view-draft', 'Commercial Price View Draft'),
    ('commercial:price:create-draft', 'Commercial Price Create Draft'),
    ('commercial:price:publish', 'Commercial Price Publish'),
    ('commercial:payment-plan:view', 'Commercial Payment Plan View'),
    ('commercial:payment-plan:manage', 'Commercial Payment Plan Manage'),
    ('commercial:customer:create', 'Commercial Customer Create'),
    ('commercial:customer:view', 'Commercial Customer View'),
    ('commercial:lead:create', 'Commercial Lead Create'),
    ('commercial:lead:view-own', 'Commercial Lead View Own'),
    ('commercial:lead:view-all', 'Commercial Lead View All'),
    ('commercial:lead:qualify', 'Commercial Lead Qualify'),
    ('commercial:lead:disqualify', 'Commercial Lead Disqualify'),
    ('commercial:lead:reassign', 'Commercial Lead Reassign'),
    ('commercial:activity:view', 'Commercial Activity View'),
    ('commercial:activity:log', 'Commercial Activity Log'),
    ('commercial:hold:create', 'Commercial Hold Create'),
    ('commercial:hold:release', 'Commercial Hold Release'),
    ('commercial:reservation:confirm', 'Commercial Reservation Confirm'),
    ('commercial:task:view', 'Commercial Task View'),
    ('commercial:task:manage', 'Commercial Task Manage'),
    ('commercial:dispatch:create', 'Commercial Dispatch Create'),
    ('commercial:media:view', 'Commercial Media View'),
    ('commercial:media:manage', 'Commercial Media Manage'),
    ('commercial:transfer:view', 'Commercial Transfer View'),
    ('commercial:transfer:upload', 'Commercial Transfer Upload'),
    ('commercial:transfer:review', 'Commercial Transfer Review')
)
INSERT INTO "Permission" ("id", "code", "name")
SELECT 'permission-' || replace(permission.code, ':', '-'), permission.code, permission.name
FROM required_permissions AS permission
ON CONFLICT ("code") DO UPDATE SET "name" = EXCLUDED."name";

-- Tenant administrators receive every governed commercial permission.
INSERT INTO "RolePermission" ("roleId", "permissionId")
SELECT role."id", permission."id"
FROM "Role" AS role
CROSS JOIN "Permission" AS permission
WHERE role."code" = 'ADMIN'
  AND permission."code" LIKE 'commercial:%'
ON CONFLICT ("roleId", "permissionId") DO NOTHING;

-- Sales agents receive the operational subset defined by the bootstrap role matrix.
INSERT INTO "RolePermission" ("roleId", "permissionId")
SELECT role."id", permission."id"
FROM "Role" AS role
CROSS JOIN "Permission" AS permission
WHERE role."code" = 'SALES_AGENT'
  AND permission."code" IN (
    'commercial:read',
    'commercial:price:view-published',
    'commercial:payment-plan:view',
    'commercial:customer:create',
    'commercial:customer:view',
    'commercial:lead:create',
    'commercial:lead:view-own',
    'commercial:lead:qualify',
    'commercial:lead:disqualify',
    'commercial:activity:view',
    'commercial:activity:log',
    'commercial:hold:create',
    'commercial:hold:release',
    'commercial:task:view',
    'commercial:dispatch:create',
    'commercial:media:view',
    'commercial:transfer:view',
    'commercial:transfer:upload'
  )
ON CONFLICT ("roleId", "permissionId") DO NOTHING;

-- Sales managers inherit the agent workflow and add supervisory capabilities.
INSERT INTO "RolePermission" ("roleId", "permissionId")
SELECT role."id", permission."id"
FROM "Role" AS role
CROSS JOIN "Permission" AS permission
WHERE role."code" = 'SALES_MANAGER'
  AND permission."code" IN (
    'commercial:read',
    'commercial:price:view-published',
    'commercial:payment-plan:view',
    'commercial:customer:create',
    'commercial:customer:view',
    'commercial:lead:create',
    'commercial:lead:view-own',
    'commercial:lead:view-all',
    'commercial:lead:qualify',
    'commercial:lead:disqualify',
    'commercial:lead:reassign',
    'commercial:activity:view',
    'commercial:activity:log',
    'commercial:hold:create',
    'commercial:hold:release',
    'commercial:reservation:confirm',
    'commercial:task:view',
    'commercial:task:manage',
    'commercial:dispatch:create',
    'commercial:media:view',
    'commercial:transfer:view',
    'commercial:transfer:upload',
    'commercial:transfer:review'
  )
ON CONFLICT ("roleId", "permissionId") DO NOTHING;
