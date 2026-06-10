-- =============================================
-- Admin Setup Script for HoundHeart
-- =============================================

-- 1. Ensure Admin Role exists (Id = 1)
IF NOT EXISTS (SELECT 1 FROM Roles WHERE Id = 1)
BEGIN
    SET IDENTITY_INSERT Roles ON;
    INSERT INTO Roles (Id, RoleName, CreatedOn, UpdatedOn)
    VALUES (1, 'Admin', GETUTCDATE(), GETUTCDATE());
    SET IDENTITY_INSERT Roles OFF;
    PRINT '✅ Admin Role created.';
END
ELSE
BEGIN
    PRINT 'ℹ️ Admin Role already exists.';
END

-- 2. Create Admin User (if not exists)
-- NOTE: Default Password is "Admin@123"
-- The hash below is generated using BCrypt (compatible with your backend)
DECLARE @AdminEmail NVARCHAR(150) = 'admin@houndheart.com';

IF NOT EXISTS (SELECT 1 FROM Users WHERE Email = @AdminEmail)
BEGIN
    INSERT INTO Users (
        UserId, 
        FullName, 
        Email, 
        PasswordHash, 
        RoleId, 
        CreatedOn, 
        UpdatedOn, 
        IsActive, 
        IsDeleted, 
        IsTermAccepted, 
        IsGoogleSignIn, 
        IsProfileSetupCompleted
    )
    VALUES (
        NEWID(), 
        'System Administrator', 
        @AdminEmail, 
        '$2a$11$H9BSrvxpDjXDhQ.JGBZpQOf./9Qd7KKhLH4Is6Zw4M7t4.OBAI/We', -- Hashed "Admin@123"
        1, 
        GETUTCDATE(), 
        GETUTCDATE(), 
        1, -- IsActive
        0, -- IsDeleted
        1, -- IsTermAccepted
        0, -- IsGoogleSignIn
        1  -- IsProfileSetupCompleted
    );
    PRINT '✅ Admin User created (Email: admin@houndheart.com, Pass: Admin@123).';
END
ELSE
BEGIN
    -- If user exists but is not an admin, update their role
    UPDATE Users SET RoleId = 1 WHERE Email = @AdminEmail AND RoleId != 1;
    PRINT 'ℹ️ Admin User already exists (Role updated if necessary).';
END
