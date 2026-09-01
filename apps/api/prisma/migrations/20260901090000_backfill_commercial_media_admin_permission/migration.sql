-- Existing production tenants predate the governed commercial media library.
-- Backfill the permission and grant it to every tenant administrator so that
-- deployments do not depend on rerunning the bootstrap seed.
INSERT INTO "Permission" ("id", "code", "name")
VALUES (
  'permission-commercial-media-manage',
  'commercial:media:manage',
  'Commercial Media Manage'
)
ON CONFLICT ("code") DO UPDATE SET "name" = EXCLUDED."name";

INSERT INTO "RolePermission" ("roleId", "permissionId")
SELECT role."id", permission."id"
FROM "Role" AS role
CROSS JOIN "Permission" AS permission
WHERE role."code" = 'ADMIN'
  AND permission."code" = 'commercial:media:manage'
ON CONFLICT ("roleId", "permissionId") DO NOTHING;
