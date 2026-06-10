-- Run this to fix the "Invalid Password" error for admin@houndheart.com
UPDATE Users 
SET PasswordHash = '$2a$11$H9BSrvxpDjXDhQ.JGBZpQOf./9Qd7KKhLH4Is6Zw4M7t4.OBAI/We' 
WHERE Email = 'admin@houndheart.com';

PRINT '✅ Admin password updated to "Admin@123"';
