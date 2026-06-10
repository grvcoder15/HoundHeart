-- =============================================
-- Admin Setup Script for HoundHeart (PostgreSQL)
-- =============================================
-- Password: Admin@123
-- BCrypt Hash: $2a$11$H9BSrvxpDjXDhQ.JGBZpQOf./9Qd7KKhLH4Is6Zw4M7t4.OBAI/We

-- 1. Ensure Admin Role exists (Id = 1)
INSERT INTO "Roles" ("Id", "RoleName", "CreatedOn", "UpdatedOn")
VALUES (1, 'Admin', NOW(), NOW())
ON CONFLICT ("Id") DO NOTHING;

-- 2. Create Admin User (if not exists)
INSERT INTO "Users" (
    "UserId",
    "FullName",
    "Email",
    "PasswordHash",
    "RoleId",
    "CreatedOn",
    "UpdatedOn",
    "IsActive",
    "IsDeleted",
    "IsTermAccepted",
    "IsGoogleSignIn",
    "IsProfileSetupCompleted"
)
VALUES (
    gen_random_uuid(),
    'System Administrator',
    'admin@houndheart.com',
    '$2a$11$H9BSrvxpDjXDhQ.JGBZpQOf./9Qd7KKhLH4Is6Zw4M7t4.OBAI/We',
    1,
    NOW(),
    NOW(),
    true,
    false,
    true,
    false,
    true
)
ON CONFLICT ("Email") DO NOTHING;

-- Verify admin user created
SELECT "UserId", "Email", "RoleId", "IsActive" FROM "Users" WHERE "Email" = 'admin@houndheart.com';
