-- PostgreSQL table for landing-page pre-registrations
CREATE TABLE IF NOT EXISTS "PreRegistrations" (
    "PreRegistrationId" uuid PRIMARY KEY,
    "FullName" varchar(150) NOT NULL,
    "Email" varchar(150) NOT NULL,
    "PhoneNumber" varchar(30) NOT NULL,
    "AddressLine1" varchar(200) NOT NULL,
    "AddressLine2" varchar(200) NULL,
    "City" varchar(100) NOT NULL,
    "StateProvince" varchar(100) NOT NULL,
    "PostalCode" varchar(20) NOT NULL,
    "Country" varchar(100) NOT NULL,
    "Address" varchar(600) NOT NULL,
    "ConsentGiven" boolean NOT NULL DEFAULT false,
    "Source" varchar(50) NOT NULL DEFAULT 'LandingPage',
    "IsLaunchInviteSent" boolean NOT NULL DEFAULT false,
    "InviteSentOn" timestamp without time zone NULL,
    "CreatedOn" timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "UpdatedOn" timestamp without time zone NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "IX_PreRegistrations_Email"
ON "PreRegistrations" (LOWER("Email"));

ALTER TABLE "PreRegistrations" ADD COLUMN IF NOT EXISTS "AddressLine1" varchar(200);
ALTER TABLE "PreRegistrations" ADD COLUMN IF NOT EXISTS "AddressLine2" varchar(200);
ALTER TABLE "PreRegistrations" ADD COLUMN IF NOT EXISTS "City" varchar(100);
ALTER TABLE "PreRegistrations" ADD COLUMN IF NOT EXISTS "StateProvince" varchar(100);
ALTER TABLE "PreRegistrations" ADD COLUMN IF NOT EXISTS "PostalCode" varchar(20);
ALTER TABLE "PreRegistrations" ADD COLUMN IF NOT EXISTS "Country" varchar(100);

UPDATE "PreRegistrations"
SET
    "AddressLine1" = COALESCE(NULLIF("AddressLine1", ''), 'Unknown'),
    "City" = COALESCE(NULLIF("City", ''), 'Unknown'),
    "StateProvince" = COALESCE(NULLIF("StateProvince", ''), 'Unknown'),
    "PostalCode" = COALESCE(NULLIF("PostalCode", ''), '000000'),
    "Country" = COALESCE(NULLIF("Country", ''), 'Unknown')
WHERE
    "AddressLine1" IS NULL OR
    "City" IS NULL OR
    "StateProvince" IS NULL OR
    "PostalCode" IS NULL OR
    "Country" IS NULL;

ALTER TABLE "PreRegistrations" ALTER COLUMN "AddressLine1" SET NOT NULL;
ALTER TABLE "PreRegistrations" ALTER COLUMN "City" SET NOT NULL;
ALTER TABLE "PreRegistrations" ALTER COLUMN "StateProvince" SET NOT NULL;
ALTER TABLE "PreRegistrations" ALTER COLUMN "PostalCode" SET NOT NULL;
ALTER TABLE "PreRegistrations" ALTER COLUMN "Country" SET NOT NULL;
