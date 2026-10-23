-- Simplify Role enum to ADMIN and USER only
DROP TYPE IF EXISTS "Role_new";
CREATE TYPE "Role_new" AS ENUM ('ADMIN', 'USER');

DELETE FROM "RolePermission";
DELETE FROM "UserRole";

ALTER TABLE "User"
  ALTER COLUMN "role" DROP DEFAULT,
  ALTER COLUMN "role" TYPE "Role_new"
  USING (
    CASE
      WHEN "role"::text = 'ADMIN' THEN 'ADMIN'::"Role_new"
      ELSE 'USER'::"Role_new"
    END
  ),
  ALTER COLUMN "role" SET DEFAULT 'USER';

ALTER TABLE "UserRole"
  ALTER COLUMN "name" TYPE "Role_new"
  USING (
    CASE
      WHEN "name"::text = 'ADMIN' THEN 'ADMIN'::"Role_new"
      ELSE 'USER'::"Role_new"
    END
  );

DROP TYPE "Role";
ALTER TYPE "Role_new" RENAME TO "Role";

ALTER TABLE "ActivityMember" ALTER COLUMN "role" SET DEFAULT 'Anggota Humas';