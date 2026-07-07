CREATE TABLE IF NOT EXISTS "__EFMigrationsHistory" (
    "MigrationId" character varying(150) NOT NULL,
    "ProductVersion" character varying(32) NOT NULL,
    CONSTRAINT "PK___EFMigrationsHistory" PRIMARY KEY ("MigrationId")
);

START TRANSACTION;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260602074647_InitialPostgres') THEN
    CREATE TABLE "BondingActivities" (
        "ActivityId" uuid NOT NULL,
        "ActivityName" text NOT NULL,
        "Points" integer NOT NULL,
        "Category" text NOT NULL,
        "InteractionType" text NOT NULL,
        CONSTRAINT "PK_BondingActivities" PRIMARY KEY ("ActivityId")
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260602074647_InitialPostgres') THEN
    CREATE TABLE "BreathingPatterns" (
        "Id" uuid NOT NULL,
        "Name" character varying(100) NOT NULL,
        "Description" character varying(250) NOT NULL,
        "InhaleDuration" integer NOT NULL,
        "ExhaleDuration" integer NOT NULL,
        "HoldDuration" integer NOT NULL,
        "HoldAfterExhaleDuration" integer NOT NULL,
        "IsActive" boolean NOT NULL,
        "IsDeleted" boolean NOT NULL,
        "CreatedOn" timestamp with time zone NOT NULL,
        "UpdatedOn" timestamp with time zone,
        CONSTRAINT "PK_BreathingPatterns" PRIMARY KEY ("Id")
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260602074647_InitialPostgres') THEN
    CREATE TABLE "ChakraLogs" (
        "Id" uuid NOT NULL,
        "UserId" uuid NOT NULL,
        "PetId" uuid,
        "RootScore" integer NOT NULL,
        "SacralScore" integer NOT NULL,
        "SolarPlexusScore" integer NOT NULL,
        "HeartScore" integer NOT NULL,
        "ThroatScore" integer NOT NULL,
        "ThirdEyeScore" integer NOT NULL,
        "CrownScore" integer NOT NULL,
        "HarmonyScore" real,
        "DominantBlockage" text,
        "CreatedAt" timestamp with time zone NOT NULL,
        "LogDate" timestamp with time zone,
        CONSTRAINT "PK_ChakraLogs" PRIMARY KEY ("Id")
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260602074647_InitialPostgres') THEN
    CREATE TABLE "ChakraRitualProgresses" (
        "Id" uuid NOT NULL,
        "UserId" uuid NOT NULL,
        "ChakraId" uuid NOT NULL,
        "LastPlayedPosition" numeric,
        "TotalDuration" numeric,
        "IsCompleted" boolean,
        "LastPlayedDate" timestamp with time zone,
        "CreatedAt" timestamp with time zone,
        "UpdatedAt" timestamp with time zone,
        "IsPaused" boolean,
        CONSTRAINT "PK_ChakraRitualProgresses" PRIMARY KEY ("Id")
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260602074647_InitialPostgres') THEN
    CREATE TABLE "Chakras" (
        "ChakraId" uuid NOT NULL,
        "ChakraName" character varying(100) NOT NULL,
        "AudioUrl" character varying(500),
        "IsActive" boolean NOT NULL,
        "IsDeleted" boolean NOT NULL,
        "CreatedOn" timestamp with time zone NOT NULL,
        "UpdatedOn" timestamp with time zone,
        CONSTRAINT "PK_Chakras" PRIMARY KEY ("ChakraId")
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260602074647_InitialPostgres') THEN
    CREATE TABLE "CheckIns" (
        "CheckInId" uuid NOT NULL,
        "Questions" character varying(500) NOT NULL,
        "Rating" integer,
        "LowEnergyLabel" character varying(150),
        "HighEnergyLabel" character varying(150),
        "IsDeleted" boolean NOT NULL,
        "CreatedOn" timestamp with time zone NOT NULL,
        "UpdatedOn" timestamp with time zone,
        CONSTRAINT "PK_CheckIns" PRIMARY KEY ("CheckInId")
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260602074647_InitialPostgres') THEN
    CREATE TABLE "CommunityDiscussions" (
        "Id" uuid NOT NULL,
        "Title" character varying(255) NOT NULL,
        "AuthorName" character varying(150) NOT NULL,
        "RepliesCount" integer NOT NULL,
        "IsPinned" boolean NOT NULL,
        "LastActive" text NOT NULL,
        "CreatedOn" timestamp with time zone NOT NULL,
        CONSTRAINT "PK_CommunityDiscussions" PRIMARY KEY ("Id")
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260602074647_InitialPostgres') THEN
    CREATE TABLE "DeviceConnections" (
        "Id" uuid NOT NULL,
        "UserId" uuid NOT NULL,
        "DogId" uuid,
        "DeviceType" character varying(50) NOT NULL,
        "DeviceModel" character varying(100),
        "DeviceNumber" character varying(100) NOT NULL,
        "IsConnected" boolean NOT NULL,
        "ConnectedAt" timestamp with time zone,
        "DisconnectedAt" timestamp with time zone,
        "CreatedAt" timestamp with time zone NOT NULL,
        CONSTRAINT "PK_DeviceConnections" PRIMARY KEY ("Id")
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260602074647_InitialPostgres') THEN
    CREATE TABLE "DogBaselines" (
        "Id" uuid NOT NULL,
        "DogId" uuid NOT NULL,
        "AvgHeartRate" double precision,
        "AvgActivityScore" double precision NOT NULL,
        "AvgTemperature" double precision,
        "AvgRestScore" double precision NOT NULL,
        "AvgRespirationRate" double precision,
        "LastUpdatedUtc" timestamp with time zone NOT NULL,
        "DaysOfDataCollected" integer NOT NULL,
        "DogBaselineEstablished" boolean NOT NULL,
        CONSTRAINT "PK_DogBaselines" PRIMARY KEY ("Id")
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260602074647_InitialPostgres') THEN
    CREATE TABLE "DogProfiles" (
        "Id" uuid NOT NULL,
        "UserId" uuid NOT NULL,
        "Name" character varying(100) NOT NULL,
        "Breed" character varying(100),
        "Age" integer,
        "Weight" numeric(5,2),
        "CreatedAt" timestamp with time zone NOT NULL,
        "UpdatedAt" timestamp with time zone,
        "BaselineStartTime" timestamp with time zone,
        "DogBaselineEstablished" boolean NOT NULL,
        CONSTRAINT "PK_DogProfiles" PRIMARY KEY ("Id")
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260602074647_InitialPostgres') THEN
    CREATE TABLE "DogSpiritualTraits" (
        "TraitId" uuid NOT NULL,
        "TraitName" character varying(100) NOT NULL,
        "Description" character varying(500),
        "IsActive" boolean NOT NULL,
        "IsDeleted" boolean NOT NULL,
        "CreatedAt" timestamp with time zone NOT NULL,
        CONSTRAINT "PK_DogSpiritualTraits" PRIMARY KEY ("TraitId")
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260602074647_InitialPostgres') THEN
    CREATE TABLE "DogVitals" (
        "Id" uuid NOT NULL,
        "DogId" uuid NOT NULL,
        "HeartRate" integer,
        "ActivityScore" integer NOT NULL,
        "Temperature" double precision,
        "RestScore" integer NOT NULL,
        "RespirationRate" double precision,
        "Latitude" double precision,
        "Longitude" double precision,
        "State" character varying(50) NOT NULL,
        "Source" character varying(50) NOT NULL,
        "ActivityValue" integer,
        "MinPlay" integer,
        "MinActive" integer,
        "MinRest" integer,
        "NapTime" integer,
        "TimestampUtc" timestamp with time zone NOT NULL,
        CONSTRAINT "PK_DogVitals" PRIMARY KEY ("Id")
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260602074647_InitialPostgres') THEN
    CREATE TABLE "ExpertQueryCategories" (
        "Id" uuid NOT NULL,
        "Name" character varying(100) NOT NULL,
        "Description" character varying(255),
        "IsActive" boolean NOT NULL,
        "DisplayOrder" integer NOT NULL,
        "CreatedOn" timestamp with time zone NOT NULL,
        CONSTRAINT "PK_ExpertQueryCategories" PRIMARY KEY ("Id")
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260602074647_InitialPostgres') THEN
    CREATE TABLE "FAQs" (
        "FAQId" uuid NOT NULL,
        "Question" character varying(500) NOT NULL,
        "Answer" text NOT NULL,
        "Category" character varying(100) NOT NULL,
        "Status" character varying(50) NOT NULL,
        "DisplayOrder" integer NOT NULL,
        "CreatedAt" timestamp with time zone NOT NULL,
        "UpdatedAt" timestamp with time zone,
        "IsDeleted" boolean NOT NULL,
        CONSTRAINT "PK_FAQs" PRIMARY KEY ("FAQId")
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260602074647_InitialPostgres') THEN
    CREATE TABLE "FitBarkActivityLogs" (
        "Id" uuid NOT NULL,
        "DogSlug" text NOT NULL,
        "ActivityDate" timestamp with time zone NOT NULL,
        "ActivityValue" integer NOT NULL,
        "MinPlay" integer NOT NULL,
        "MinActive" integer NOT NULL,
        "MinRest" integer NOT NULL,
        "NapTime" integer NOT NULL,
        "FetchedAt" timestamp with time zone NOT NULL,
        CONSTRAINT "PK_FitBarkActivityLogs" PRIMARY KEY ("Id")
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260602074647_InitialPostgres') THEN
    CREATE TABLE "FitBarkDogs" (
        "Id" uuid NOT NULL,
        "Name" character varying(100) NOT NULL,
        "DogSlug" character varying(100) NOT NULL,
        "Breed" character varying(100),
        "BirthDate" text,
        "Weight" double precision,
        "Gender" character varying(20),
        "ActivityGoal" integer,
        "Country" character varying(50),
        "Zip" character varying(20),
        "CreatedAt" timestamp with time zone NOT NULL,
        "UpdatedAt" timestamp with time zone NOT NULL,
        CONSTRAINT "PK_FitBarkDogs" PRIMARY KEY ("Id")
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260602074647_InitialPostgres') THEN
    CREATE TABLE "GuidedPractices" (
        "Id" uuid NOT NULL,
        "Name" text NOT NULL,
        "Description" text NOT NULL,
        "AudioUrl" text,
        CONSTRAINT "PK_GuidedPractices" PRIMARY KEY ("Id")
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260602074647_InitialPostgres') THEN
    CREATE TABLE "HealingCircles" (
        "Id" uuid NOT NULL,
        "Title" character varying(200) NOT NULL,
        "Time" character varying(100) NOT NULL,
        "Description" character varying(1000) NOT NULL,
        "ParticipantsCount" integer NOT NULL,
        "MaxParticipants" integer NOT NULL,
        "IsPremium" boolean NOT NULL,
        "CreatedOn" timestamp with time zone NOT NULL,
        CONSTRAINT "PK_HealingCircles" PRIMARY KEY ("Id")
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260602074647_InitialPostgres') THEN
    CREATE TABLE "HumanProfiles" (
        "Id" uuid NOT NULL,
        "UserId" uuid NOT NULL,
        "Name" character varying(100),
        "Age" integer,
        "CreatedAt" timestamp with time zone NOT NULL,
        "UpdatedAt" timestamp with time zone,
        "BaselineStartTime" timestamp with time zone,
        "HumanBaselineEstablished" boolean NOT NULL,
        "PhoneNumber" character varying(20),
        CONSTRAINT "PK_HumanProfiles" PRIMARY KEY ("Id")
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260602074647_InitialPostgres') THEN
    CREATE TABLE "HumanVitals" (
        "Id" uuid NOT NULL,
        "UserId" uuid NOT NULL,
        "HeartRate" integer,
        "HRV" double precision,
        "Steps" integer,
        "Calories" double precision NOT NULL,
        "Distance" double precision,
        "ActiveMinutes" integer,
        "SleepMinutes" integer,
        "DeepSleepMinutes" integer,
        "RemSleepMinutes" integer,
        "LightSleepMinutes" integer,
        "AwakeSleepMinutes" integer,
        "StressScore" integer,
        "Latitude" double precision,
        "Longitude" double precision,
        "Source" character varying(50),
        "TimestampUtc" timestamp with time zone NOT NULL,
        "AmbientTemperature" double precision,
        "WeatherCondition" character varying(100),
        "WeatherLocation" character varying(200),
        CONSTRAINT "PK_HumanVitals" PRIMARY KEY ("Id")
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260602074647_InitialPostgres') THEN
    CREATE TABLE "JournalEntries" (
        "EntryId" uuid NOT NULL,
        "UserId" uuid NOT NULL,
        "EntryType" text NOT NULL,
        "Content" text,
        "Tags" text,
        "CreatedOn" timestamp with time zone NOT NULL,
        "UpdatedOn" timestamp with time zone,
        "IsDeleted" boolean NOT NULL,
        "IsArchive" boolean,
        "LettrTo" text,
        "MediaType" text,
        "MediaUrl" text,
        "ImageUrl" text,
        CONSTRAINT "PK_JournalEntries" PRIMARY KEY ("EntryId")
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260602074647_InitialPostgres') THEN
    CREATE TABLE "MessageLogs" (
        "Id" uuid NOT NULL,
        "UserId" uuid NOT NULL,
        "MessageType" character varying(50) NOT NULL,
        "Channel" character varying(20) NOT NULL,
        "RecipientContact" character varying(100) NOT NULL,
        "Title" character varying(200),
        "Body" character varying(1000) NOT NULL,
        "Status" character varying(20) NOT NULL,
        "ErrorMessage" character varying(500),
        "RelatedAlertId" uuid,
        "SentAt" timestamp with time zone NOT NULL,
        "DeliveredAt" timestamp with time zone,
        CONSTRAINT "PK_MessageLogs" PRIMARY KEY ("Id")
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260602074647_InitialPostgres') THEN
    CREATE TABLE "NotificationLogs" (
        "Id" uuid NOT NULL,
        "UserId" uuid NOT NULL,
        "Title" text NOT NULL,
        "Message" text NOT NULL,
        "SentAt" timestamp with time zone NOT NULL,
        "IsRead" boolean NOT NULL,
        "IsDelivered" boolean NOT NULL,
        "Type" text NOT NULL,
        CONSTRAINT "PK_NotificationLogs" PRIMARY KEY ("Id")
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260602074647_InitialPostgres') THEN
    CREATE TABLE "Rituals" (
        "Id" uuid NOT NULL,
        "Title" character varying(100) NOT NULL,
        "Description" character varying(500) NOT NULL,
        "Duration" character varying(50) NOT NULL,
        "Category" character varying(50) NOT NULL,
        "IconType" character varying(50) NOT NULL,
        CONSTRAINT "PK_Rituals" PRIMARY KEY ("Id")
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260602074647_InitialPostgres') THEN
    CREATE TABLE "Roles" (
        "Id" integer GENERATED BY DEFAULT AS IDENTITY,
        "RoleName" character varying(50) NOT NULL,
        "CreatedOn" timestamp with time zone NOT NULL,
        "UpdatedOn" timestamp with time zone NOT NULL,
        CONSTRAINT "PK_Roles" PRIMARY KEY ("Id")
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260602074647_InitialPostgres') THEN
    CREATE TABLE "SacredGuidePurchase" (
        "PurchaseId" uuid NOT NULL,
        "SacredGuideId" uuid NOT NULL,
        "UserId" uuid NOT NULL,
        "AmountPaid" numeric(10,2) NOT NULL,
        "PurchasedOn" timestamp with time zone NOT NULL,
        "PaymentStatus" character varying(50) NOT NULL,
        CONSTRAINT "PK_SacredGuidePurchase" PRIMARY KEY ("PurchaseId")
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260602074647_InitialPostgres') THEN
    CREATE TABLE "SacredGuides" (
        "SacredGuideId" uuid NOT NULL,
        "Title" character varying(300),
        "Description" character varying(2000),
        "PdfUrl" character varying(500),
        "Price" numeric(10,2) NOT NULL,
        "Status" character varying(50) NOT NULL,
        "TotalPages" integer,
        "Chapters" text,
        "Distribution" character varying(100),
        "PreviewPercentage" integer NOT NULL,
        "AllowFreeUserDownload" boolean NOT NULL,
        "RequiresPremium" boolean NOT NULL,
        "CreatedOn" timestamp with time zone NOT NULL,
        "UpdatedOn" timestamp with time zone,
        "IsActive" boolean NOT NULL,
        CONSTRAINT "PK_SacredGuides" PRIMARY KEY ("SacredGuideId")
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260602074647_InitialPostgres') THEN
    CREATE TABLE "Scores" (
        "Id" uuid NOT NULL,
        "Name" text NOT NULL,
        "Points" integer NOT NULL,
        "CreatedAt" timestamp with time zone NOT NULL,
        CONSTRAINT "PK_Scores" PRIMARY KEY ("Id")
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260602074647_InitialPostgres') THEN
    CREATE TABLE "ScoringRules" (
        "Id" uuid NOT NULL,
        "RuleName" character varying(100) NOT NULL,
        "Points" numeric NOT NULL,
        "Description" character varying(500),
        "CreatedAt" timestamp with time zone NOT NULL,
        CONSTRAINT "PK_ScoringRules" PRIMARY KEY ("Id")
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260602074647_InitialPostgres') THEN
    CREATE TABLE "SiteSettings" (
        "SettingKey" character varying(100) NOT NULL,
        "SettingValue" text NOT NULL,
        CONSTRAINT "PK_SiteSettings" PRIMARY KEY ("SettingKey")
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260602074647_InitialPostgres') THEN
    CREATE TABLE "StressEvents" (
        "Id" uuid NOT NULL,
        "UserId" uuid NOT NULL,
        "TimestampUtc" timestamp with time zone NOT NULL,
        "HRVAtEvent" double precision NOT NULL,
        "HRAtEvent" integer NOT NULL,
        "BaselineHRV" double precision NOT NULL,
        "BaselineHR" double precision NOT NULL,
        "DeviationScore" double precision NOT NULL,
        "DogStateAtEvent" text,
        "AlertFired" boolean NOT NULL,
        "OutcomeLogged" boolean NOT NULL,
        CONSTRAINT "PK_StressEvents" PRIMARY KEY ("Id")
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260602074647_InitialPostgres') THEN
    CREATE TABLE "SubscriptionPlans" (
        "PlanId" uuid NOT NULL,
        "PlanName" character varying(100) NOT NULL,
        "Description" character varying(500),
        "Price" numeric(10,2) NOT NULL,
        "Currency" character varying(10) NOT NULL,
        "BillingPeriod" character varying(50) NOT NULL,
        "StripePriceId" character varying(255),
        "Features" text,
        "Badge" character varying(50),
        "SavingsText" character varying(100),
        "DisplayOrder" integer NOT NULL,
        "IsActive" boolean NOT NULL,
        "CreatedOn" timestamp with time zone NOT NULL,
        "UpdatedOn" timestamp with time zone,
        CONSTRAINT "PK_SubscriptionPlans" PRIMARY KEY ("PlanId")
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260602074647_InitialPostgres') THEN
    CREATE TABLE "SyncScoreRecords" (
        "Id" uuid NOT NULL,
        "UserId" uuid NOT NULL,
        "DogId" uuid NOT NULL,
        "Score" integer NOT NULL,
        "Trend" character varying(50) NOT NULL,
        "HRVStabilityScore" integer NOT NULL,
        "SharedActivityScore" integer NOT NULL,
        "DogCalmScore" integer NOT NULL,
        "SleepQualityScore" integer NOT NULL,
        "CalculatedAt" timestamp with time zone NOT NULL,
        CONSTRAINT "PK_SyncScoreRecords" PRIMARY KEY ("Id")
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260602074647_InitialPostgres') THEN
    CREATE TABLE "Tags" (
        "TagId" integer GENERATED BY DEFAULT AS IDENTITY,
        "TagName" text NOT NULL,
        CONSTRAINT "PK_Tags" PRIMARY KEY ("TagId")
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260602074647_InitialPostgres') THEN
    CREATE TABLE "TargetCycles" (
        "Id" uuid NOT NULL,
        "Cycles" integer NOT NULL,
        "DurationDescription" character varying(50) NOT NULL,
        "IsActive" boolean NOT NULL,
        "IsDeleted" boolean NOT NULL,
        "CreatedOn" timestamp with time zone NOT NULL,
        "UpdatedOn" timestamp with time zone,
        CONSTRAINT "PK_TargetCycles" PRIMARY KEY ("Id")
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260602074647_InitialPostgres') THEN
    CREATE TABLE "TrendingTopics" (
        "Id" uuid NOT NULL,
        "TopicName" character varying(100) NOT NULL,
        "Count" text NOT NULL,
        "CreatedOn" timestamp with time zone NOT NULL,
        CONSTRAINT "PK_TrendingTopics" PRIMARY KEY ("Id")
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260602074647_InitialPostgres') THEN
    CREATE TABLE "UserActivitiesScores" (
        "Id" uuid NOT NULL,
        "UserId" uuid NOT NULL,
        "ActivityId" uuid NOT NULL,
        "Score" integer,
        "ActivityDetails" text NOT NULL,
        "CreatedAt" timestamp with time zone NOT NULL,
        "ActivityDate" timestamp with time zone,
        CONSTRAINT "PK_UserActivitiesScores" PRIMARY KEY ("Id")
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260602074647_InitialPostgres') THEN
    CREATE TABLE "UserBaselines" (
        "Id" uuid NOT NULL,
        "UserId" uuid NOT NULL,
        "AvgHeartRate" double precision,
        "AvgHRV" double precision,
        "HRVStdDev" double precision,
        "AvgSleepScore" double precision,
        "AvgSteps" double precision,
        "AvgAmbientTemperature" double precision,
        "AvgDeepSleepMinutes" double precision,
        "AvgRemSleepMinutes" double precision,
        "AvgLightSleepMinutes" double precision,
        "AvgAwakeSleepMinutes" double precision,
        "AvgStressScore" double precision,
        "AvgCalories" double precision,
        "AvgDistance" double precision,
        "LastUpdatedUtc" timestamp with time zone,
        "BaselineCreatedAt" timestamp with time zone,
        "BaselineUpdatedAt" timestamp with time zone,
        "DaysOfDataCollected" integer,
        "HumanBaselineEstablished" boolean,
        "IsComplete" boolean,
        "IsTestMode" boolean,
        CONSTRAINT "PK_UserBaselines" PRIMARY KEY ("Id")
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260602074647_InitialPostgres') THEN
    CREATE TABLE "UserBreathingPreferences" (
        "Id" uuid NOT NULL,
        "UserId" uuid NOT NULL,
        "PatternId" uuid,
        "PatternName" text NOT NULL,
        "TargetCycles" integer NOT NULL,
        "CreatedAt" timestamp with time zone NOT NULL,
        "UpdatedAt" timestamp with time zone,
        CONSTRAINT "PK_UserBreathingPreferences" PRIMARY KEY ("Id")
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260602074647_InitialPostgres') THEN
    CREATE TABLE "UserChakraRatings" (
        "UserChakraRatingId" uuid NOT NULL,
        "UserId" uuid NOT NULL,
        "ChakraId" uuid NOT NULL,
        "Rating" integer NOT NULL,
        "Notes" text,
        "CreatedOn" timestamp with time zone NOT NULL,
        "UpdatedOn" timestamp with time zone,
        CONSTRAINT "PK_UserChakraRatings" PRIMARY KEY ("UserChakraRatingId")
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260602074647_InitialPostgres') THEN
    CREATE TABLE "UserOtps" (
        "Id" uuid NOT NULL,
        "UserId" uuid NOT NULL,
        "Email" text NOT NULL,
        "OtpCode" text NOT NULL,
        "ExpiryTime" timestamp with time zone,
        "IsUsed" boolean NOT NULL,
        "CreatedAt" timestamp with time zone NOT NULL,
        CONSTRAINT "PK_UserOtps" PRIMARY KEY ("Id")
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260602074647_InitialPostgres') THEN
    CREATE TABLE "UserSpiritualTraits" (
        "TraitId" uuid NOT NULL,
        "TraitName" character varying(100) NOT NULL,
        "Description" character varying(500),
        "IsActive" boolean NOT NULL,
        "IsDeleted" boolean NOT NULL,
        "CreatedAt" timestamp with time zone NOT NULL,
        CONSTRAINT "PK_UserSpiritualTraits" PRIMARY KEY ("TraitId")
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260602074647_InitialPostgres') THEN
    CREATE TABLE "WellnessAlerts" (
        "Id" uuid NOT NULL,
        "UserId" uuid NOT NULL,
        "DogId" uuid NOT NULL,
        "AlertType" character varying(50) NOT NULL,
        "Suggestion" character varying(500) NOT NULL,
        "DogStateAtAlert" character varying(50),
        "HRVAtAlert" double precision NOT NULL,
        "HRAtAlert" integer NOT NULL,
        "IsDogNearby" boolean,
        "DistanceMetres" double precision,
        "IsActedOn" boolean NOT NULL,
        "Outcome" character varying(50),
        "RecoveryMessage" character varying(500),
        "CreatedAt" timestamp with time zone NOT NULL,
        "ResolvedAt" timestamp with time zone,
        CONSTRAINT "PK_WellnessAlerts" PRIMARY KEY ("Id")
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260602074647_InitialPostgres') THEN
    CREATE TABLE "DogDailySummaries" (
        "Id" uuid NOT NULL,
        "DogId" uuid NOT NULL,
        "UserId" uuid NOT NULL,
        "Date" timestamp with time zone NOT NULL,
        "AvgHeartRate" double precision NOT NULL,
        "AvgTemperature" double precision NOT NULL,
        "AvgActivityScore" double precision NOT NULL,
        "AvgRestScore" double precision NOT NULL,
        "AvgRespirationRate" double precision NOT NULL,
        "MinHeartRate" double precision NOT NULL,
        "MaxHeartRate" double precision NOT NULL,
        "MinTemperature" double precision NOT NULL,
        "MaxTemperature" double precision NOT NULL,
        "RestPercentage" double precision NOT NULL,
        "ActivePercentage" double precision NOT NULL,
        "PlayPercentage" double precision NOT NULL,
        "SleepPercentage" double precision NOT NULL,
        "DataPointsCount" integer NOT NULL,
        "CreatedAt" timestamp with time zone NOT NULL,
        CONSTRAINT "PK_DogDailySummaries" PRIMARY KEY ("Id"),
        CONSTRAINT "FK_DogDailySummaries_DogProfiles_DogId" FOREIGN KEY ("DogId") REFERENCES "DogProfiles" ("Id") ON DELETE CASCADE,
        CONSTRAINT "FK_DogDailySummaries_HumanProfiles_UserId" FOREIGN KEY ("UserId") REFERENCES "HumanProfiles" ("Id") ON DELETE CASCADE
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260602074647_InitialPostgres') THEN
    CREATE TABLE "HumanDailySummaries" (
        "Id" uuid NOT NULL,
        "UserId" uuid NOT NULL,
        "Date" timestamp with time zone NOT NULL,
        "AvgHeartRate" double precision,
        "AvgHRV" double precision,
        "TotalSteps" integer,
        "AvgCalories" double precision,
        "AvgDistance" double precision,
        "AvgActiveMinutes" double precision,
        "AvgSleepMinutes" double precision,
        "AvgStressScore" double precision,
        "AvgAmbientTemperature" double precision,
        "SyncScore" integer,
        "SyncTrend" text,
        "DataPointsCount" integer,
        "CreatedAt" timestamp with time zone,
        "UpdatedAt" timestamp with time zone,
        CONSTRAINT "PK_HumanDailySummaries" PRIMARY KEY ("Id"),
        CONSTRAINT "FK_HumanDailySummaries_HumanProfiles_UserId" FOREIGN KEY ("UserId") REFERENCES "HumanProfiles" ("Id") ON DELETE CASCADE
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260602074647_InitialPostgres') THEN
    CREATE TABLE "RitualLogs" (
        "Id" uuid NOT NULL,
        "RitualId" uuid NOT NULL,
        "UserId" uuid NOT NULL,
        "CompletedAt" timestamp with time zone NOT NULL,
        "BonusAwarded" boolean NOT NULL,
        CONSTRAINT "PK_RitualLogs" PRIMARY KEY ("Id"),
        CONSTRAINT "FK_RitualLogs_Rituals_RitualId" FOREIGN KEY ("RitualId") REFERENCES "Rituals" ("Id") ON DELETE CASCADE
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260602074647_InitialPostgres') THEN
    CREATE TABLE "Users" (
        "UserId" uuid NOT NULL,
        "FullName" character varying(150) NOT NULL,
        "Email" character varying(150) NOT NULL,
        "PasswordHash" character varying(500) NOT NULL,
        "RoleId" integer,
        "CreatedOn" timestamp with time zone NOT NULL,
        "UpdatedOn" timestamp with time zone,
        "IsActive" boolean NOT NULL,
        "IsDeleted" boolean NOT NULL,
        "IsTermAccepted" boolean NOT NULL,
        "IsGoogleSignIn" boolean NOT NULL,
        "IsProfileSetupCompleted" boolean,
        "ProfilePhoto" character varying(500),
        "ProfileName" text,
        "Status" text NOT NULL,
        "IsPremium" boolean NOT NULL,
        "Age" integer,
        "StripeCustomerId" character varying(255),
        "FitbitAccessToken" character varying(500),
        "FitbitRefreshToken" character varying(500),
        "FitbitTokenExpiresAt" timestamp with time zone,
        "FitbitUserId" character varying(50),
        "FitBarkAccessToken" character varying(500),
        "FitBarkRefreshToken" character varying(500),
        "FitBarkTokenExpiresAt" timestamp with time zone,
        "FitBarkUserId" character varying(100),
        CONSTRAINT "PK_Users" PRIMARY KEY ("UserId"),
        CONSTRAINT "FK_Users_Roles_RoleId" FOREIGN KEY ("RoleId") REFERENCES "Roles" ("Id")
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260602074647_InitialPostgres') THEN
    CREATE TABLE "CommunityPosts" (
        "PostId" uuid NOT NULL,
        "UserId" uuid NOT NULL,
        "Content" character varying(2000) NOT NULL,
        "ImageUrl" character varying(500),
        "LikeCount" integer NOT NULL,
        "CommentCount" integer NOT NULL,
        "CreatedOn" timestamp with time zone NOT NULL,
        "UpdatedOn" timestamp with time zone,
        "IsDeleted" boolean NOT NULL,
        "ModerationStatus" character varying(50),
        "Hashtags" character varying(500),
        CONSTRAINT "PK_CommunityPosts" PRIMARY KEY ("PostId"),
        CONSTRAINT "FK_CommunityPosts_Users_UserId" FOREIGN KEY ("UserId") REFERENCES "Users" ("UserId") ON DELETE CASCADE
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260602074647_InitialPostgres') THEN
    CREATE TABLE "Dogs" (
        "DogId" uuid NOT NULL,
        "UserId" uuid NOT NULL,
        "DogName" character varying(100) NOT NULL,
        "ProfilePhoto" character varying(500),
        "CreatedOn" timestamp with time zone NOT NULL,
        "UpdatedOn" timestamp with time zone,
        "CurrentScore" double precision NOT NULL,
        "Breed" text,
        "Age" integer,
        "Weight" double precision,
        "IsActive" boolean NOT NULL,
        "IsDeleted" boolean NOT NULL,
        CONSTRAINT "PK_Dogs" PRIMARY KEY ("DogId"),
        CONSTRAINT "FK_Dogs_Users_UserId" FOREIGN KEY ("UserId") REFERENCES "Users" ("UserId") ON DELETE CASCADE
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260602074647_InitialPostgres') THEN
    CREATE TABLE "ExpertQueries" (
        "Id" uuid NOT NULL,
        "UserId" uuid NOT NULL,
        "CompanionName" character varying(100),
        "Category" character varying(100) NOT NULL,
        "Priority" character varying(20) NOT NULL,
        "Subject" character varying(200) NOT NULL,
        "QuestionText" text NOT NULL,
        "Status" character varying(50) NOT NULL,
        "IsDeleted" boolean NOT NULL,
        "CreatedOn" timestamp with time zone NOT NULL,
        "AdminResponse" text,
        "RespondedOn" timestamp with time zone,
        CONSTRAINT "PK_ExpertQueries" PRIMARY KEY ("Id"),
        CONSTRAINT "FK_ExpertQueries_Users_UserId" FOREIGN KEY ("UserId") REFERENCES "Users" ("UserId") ON DELETE CASCADE
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260602074647_InitialPostgres') THEN
    CREATE TABLE "HealingCircleRegistrations" (
        "RegistrationId" uuid NOT NULL,
        "CircleId" uuid NOT NULL,
        "UserId" uuid NOT NULL,
        "RegisteredOn" timestamp with time zone NOT NULL,
        CONSTRAINT "PK_HealingCircleRegistrations" PRIMARY KEY ("RegistrationId"),
        CONSTRAINT "FK_HealingCircleRegistrations_HealingCircles_CircleId" FOREIGN KEY ("CircleId") REFERENCES "HealingCircles" ("Id") ON DELETE CASCADE,
        CONSTRAINT "FK_HealingCircleRegistrations_Users_UserId" FOREIGN KEY ("UserId") REFERENCES "Users" ("UserId") ON DELETE CASCADE
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260602074647_InitialPostgres') THEN
    CREATE TABLE "SacredGuideWaitlist" (
        "WaitlistId" uuid NOT NULL,
        "SacredGuideId" uuid NOT NULL,
        "UserId" uuid NOT NULL,
        "JoinedOn" timestamp with time zone NOT NULL,
        "IsNotified" boolean NOT NULL,
        CONSTRAINT "PK_SacredGuideWaitlist" PRIMARY KEY ("WaitlistId"),
        CONSTRAINT "FK_SacredGuideWaitlist_SacredGuides_SacredGuideId" FOREIGN KEY ("SacredGuideId") REFERENCES "SacredGuides" ("SacredGuideId") ON DELETE CASCADE,
        CONSTRAINT "FK_SacredGuideWaitlist_Users_UserId" FOREIGN KEY ("UserId") REFERENCES "Users" ("UserId") ON DELETE CASCADE
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260602074647_InitialPostgres') THEN
    CREATE TABLE "Subscriptions" (
        "SubscriptionId" uuid NOT NULL,
        "UserId" uuid NOT NULL,
        "StripeCustomerId" character varying(255),
        "StripeSubscriptionId" character varying(255) NOT NULL,
        "StripePriceId" character varying(255),
        "PlanName" character varying(100),
        "Status" character varying(50),
        "CurrentPeriodStart" timestamp with time zone,
        "CurrentPeriodEnd" timestamp with time zone,
        "CancelAtPeriodEnd" boolean NOT NULL,
        "Amount" numeric(10,2),
        "Currency" character varying(10) NOT NULL,
        "CreatedOn" timestamp with time zone NOT NULL,
        "UpdatedOn" timestamp with time zone,
        CONSTRAINT "PK_Subscriptions" PRIMARY KEY ("SubscriptionId"),
        CONSTRAINT "FK_Subscriptions_Users_UserId" FOREIGN KEY ("UserId") REFERENCES "Users" ("UserId") ON DELETE CASCADE
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260602074647_InitialPostgres') THEN
    CREATE TABLE "UserBondingActivities" (
        "Id" integer GENERATED BY DEFAULT AS IDENTITY,
        "UserId" uuid NOT NULL,
        "ActivityId" uuid NOT NULL,
        "ActivityDate" timestamp with time zone NOT NULL,
        "CreatedAt" timestamp with time zone NOT NULL,
        CONSTRAINT "PK_UserBondingActivities" PRIMARY KEY ("Id"),
        CONSTRAINT "FK_UserBondingActivities_BondingActivities_ActivityId" FOREIGN KEY ("ActivityId") REFERENCES "BondingActivities" ("ActivityId") ON DELETE CASCADE,
        CONSTRAINT "FK_UserBondingActivities_Users_UserId" FOREIGN KEY ("UserId") REFERENCES "Users" ("UserId") ON DELETE CASCADE
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260602074647_InitialPostgres') THEN
    CREATE TABLE "UserChakraProgresses" (
        "ChakraProgressId" uuid NOT NULL,
        "UserId" uuid NOT NULL,
        "ChakraId" uuid NOT NULL,
        "PauseTimeInSeconds" integer,
        "IsCompleted" boolean NOT NULL,
        "LastPlayedOn" timestamp with time zone NOT NULL,
        "CreatedOn" timestamp with time zone NOT NULL,
        "UpdatedOn" timestamp with time zone,
        CONSTRAINT "PK_UserChakraProgresses" PRIMARY KEY ("ChakraProgressId"),
        CONSTRAINT "FK_UserChakraProgresses_Chakras_ChakraId" FOREIGN KEY ("ChakraId") REFERENCES "Chakras" ("ChakraId") ON DELETE CASCADE,
        CONSTRAINT "FK_UserChakraProgresses_Users_UserId" FOREIGN KEY ("UserId") REFERENCES "Users" ("UserId") ON DELETE CASCADE
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260602074647_InitialPostgres') THEN
    CREATE TABLE "UserCheckIns" (
        "Id" uuid NOT NULL,
        "UserId" uuid NOT NULL,
        "CheckInId" uuid NOT NULL,
        "Rating" integer,
        "CreatedOn" timestamp with time zone NOT NULL,
        "UpdatedOn" timestamp with time zone,
        "DailyPointsChange" integer,
        "ScoreSnapshot" integer,
        "ActivityDate" timestamp with time zone,
        "IsMissed" boolean NOT NULL,
        CONSTRAINT "PK_UserCheckIns" PRIMARY KEY ("Id"),
        CONSTRAINT "FK_UserCheckIns_CheckIns_CheckInId" FOREIGN KEY ("CheckInId") REFERENCES "CheckIns" ("CheckInId") ON DELETE CASCADE,
        CONSTRAINT "FK_UserCheckIns_Users_UserId" FOREIGN KEY ("UserId") REFERENCES "Users" ("UserId") ON DELETE CASCADE
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260602074647_InitialPostgres') THEN
    CREATE TABLE "UserCredits" (
        "Id" uuid NOT NULL,
        "UserId" uuid NOT NULL,
        "CreditType" character varying(50) NOT NULL,
        "CreditsTotal" integer NOT NULL,
        "CreditsUsed" integer NOT NULL,
        "BillingCycleStart" timestamp with time zone NOT NULL,
        "BillingCycleEnd" timestamp with time zone NOT NULL,
        "IsDeleted" boolean NOT NULL,
        "CreatedOn" timestamp with time zone NOT NULL,
        "UpdatedOn" timestamp with time zone,
        CONSTRAINT "PK_UserCredits" PRIMARY KEY ("Id"),
        CONSTRAINT "FK_UserCredits_Users_UserId" FOREIGN KEY ("UserId") REFERENCES "Users" ("UserId") ON DELETE CASCADE
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260602074647_InitialPostgres') THEN
    CREATE TABLE "UserSelectedTraits" (
        "Id" uuid NOT NULL,
        "UserId" uuid NOT NULL,
        "TraitId" uuid NOT NULL,
        "IsSelected" boolean NOT NULL,
        "CreatedOn" timestamp with time zone NOT NULL,
        CONSTRAINT "PK_UserSelectedTraits" PRIMARY KEY ("Id"),
        CONSTRAINT "FK_UserSelectedTraits_UserSpiritualTraits_TraitId" FOREIGN KEY ("TraitId") REFERENCES "UserSpiritualTraits" ("TraitId") ON DELETE CASCADE,
        CONSTRAINT "FK_UserSelectedTraits_Users_UserId" FOREIGN KEY ("UserId") REFERENCES "Users" ("UserId") ON DELETE CASCADE
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260602074647_InitialPostgres') THEN
    CREATE TABLE "CommunityComments" (
        "CommentId" uuid NOT NULL,
        "PostId" uuid NOT NULL,
        "UserId" uuid NOT NULL,
        "Content" character varying(1000) NOT NULL,
        "CreatedOn" timestamp with time zone NOT NULL,
        "IsDeleted" boolean NOT NULL,
        "ParentCommentId" uuid,
        CONSTRAINT "PK_CommunityComments" PRIMARY KEY ("CommentId"),
        CONSTRAINT "FK_CommunityComments_CommunityComments_ParentCommentId" FOREIGN KEY ("ParentCommentId") REFERENCES "CommunityComments" ("CommentId"),
        CONSTRAINT "FK_CommunityComments_CommunityPosts_PostId" FOREIGN KEY ("PostId") REFERENCES "CommunityPosts" ("PostId") ON DELETE CASCADE,
        CONSTRAINT "FK_CommunityComments_Users_UserId" FOREIGN KEY ("UserId") REFERENCES "Users" ("UserId") ON DELETE CASCADE
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260602074647_InitialPostgres') THEN
    CREATE TABLE "CommunityLikes" (
        "LikeId" uuid NOT NULL,
        "PostId" uuid NOT NULL,
        "UserId" uuid NOT NULL,
        "CreatedOn" timestamp with time zone NOT NULL,
        CONSTRAINT "PK_CommunityLikes" PRIMARY KEY ("LikeId"),
        CONSTRAINT "FK_CommunityLikes_CommunityPosts_PostId" FOREIGN KEY ("PostId") REFERENCES "CommunityPosts" ("PostId") ON DELETE CASCADE,
        CONSTRAINT "FK_CommunityLikes_Users_UserId" FOREIGN KEY ("UserId") REFERENCES "Users" ("UserId") ON DELETE CASCADE
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260602074647_InitialPostgres') THEN
    CREATE TABLE "DogSelectedTraits" (
        "Id" uuid NOT NULL,
        "DogId" uuid NOT NULL,
        "UserId" uuid NOT NULL,
        "TraitId" uuid NOT NULL,
        "IsSelected" boolean NOT NULL,
        "CreatedOn" timestamp with time zone NOT NULL,
        CONSTRAINT "PK_DogSelectedTraits" PRIMARY KEY ("Id"),
        CONSTRAINT "FK_DogSelectedTraits_DogSpiritualTraits_TraitId" FOREIGN KEY ("TraitId") REFERENCES "DogSpiritualTraits" ("TraitId") ON DELETE CASCADE,
        CONSTRAINT "FK_DogSelectedTraits_Dogs_DogId" FOREIGN KEY ("DogId") REFERENCES "Dogs" ("DogId") ON DELETE CASCADE,
        CONSTRAINT "FK_DogSelectedTraits_Users_UserId" FOREIGN KEY ("UserId") REFERENCES "Users" ("UserId") ON DELETE CASCADE
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260602074647_InitialPostgres') THEN
    CREATE TABLE "SubscriptionLogs" (
        "LogId" uuid NOT NULL,
        "SubscriptionId" uuid,
        "UserId" uuid,
        "EventType" character varying(100) NOT NULL,
        "EventData" text,
        "CreatedOn" timestamp with time zone NOT NULL,
        CONSTRAINT "PK_SubscriptionLogs" PRIMARY KEY ("LogId"),
        CONSTRAINT "FK_SubscriptionLogs_Subscriptions_SubscriptionId" FOREIGN KEY ("SubscriptionId") REFERENCES "Subscriptions" ("SubscriptionId"),
        CONSTRAINT "FK_SubscriptionLogs_Users_UserId" FOREIGN KEY ("UserId") REFERENCES "Users" ("UserId")
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260602074647_InitialPostgres') THEN
    CREATE TABLE "PostReports" (
        "ReportId" uuid NOT NULL,
        "PostId" uuid,
        "CommentId" uuid,
        "ReporterUserId" uuid NOT NULL,
        "ReportedUserId" uuid,
        "ReportType" character varying(50) NOT NULL,
        "Priority" character varying(20) NOT NULL,
        "Status" character varying(20) NOT NULL,
        "Reason" character varying(255) NOT NULL,
        "Description" text,
        "ReportedOn" timestamp with time zone NOT NULL,
        CONSTRAINT "PK_PostReports" PRIMARY KEY ("ReportId"),
        CONSTRAINT "FK_PostReports_CommunityComments_CommentId" FOREIGN KEY ("CommentId") REFERENCES "CommunityComments" ("CommentId"),
        CONSTRAINT "FK_PostReports_CommunityPosts_PostId" FOREIGN KEY ("PostId") REFERENCES "CommunityPosts" ("PostId"),
        CONSTRAINT "FK_PostReports_Users_ReportedUserId" FOREIGN KEY ("ReportedUserId") REFERENCES "Users" ("UserId"),
        CONSTRAINT "FK_PostReports_Users_ReporterUserId" FOREIGN KEY ("ReporterUserId") REFERENCES "Users" ("UserId") ON DELETE CASCADE
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260602074647_InitialPostgres') THEN
    CREATE INDEX "IX_CommunityComments_ParentCommentId" ON "CommunityComments" ("ParentCommentId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260602074647_InitialPostgres') THEN
    CREATE INDEX "IX_CommunityComments_PostId" ON "CommunityComments" ("PostId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260602074647_InitialPostgres') THEN
    CREATE INDEX "IX_CommunityComments_UserId" ON "CommunityComments" ("UserId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260602074647_InitialPostgres') THEN
    CREATE INDEX "IX_CommunityLikes_PostId" ON "CommunityLikes" ("PostId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260602074647_InitialPostgres') THEN
    CREATE INDEX "IX_CommunityLikes_UserId" ON "CommunityLikes" ("UserId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260602074647_InitialPostgres') THEN
    CREATE INDEX "IX_CommunityPosts_UserId" ON "CommunityPosts" ("UserId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260602074647_InitialPostgres') THEN
    CREATE INDEX "IX_DogDailySummaries_DogId" ON "DogDailySummaries" ("DogId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260602074647_InitialPostgres') THEN
    CREATE INDEX "IX_DogDailySummaries_UserId" ON "DogDailySummaries" ("UserId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260602074647_InitialPostgres') THEN
    CREATE UNIQUE INDEX "IX_Dogs_UserId" ON "Dogs" ("UserId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260602074647_InitialPostgres') THEN
    CREATE INDEX "IX_DogSelectedTraits_DogId" ON "DogSelectedTraits" ("DogId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260602074647_InitialPostgres') THEN
    CREATE INDEX "IX_DogSelectedTraits_TraitId" ON "DogSelectedTraits" ("TraitId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260602074647_InitialPostgres') THEN
    CREATE INDEX "IX_DogSelectedTraits_UserId" ON "DogSelectedTraits" ("UserId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260602074647_InitialPostgres') THEN
    CREATE INDEX "IX_ExpertQueries_UserId" ON "ExpertQueries" ("UserId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260602074647_InitialPostgres') THEN
    CREATE INDEX "IX_HealingCircleRegistrations_CircleId" ON "HealingCircleRegistrations" ("CircleId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260602074647_InitialPostgres') THEN
    CREATE INDEX "IX_HealingCircleRegistrations_UserId" ON "HealingCircleRegistrations" ("UserId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260602074647_InitialPostgres') THEN
    CREATE INDEX "IX_HumanDailySummaries_UserId" ON "HumanDailySummaries" ("UserId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260602074647_InitialPostgres') THEN
    CREATE INDEX "IX_PostReports_CommentId" ON "PostReports" ("CommentId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260602074647_InitialPostgres') THEN
    CREATE INDEX "IX_PostReports_PostId" ON "PostReports" ("PostId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260602074647_InitialPostgres') THEN
    CREATE INDEX "IX_PostReports_ReportedUserId" ON "PostReports" ("ReportedUserId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260602074647_InitialPostgres') THEN
    CREATE INDEX "IX_PostReports_ReporterUserId" ON "PostReports" ("ReporterUserId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260602074647_InitialPostgres') THEN
    CREATE INDEX "IX_RitualLogs_RitualId" ON "RitualLogs" ("RitualId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260602074647_InitialPostgres') THEN
    CREATE INDEX "IX_SacredGuideWaitlist_SacredGuideId" ON "SacredGuideWaitlist" ("SacredGuideId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260602074647_InitialPostgres') THEN
    CREATE INDEX "IX_SacredGuideWaitlist_UserId" ON "SacredGuideWaitlist" ("UserId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260602074647_InitialPostgres') THEN
    CREATE INDEX "IX_SubscriptionLogs_SubscriptionId" ON "SubscriptionLogs" ("SubscriptionId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260602074647_InitialPostgres') THEN
    CREATE INDEX "IX_SubscriptionLogs_UserId" ON "SubscriptionLogs" ("UserId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260602074647_InitialPostgres') THEN
    CREATE INDEX "IX_Subscriptions_UserId" ON "Subscriptions" ("UserId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260602074647_InitialPostgres') THEN
    CREATE INDEX "IX_UserBondingActivities_ActivityId" ON "UserBondingActivities" ("ActivityId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260602074647_InitialPostgres') THEN
    CREATE INDEX "IX_UserBondingActivities_UserId" ON "UserBondingActivities" ("UserId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260602074647_InitialPostgres') THEN
    CREATE INDEX "IX_UserChakraProgresses_ChakraId" ON "UserChakraProgresses" ("ChakraId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260602074647_InitialPostgres') THEN
    CREATE INDEX "IX_UserChakraProgresses_UserId" ON "UserChakraProgresses" ("UserId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260602074647_InitialPostgres') THEN
    CREATE INDEX "IX_UserCheckIns_CheckInId" ON "UserCheckIns" ("CheckInId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260602074647_InitialPostgres') THEN
    CREATE INDEX "IX_UserCheckIns_UserId" ON "UserCheckIns" ("UserId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260602074647_InitialPostgres') THEN
    CREATE INDEX "IX_UserCredits_UserId" ON "UserCredits" ("UserId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260602074647_InitialPostgres') THEN
    CREATE INDEX "IX_Users_RoleId" ON "Users" ("RoleId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260602074647_InitialPostgres') THEN
    CREATE INDEX "IX_UserSelectedTraits_TraitId" ON "UserSelectedTraits" ("TraitId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260602074647_InitialPostgres') THEN
    CREATE INDEX "IX_UserSelectedTraits_UserId" ON "UserSelectedTraits" ("UserId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260602074647_InitialPostgres') THEN
    INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
    VALUES ('20260602074647_InitialPostgres', '9.0.10');
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260605_AddIsDeletedToPreRegistrations') THEN
    ALTER TABLE "PreRegistrations" ADD "IsDeleted" boolean NOT NULL DEFAULT FALSE;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260605_AddIsDeletedToPreRegistrations') THEN
    INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
    VALUES ('20260605_AddIsDeletedToPreRegistrations', '9.0.10');
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260605_AddTierLevelToSubscriptionPlans') THEN
    ALTER TABLE "SubscriptionPlans" ADD "TierLevel" character varying(20) NOT NULL DEFAULT 'plus';
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260605_AddTierLevelToSubscriptionPlans') THEN

                    UPDATE "SubscriptionPlans"
                    SET "TierLevel" = 'plus'
                    WHERE "TierLevel" IS NULL;
                
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260605_AddTierLevelToSubscriptionPlans') THEN
    INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
    VALUES ('20260605_AddTierLevelToSubscriptionPlans', '9.0.10');
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260608_FixEmailVerificationColumn') THEN
    DO $$
                    BEGIN
                        IF NOT EXISTS (
                            SELECT 1 FROM information_schema.columns 
                            WHERE table_name = 'Users' AND column_name = 'IsEmailVerified'
                        ) THEN
                            ALTER TABLE "Users" ADD COLUMN "IsEmailVerified" BOOLEAN NOT NULL DEFAULT false;
                        END IF;
                    END $$;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260608_FixEmailVerificationColumn') THEN
    INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
    VALUES ('20260608_FixEmailVerificationColumn', '9.0.10');
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260608071000_FixSchemaMismatches') THEN
    CREATE TABLE "BondingActivities" (
        "ActivityId" uuid NOT NULL,
        "ActivityName" text NOT NULL,
        "Points" integer NOT NULL,
        "Category" text NOT NULL,
        "InteractionType" text NOT NULL,
        CONSTRAINT "PK_BondingActivities" PRIMARY KEY ("ActivityId")
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260608071000_FixSchemaMismatches') THEN
    CREATE TABLE "BreathingPatterns" (
        "Id" uuid NOT NULL,
        "Name" character varying(100) NOT NULL,
        "Description" character varying(250) NOT NULL,
        "InhaleDuration" integer NOT NULL,
        "ExhaleDuration" integer NOT NULL,
        "HoldDuration" integer NOT NULL,
        "HoldAfterExhaleDuration" integer NOT NULL,
        "IsActive" boolean NOT NULL,
        "IsDeleted" boolean NOT NULL,
        "CreatedOn" timestamp with time zone NOT NULL,
        "UpdatedOn" timestamp with time zone,
        CONSTRAINT "PK_BreathingPatterns" PRIMARY KEY ("Id")
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260608071000_FixSchemaMismatches') THEN
    CREATE TABLE "ChakraLogs" (
        "Id" uuid NOT NULL,
        "UserId" uuid NOT NULL,
        "PetId" uuid,
        "RootScore" integer NOT NULL,
        "SacralScore" integer NOT NULL,
        "SolarPlexusScore" integer NOT NULL,
        "HeartScore" integer NOT NULL,
        "ThroatScore" integer NOT NULL,
        "ThirdEyeScore" integer NOT NULL,
        "CrownScore" integer NOT NULL,
        "HarmonyScore" real,
        "DominantBlockage" text,
        "CreatedAt" timestamp with time zone NOT NULL,
        "LogDate" timestamp with time zone,
        CONSTRAINT "PK_ChakraLogs" PRIMARY KEY ("Id")
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260608071000_FixSchemaMismatches') THEN
    CREATE TABLE "ChakraRitualProgresses" (
        "Id" uuid NOT NULL,
        "UserId" uuid NOT NULL,
        "ChakraId" uuid NOT NULL,
        "LastPlayedPosition" numeric,
        "TotalDuration" numeric,
        "IsCompleted" boolean,
        "LastPlayedDate" timestamp with time zone,
        "CreatedAt" timestamp with time zone,
        "UpdatedAt" timestamp with time zone,
        "IsPaused" boolean,
        CONSTRAINT "PK_ChakraRitualProgresses" PRIMARY KEY ("Id")
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260608071000_FixSchemaMismatches') THEN
    CREATE TABLE "Chakras" (
        "ChakraId" uuid NOT NULL,
        "ChakraName" character varying(100) NOT NULL,
        "AudioUrl" character varying(500),
        "IsActive" boolean NOT NULL,
        "IsDeleted" boolean NOT NULL,
        "CreatedOn" timestamp with time zone NOT NULL,
        "UpdatedOn" timestamp with time zone,
        CONSTRAINT "PK_Chakras" PRIMARY KEY ("ChakraId")
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260608071000_FixSchemaMismatches') THEN
    CREATE TABLE "CheckIns" (
        "CheckInId" uuid NOT NULL,
        "Questions" character varying(500) NOT NULL,
        "Rating" integer,
        "LowEnergyLabel" character varying(150),
        "HighEnergyLabel" character varying(150),
        "IsDeleted" boolean NOT NULL,
        "CreatedOn" timestamp with time zone NOT NULL,
        "UpdatedOn" timestamp with time zone,
        CONSTRAINT "PK_CheckIns" PRIMARY KEY ("CheckInId")
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260608071000_FixSchemaMismatches') THEN
    CREATE TABLE "CommunityDiscussions" (
        "Id" uuid NOT NULL,
        "Title" character varying(255) NOT NULL,
        "AuthorName" character varying(150) NOT NULL,
        "RepliesCount" integer NOT NULL,
        "IsPinned" boolean NOT NULL,
        "LastActive" text NOT NULL,
        "CreatedOn" timestamp with time zone NOT NULL,
        CONSTRAINT "PK_CommunityDiscussions" PRIMARY KEY ("Id")
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260608071000_FixSchemaMismatches') THEN
    CREATE TABLE "DeviceConnections" (
        "Id" uuid NOT NULL,
        "UserId" uuid NOT NULL,
        "DogId" uuid,
        "DeviceType" character varying(50) NOT NULL,
        "DeviceModel" character varying(100),
        "DeviceNumber" character varying(100) NOT NULL,
        "IsConnected" boolean NOT NULL,
        "ConnectedAt" timestamp with time zone,
        "DisconnectedAt" timestamp with time zone,
        "CreatedAt" timestamp with time zone NOT NULL,
        CONSTRAINT "PK_DeviceConnections" PRIMARY KEY ("Id")
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260608071000_FixSchemaMismatches') THEN
    CREATE TABLE "DogBaselines" (
        "Id" uuid NOT NULL,
        "DogId" uuid NOT NULL,
        "AvgHeartRate" double precision,
        "AvgActivityScore" double precision NOT NULL,
        "AvgTemperature" double precision,
        "AvgRestScore" double precision NOT NULL,
        "AvgRespirationRate" double precision,
        "LastUpdatedUtc" timestamp with time zone NOT NULL,
        "DaysOfDataCollected" integer NOT NULL,
        "DogBaselineEstablished" boolean NOT NULL,
        CONSTRAINT "PK_DogBaselines" PRIMARY KEY ("Id")
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260608071000_FixSchemaMismatches') THEN
    CREATE TABLE "DogProfiles" (
        "Id" uuid NOT NULL,
        "UserId" uuid NOT NULL,
        "Name" character varying(100) NOT NULL,
        "Breed" character varying(100),
        "Age" integer,
        "Weight" numeric(5,2),
        "CreatedAt" timestamp with time zone NOT NULL,
        "UpdatedAt" timestamp with time zone,
        "BaselineStartTime" timestamp with time zone,
        "DogBaselineEstablished" boolean NOT NULL,
        CONSTRAINT "PK_DogProfiles" PRIMARY KEY ("Id")
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260608071000_FixSchemaMismatches') THEN
    CREATE TABLE "DogSpiritualTraits" (
        "TraitId" uuid NOT NULL,
        "TraitName" character varying(100) NOT NULL,
        "Description" character varying(500),
        "IsActive" boolean NOT NULL,
        "IsDeleted" boolean NOT NULL,
        "CreatedAt" timestamp with time zone NOT NULL,
        CONSTRAINT "PK_DogSpiritualTraits" PRIMARY KEY ("TraitId")
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260608071000_FixSchemaMismatches') THEN
    CREATE TABLE "DogVitals" (
        "Id" uuid NOT NULL,
        "DogId" uuid NOT NULL,
        "HeartRate" integer,
        "ActivityScore" integer NOT NULL,
        "Temperature" double precision,
        "RestScore" integer NOT NULL,
        "RespirationRate" double precision,
        "Latitude" double precision,
        "Longitude" double precision,
        "State" character varying(50) NOT NULL,
        "Source" character varying(50) NOT NULL,
        "ActivityValue" integer,
        "MinPlay" integer,
        "MinActive" integer,
        "MinRest" integer,
        "NapTime" integer,
        "TimestampUtc" timestamp with time zone NOT NULL,
        CONSTRAINT "PK_DogVitals" PRIMARY KEY ("Id")
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260608071000_FixSchemaMismatches') THEN
    CREATE TABLE "ExpertQueryCategories" (
        "Id" uuid NOT NULL,
        "Name" character varying(100) NOT NULL,
        "Description" character varying(255),
        "IsActive" boolean NOT NULL,
        "DisplayOrder" integer NOT NULL,
        "CreatedOn" timestamp with time zone NOT NULL,
        CONSTRAINT "PK_ExpertQueryCategories" PRIMARY KEY ("Id")
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260608071000_FixSchemaMismatches') THEN
    CREATE TABLE "FAQs" (
        "FAQId" uuid NOT NULL,
        "Question" character varying(500) NOT NULL,
        "Answer" text NOT NULL,
        "Category" character varying(100) NOT NULL,
        "Status" character varying(50) NOT NULL,
        "DisplayOrder" integer NOT NULL,
        "CreatedAt" timestamp with time zone NOT NULL,
        "UpdatedAt" timestamp with time zone,
        "IsDeleted" boolean NOT NULL,
        CONSTRAINT "PK_FAQs" PRIMARY KEY ("FAQId")
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260608071000_FixSchemaMismatches') THEN
    CREATE TABLE "FitBarkActivityLogs" (
        "Id" uuid NOT NULL,
        "DogSlug" text NOT NULL,
        "ActivityDate" timestamp with time zone NOT NULL,
        "ActivityValue" integer NOT NULL,
        "MinPlay" integer NOT NULL,
        "MinActive" integer NOT NULL,
        "MinRest" integer NOT NULL,
        "NapTime" integer NOT NULL,
        "FetchedAt" timestamp with time zone NOT NULL,
        CONSTRAINT "PK_FitBarkActivityLogs" PRIMARY KEY ("Id")
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260608071000_FixSchemaMismatches') THEN
    CREATE TABLE "FitBarkDogs" (
        "Id" uuid NOT NULL,
        "Name" character varying(100) NOT NULL,
        "DogSlug" character varying(100) NOT NULL,
        "Breed" character varying(100),
        "BirthDate" text,
        "Weight" double precision,
        "Gender" character varying(20),
        "ActivityGoal" integer,
        "Country" character varying(50),
        "Zip" character varying(20),
        "CreatedAt" timestamp with time zone NOT NULL,
        "UpdatedAt" timestamp with time zone NOT NULL,
        CONSTRAINT "PK_FitBarkDogs" PRIMARY KEY ("Id")
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260608071000_FixSchemaMismatches') THEN
    CREATE TABLE "GuidedPractices" (
        "Id" uuid NOT NULL,
        "Name" text NOT NULL,
        "Description" text NOT NULL,
        "AudioUrl" text,
        CONSTRAINT "PK_GuidedPractices" PRIMARY KEY ("Id")
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260608071000_FixSchemaMismatches') THEN
    CREATE TABLE "HealingCircles" (
        "Id" uuid NOT NULL,
        "Title" character varying(200) NOT NULL,
        "Time" character varying(100) NOT NULL,
        "Description" character varying(1000) NOT NULL,
        "ParticipantsCount" integer NOT NULL,
        "MaxParticipants" integer NOT NULL,
        "IsPremium" boolean NOT NULL,
        "CreatedOn" timestamp with time zone NOT NULL,
        CONSTRAINT "PK_HealingCircles" PRIMARY KEY ("Id")
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260608071000_FixSchemaMismatches') THEN
    CREATE TABLE "HumanProfiles" (
        "Id" uuid NOT NULL,
        "UserId" uuid NOT NULL,
        "Name" character varying(100),
        "Age" integer,
        "CreatedAt" timestamp with time zone NOT NULL,
        "UpdatedAt" timestamp with time zone,
        "BaselineStartTime" timestamp with time zone,
        "HumanBaselineEstablished" boolean NOT NULL,
        "PhoneNumber" character varying(20),
        CONSTRAINT "PK_HumanProfiles" PRIMARY KEY ("Id")
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260608071000_FixSchemaMismatches') THEN
    CREATE TABLE "HumanVitals" (
        "Id" uuid NOT NULL,
        "UserId" uuid NOT NULL,
        "HeartRate" integer,
        "HRV" double precision,
        "Steps" integer,
        "Calories" double precision NOT NULL,
        "Distance" double precision,
        "ActiveMinutes" integer,
        "SleepMinutes" integer,
        "DeepSleepMinutes" integer,
        "RemSleepMinutes" integer,
        "LightSleepMinutes" integer,
        "AwakeSleepMinutes" integer,
        "StressScore" integer,
        "Latitude" double precision,
        "Longitude" double precision,
        "Source" character varying(50),
        "TimestampUtc" timestamp with time zone NOT NULL,
        "AmbientTemperature" double precision,
        "WeatherCondition" character varying(100),
        "WeatherLocation" character varying(200),
        CONSTRAINT "PK_HumanVitals" PRIMARY KEY ("Id")
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260608071000_FixSchemaMismatches') THEN
    CREATE TABLE "JournalEntries" (
        "EntryId" uuid NOT NULL,
        "UserId" uuid NOT NULL,
        "EntryType" text NOT NULL,
        "Content" text,
        "Tags" text,
        "CreatedOn" timestamp with time zone NOT NULL,
        "UpdatedOn" timestamp with time zone,
        "IsDeleted" boolean NOT NULL,
        "IsArchive" boolean,
        "LettrTo" text,
        "MediaType" text,
        "MediaUrl" text,
        "ImageUrl" text,
        CONSTRAINT "PK_JournalEntries" PRIMARY KEY ("EntryId")
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260608071000_FixSchemaMismatches') THEN
    CREATE TABLE "MessageLogs" (
        "Id" uuid NOT NULL,
        "UserId" uuid NOT NULL,
        "MessageType" character varying(50) NOT NULL,
        "Channel" character varying(20) NOT NULL,
        "RecipientContact" character varying(100) NOT NULL,
        "Title" character varying(200),
        "Body" character varying(1000) NOT NULL,
        "Status" character varying(20) NOT NULL,
        "ErrorMessage" character varying(500),
        "RelatedAlertId" uuid,
        "SentAt" timestamp with time zone NOT NULL,
        "DeliveredAt" timestamp with time zone,
        CONSTRAINT "PK_MessageLogs" PRIMARY KEY ("Id")
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260608071000_FixSchemaMismatches') THEN
    CREATE TABLE "NotificationLogs" (
        "Id" uuid NOT NULL,
        "UserId" uuid NOT NULL,
        "Title" text NOT NULL,
        "Message" text NOT NULL,
        "SentAt" timestamp with time zone NOT NULL,
        "IsRead" boolean NOT NULL,
        "IsDelivered" boolean NOT NULL,
        "Type" text NOT NULL,
        CONSTRAINT "PK_NotificationLogs" PRIMARY KEY ("Id")
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260608071000_FixSchemaMismatches') THEN
    CREATE TABLE "PreRegistrations" (
        "PreRegistrationId" uuid NOT NULL,
        "FullName" character varying(150) NOT NULL,
        "Email" character varying(150) NOT NULL,
        "PhoneNumber" character varying(30) NOT NULL,
        "AddressLine1" character varying(200) NOT NULL,
        "AddressLine2" character varying(200),
        "City" character varying(100) NOT NULL,
        "StateProvince" character varying(100) NOT NULL,
        "PostalCode" character varying(20) NOT NULL,
        "Country" character varying(100) NOT NULL,
        "Address" character varying(600) NOT NULL,
        "ConsentGiven" boolean NOT NULL,
        "Source" character varying(50) NOT NULL,
        "IsLaunchInviteSent" boolean NOT NULL,
        "InviteSentOn" timestamp with time zone,
        "CreatedOn" timestamp with time zone NOT NULL,
        "UpdatedOn" timestamp with time zone,
        "IsDeleted" boolean NOT NULL,
        CONSTRAINT "PK_PreRegistrations" PRIMARY KEY ("PreRegistrationId")
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260608071000_FixSchemaMismatches') THEN
    CREATE TABLE "Rituals" (
        "Id" uuid NOT NULL,
        "Title" character varying(100) NOT NULL,
        "Description" character varying(500) NOT NULL,
        "Duration" character varying(50) NOT NULL,
        "Category" character varying(50) NOT NULL,
        "IconType" character varying(50) NOT NULL,
        CONSTRAINT "PK_Rituals" PRIMARY KEY ("Id")
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260608071000_FixSchemaMismatches') THEN
    CREATE TABLE "Roles" (
        "Id" integer GENERATED BY DEFAULT AS IDENTITY,
        "RoleName" character varying(50) NOT NULL,
        "CreatedOn" timestamp with time zone NOT NULL,
        "UpdatedOn" timestamp with time zone NOT NULL,
        CONSTRAINT "PK_Roles" PRIMARY KEY ("Id")
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260608071000_FixSchemaMismatches') THEN
    CREATE TABLE "SacredGuidePurchase" (
        "PurchaseId" uuid NOT NULL,
        "SacredGuideId" uuid NOT NULL,
        "UserId" uuid NOT NULL,
        "AmountPaid" numeric(10,2) NOT NULL,
        "PurchasedOn" timestamp with time zone NOT NULL,
        "PaymentStatus" character varying(50) NOT NULL,
        CONSTRAINT "PK_SacredGuidePurchase" PRIMARY KEY ("PurchaseId")
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260608071000_FixSchemaMismatches') THEN
    CREATE TABLE "SacredGuides" (
        "SacredGuideId" uuid NOT NULL,
        "Title" character varying(300),
        "Description" character varying(2000),
        "PdfUrl" character varying(500),
        "Price" numeric(10,2) NOT NULL,
        "Status" character varying(50) NOT NULL,
        "TotalPages" integer,
        "Chapters" text,
        "Distribution" character varying(100),
        "PreviewPercentage" integer NOT NULL,
        "AllowFreeUserDownload" boolean NOT NULL,
        "RequiresPremium" boolean NOT NULL,
        "CreatedOn" timestamp with time zone NOT NULL,
        "UpdatedOn" timestamp with time zone,
        "IsActive" boolean NOT NULL,
        CONSTRAINT "PK_SacredGuides" PRIMARY KEY ("SacredGuideId")
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260608071000_FixSchemaMismatches') THEN
    CREATE TABLE "Scores" (
        "Id" uuid NOT NULL,
        "Name" text NOT NULL,
        "Points" integer NOT NULL,
        "CreatedAt" timestamp with time zone NOT NULL,
        CONSTRAINT "PK_Scores" PRIMARY KEY ("Id")
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260608071000_FixSchemaMismatches') THEN
    CREATE TABLE "ScoringRules" (
        "Id" uuid NOT NULL,
        "RuleName" character varying(100) NOT NULL,
        "Points" numeric NOT NULL,
        "Description" character varying(500),
        "CreatedAt" timestamp with time zone NOT NULL,
        CONSTRAINT "PK_ScoringRules" PRIMARY KEY ("Id")
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260608071000_FixSchemaMismatches') THEN
    CREATE TABLE "SiteSettings" (
        "SettingKey" character varying(100) NOT NULL,
        "SettingValue" text NOT NULL,
        CONSTRAINT "PK_SiteSettings" PRIMARY KEY ("SettingKey")
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260608071000_FixSchemaMismatches') THEN
    CREATE TABLE "StressEvents" (
        "Id" uuid NOT NULL,
        "UserId" uuid NOT NULL,
        "TimestampUtc" timestamp with time zone NOT NULL,
        "HRVAtEvent" double precision NOT NULL,
        "HRAtEvent" integer NOT NULL,
        "BaselineHRV" double precision NOT NULL,
        "BaselineHR" double precision NOT NULL,
        "DeviationScore" double precision NOT NULL,
        "DogStateAtEvent" text,
        "AlertFired" boolean NOT NULL,
        "OutcomeLogged" boolean NOT NULL,
        CONSTRAINT "PK_StressEvents" PRIMARY KEY ("Id")
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260608071000_FixSchemaMismatches') THEN
    CREATE TABLE "SubscriptionPlans" (
        "PlanId" uuid NOT NULL,
        "PlanName" character varying(100) NOT NULL,
        "Description" character varying(500),
        "Price" numeric(10,2) NOT NULL,
        "Currency" character varying(10) NOT NULL,
        "BillingPeriod" character varying(50) NOT NULL,
        "TierLevel" character varying(20) NOT NULL,
        "StripePriceId" character varying(255),
        "Features" text,
        "Badge" character varying(50),
        "SavingsText" character varying(100),
        "DisplayOrder" integer NOT NULL,
        "IsActive" boolean NOT NULL,
        "CreatedOn" timestamp with time zone NOT NULL,
        "UpdatedOn" timestamp with time zone,
        CONSTRAINT "PK_SubscriptionPlans" PRIMARY KEY ("PlanId")
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260608071000_FixSchemaMismatches') THEN
    CREATE TABLE "SyncScoreRecords" (
        "Id" uuid NOT NULL,
        "UserId" uuid NOT NULL,
        "DogId" uuid NOT NULL,
        "Score" integer NOT NULL,
        "Trend" character varying(50) NOT NULL,
        "HRVStabilityScore" integer NOT NULL,
        "SharedActivityScore" integer NOT NULL,
        "DogCalmScore" integer NOT NULL,
        "SleepQualityScore" integer NOT NULL,
        "CalculatedAt" timestamp with time zone NOT NULL,
        CONSTRAINT "PK_SyncScoreRecords" PRIMARY KEY ("Id")
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260608071000_FixSchemaMismatches') THEN
    CREATE TABLE "Tags" (
        "TagId" integer GENERATED BY DEFAULT AS IDENTITY,
        "TagName" text NOT NULL,
        CONSTRAINT "PK_Tags" PRIMARY KEY ("TagId")
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260608071000_FixSchemaMismatches') THEN
    CREATE TABLE "TargetCycles" (
        "Id" uuid NOT NULL,
        "Cycles" integer NOT NULL,
        "DurationDescription" character varying(50) NOT NULL,
        "IsActive" boolean NOT NULL,
        "IsDeleted" boolean NOT NULL,
        "CreatedOn" timestamp with time zone NOT NULL,
        "UpdatedOn" timestamp with time zone,
        CONSTRAINT "PK_TargetCycles" PRIMARY KEY ("Id")
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260608071000_FixSchemaMismatches') THEN
    CREATE TABLE "TrendingTopics" (
        "Id" uuid NOT NULL,
        "TopicName" character varying(100) NOT NULL,
        "Count" text NOT NULL,
        "CreatedOn" timestamp with time zone NOT NULL,
        CONSTRAINT "PK_TrendingTopics" PRIMARY KEY ("Id")
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260608071000_FixSchemaMismatches') THEN
    CREATE TABLE "UserActivitiesScores" (
        "Id" uuid NOT NULL,
        "UserId" uuid NOT NULL,
        "ActivityId" uuid NOT NULL,
        "Score" integer,
        "ActivityDetails" text NOT NULL,
        "CreatedAt" timestamp with time zone NOT NULL,
        "ActivityDate" timestamp with time zone,
        CONSTRAINT "PK_UserActivitiesScores" PRIMARY KEY ("Id")
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260608071000_FixSchemaMismatches') THEN
    CREATE TABLE "UserBaselines" (
        "Id" uuid NOT NULL,
        "UserId" uuid NOT NULL,
        "AvgHeartRate" double precision,
        "AvgHRV" double precision,
        "HRVStdDev" double precision,
        "AvgSleepScore" double precision,
        "AvgSteps" double precision,
        "AvgAmbientTemperature" double precision,
        "AvgDeepSleepMinutes" double precision,
        "AvgRemSleepMinutes" double precision,
        "AvgLightSleepMinutes" double precision,
        "AvgAwakeSleepMinutes" double precision,
        "AvgStressScore" double precision,
        "AvgCalories" double precision,
        "AvgDistance" double precision,
        "LastUpdatedUtc" timestamp with time zone,
        "BaselineCreatedAt" timestamp with time zone,
        "BaselineUpdatedAt" timestamp with time zone,
        "DaysOfDataCollected" integer,
        "HumanBaselineEstablished" boolean,
        "IsComplete" boolean,
        "IsTestMode" boolean,
        CONSTRAINT "PK_UserBaselines" PRIMARY KEY ("Id")
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260608071000_FixSchemaMismatches') THEN
    CREATE TABLE "UserBreathingPreferences" (
        "Id" uuid NOT NULL,
        "UserId" uuid NOT NULL,
        "PatternId" uuid,
        "PatternName" text NOT NULL,
        "TargetCycles" integer NOT NULL,
        "CreatedAt" timestamp with time zone NOT NULL,
        "UpdatedAt" timestamp with time zone,
        CONSTRAINT "PK_UserBreathingPreferences" PRIMARY KEY ("Id")
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260608071000_FixSchemaMismatches') THEN
    CREATE TABLE "UserChakraRatings" (
        "UserChakraRatingId" uuid NOT NULL,
        "UserId" uuid NOT NULL,
        "ChakraId" uuid NOT NULL,
        "Rating" integer NOT NULL,
        "Notes" text,
        "CreatedOn" timestamp with time zone NOT NULL,
        "UpdatedOn" timestamp with time zone,
        CONSTRAINT "PK_UserChakraRatings" PRIMARY KEY ("UserChakraRatingId")
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260608071000_FixSchemaMismatches') THEN
    CREATE TABLE "UserOtps" (
        "Id" uuid NOT NULL,
        "UserId" uuid NOT NULL,
        "Email" text NOT NULL,
        "OtpCode" text NOT NULL,
        "ExpiryTime" timestamp with time zone,
        "IsUsed" boolean NOT NULL,
        "CreatedAt" timestamp with time zone NOT NULL,
        CONSTRAINT "PK_UserOtps" PRIMARY KEY ("Id")
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260608071000_FixSchemaMismatches') THEN
    CREATE TABLE "UserSpiritualTraits" (
        "TraitId" uuid NOT NULL,
        "TraitName" character varying(100) NOT NULL,
        "Description" character varying(500),
        "IsActive" boolean NOT NULL,
        "IsDeleted" boolean NOT NULL,
        "CreatedAt" timestamp with time zone NOT NULL,
        CONSTRAINT "PK_UserSpiritualTraits" PRIMARY KEY ("TraitId")
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260608071000_FixSchemaMismatches') THEN
    CREATE TABLE "WellnessAlerts" (
        "Id" uuid NOT NULL,
        "UserId" uuid NOT NULL,
        "DogId" uuid NOT NULL,
        "AlertType" character varying(50) NOT NULL,
        "Suggestion" character varying(500) NOT NULL,
        "DogStateAtAlert" character varying(50),
        "HRVAtAlert" double precision NOT NULL,
        "HRAtAlert" integer NOT NULL,
        "IsDogNearby" boolean,
        "DistanceMetres" double precision,
        "IsActedOn" boolean NOT NULL,
        "Outcome" character varying(50),
        "RecoveryMessage" character varying(500),
        "CreatedAt" timestamp with time zone NOT NULL,
        "ResolvedAt" timestamp with time zone,
        CONSTRAINT "PK_WellnessAlerts" PRIMARY KEY ("Id")
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260608071000_FixSchemaMismatches') THEN
    CREATE TABLE "DogDailySummaries" (
        "Id" uuid NOT NULL,
        "DogId" uuid NOT NULL,
        "UserId" uuid NOT NULL,
        "Date" timestamp with time zone NOT NULL,
        "AvgHeartRate" double precision NOT NULL,
        "AvgTemperature" double precision NOT NULL,
        "AvgActivityScore" double precision NOT NULL,
        "AvgRestScore" double precision NOT NULL,
        "AvgRespirationRate" double precision NOT NULL,
        "MinHeartRate" double precision NOT NULL,
        "MaxHeartRate" double precision NOT NULL,
        "MinTemperature" double precision NOT NULL,
        "MaxTemperature" double precision NOT NULL,
        "RestPercentage" double precision NOT NULL,
        "ActivePercentage" double precision NOT NULL,
        "PlayPercentage" double precision NOT NULL,
        "SleepPercentage" double precision NOT NULL,
        "DataPointsCount" integer NOT NULL,
        "CreatedAt" timestamp with time zone NOT NULL,
        CONSTRAINT "PK_DogDailySummaries" PRIMARY KEY ("Id"),
        CONSTRAINT "FK_DogDailySummaries_DogProfiles_DogId" FOREIGN KEY ("DogId") REFERENCES "DogProfiles" ("Id") ON DELETE CASCADE,
        CONSTRAINT "FK_DogDailySummaries_HumanProfiles_UserId" FOREIGN KEY ("UserId") REFERENCES "HumanProfiles" ("Id") ON DELETE CASCADE
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260608071000_FixSchemaMismatches') THEN
    CREATE TABLE "HumanDailySummaries" (
        "Id" uuid NOT NULL,
        "UserId" uuid NOT NULL,
        "Date" timestamp with time zone NOT NULL,
        "AvgHeartRate" double precision,
        "AvgHRV" double precision,
        "TotalSteps" integer,
        "AvgCalories" double precision,
        "AvgDistance" double precision,
        "AvgActiveMinutes" double precision,
        "AvgSleepMinutes" double precision,
        "AvgStressScore" double precision,
        "AvgAmbientTemperature" double precision,
        "SyncScore" integer,
        "SyncTrend" text,
        "DataPointsCount" integer,
        "CreatedAt" timestamp with time zone,
        "UpdatedAt" timestamp with time zone,
        CONSTRAINT "PK_HumanDailySummaries" PRIMARY KEY ("Id"),
        CONSTRAINT "FK_HumanDailySummaries_HumanProfiles_UserId" FOREIGN KEY ("UserId") REFERENCES "HumanProfiles" ("Id") ON DELETE CASCADE
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260608071000_FixSchemaMismatches') THEN
    CREATE TABLE "RitualLogs" (
        "Id" uuid NOT NULL,
        "RitualId" uuid NOT NULL,
        "UserId" uuid NOT NULL,
        "CompletedAt" timestamp with time zone NOT NULL,
        "BonusAwarded" boolean NOT NULL,
        CONSTRAINT "PK_RitualLogs" PRIMARY KEY ("Id"),
        CONSTRAINT "FK_RitualLogs_Rituals_RitualId" FOREIGN KEY ("RitualId") REFERENCES "Rituals" ("Id") ON DELETE CASCADE
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260608071000_FixSchemaMismatches') THEN
    CREATE TABLE "Users" (
        "UserId" uuid NOT NULL,
        "FullName" character varying(150) NOT NULL,
        "Email" character varying(150) NOT NULL,
        "PasswordHash" character varying(500) NOT NULL,
        "RoleId" integer,
        "CreatedOn" timestamp with time zone NOT NULL,
        "UpdatedOn" timestamp with time zone,
        "IsActive" boolean NOT NULL,
        "IsDeleted" boolean NOT NULL,
        "IsTermAccepted" boolean NOT NULL,
        "IsGoogleSignIn" boolean NOT NULL,
        "IsEmailVerified" boolean NOT NULL,
        "IsProfileSetupCompleted" boolean,
        "ProfilePhoto" character varying(500),
        "ProfileName" text,
        "Status" text NOT NULL,
        "TierLevel" character varying(20) NOT NULL,
        "IsPremium" boolean NOT NULL,
        "Age" integer,
        "StripeCustomerId" character varying(255),
        "FitbitAccessToken" character varying(500),
        "FitbitRefreshToken" character varying(500),
        "FitbitTokenExpiresAt" timestamp with time zone,
        "FitbitUserId" character varying(50),
        "FitBarkAccessToken" character varying(500),
        "FitBarkRefreshToken" character varying(500),
        "FitBarkTokenExpiresAt" timestamp with time zone,
        "FitBarkUserId" character varying(100),
        CONSTRAINT "PK_Users" PRIMARY KEY ("UserId"),
        CONSTRAINT "FK_Users_Roles_RoleId" FOREIGN KEY ("RoleId") REFERENCES "Roles" ("Id")
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260608071000_FixSchemaMismatches') THEN
    CREATE TABLE "CommunityPosts" (
        "PostId" uuid NOT NULL,
        "UserId" uuid NOT NULL,
        "Content" character varying(2000) NOT NULL,
        "ImageUrl" character varying(500),
        "LikeCount" integer NOT NULL,
        "CommentCount" integer NOT NULL,
        "CreatedOn" timestamp with time zone NOT NULL,
        "UpdatedOn" timestamp with time zone,
        "IsDeleted" boolean NOT NULL,
        "ModerationStatus" character varying(50),
        "Hashtags" character varying(500),
        CONSTRAINT "PK_CommunityPosts" PRIMARY KEY ("PostId"),
        CONSTRAINT "FK_CommunityPosts_Users_UserId" FOREIGN KEY ("UserId") REFERENCES "Users" ("UserId") ON DELETE CASCADE
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260608071000_FixSchemaMismatches') THEN
    CREATE TABLE "Dogs" (
        "DogId" uuid NOT NULL,
        "UserId" uuid NOT NULL,
        "DogName" character varying(100) NOT NULL,
        "ProfilePhoto" character varying(500),
        "CreatedOn" timestamp with time zone NOT NULL,
        "UpdatedOn" timestamp with time zone,
        "CurrentScore" double precision NOT NULL,
        "Breed" text,
        "Age" integer,
        "Weight" double precision,
        "IsActive" boolean NOT NULL,
        "IsDeleted" boolean NOT NULL,
        CONSTRAINT "PK_Dogs" PRIMARY KEY ("DogId"),
        CONSTRAINT "FK_Dogs_Users_UserId" FOREIGN KEY ("UserId") REFERENCES "Users" ("UserId") ON DELETE CASCADE
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260608071000_FixSchemaMismatches') THEN
    CREATE TABLE "ExpertQueries" (
        "Id" uuid NOT NULL,
        "UserId" uuid NOT NULL,
        "CompanionName" character varying(100),
        "Category" character varying(100) NOT NULL,
        "Priority" character varying(20) NOT NULL,
        "Subject" character varying(200) NOT NULL,
        "QuestionText" text NOT NULL,
        "Status" character varying(50) NOT NULL,
        "IsDeleted" boolean NOT NULL,
        "CreatedOn" timestamp with time zone NOT NULL,
        "AdminResponse" text,
        "RespondedOn" timestamp with time zone,
        CONSTRAINT "PK_ExpertQueries" PRIMARY KEY ("Id"),
        CONSTRAINT "FK_ExpertQueries_Users_UserId" FOREIGN KEY ("UserId") REFERENCES "Users" ("UserId") ON DELETE CASCADE
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260608071000_FixSchemaMismatches') THEN
    CREATE TABLE "HealingCircleRegistrations" (
        "RegistrationId" uuid NOT NULL,
        "CircleId" uuid NOT NULL,
        "UserId" uuid NOT NULL,
        "RegisteredOn" timestamp with time zone NOT NULL,
        CONSTRAINT "PK_HealingCircleRegistrations" PRIMARY KEY ("RegistrationId"),
        CONSTRAINT "FK_HealingCircleRegistrations_HealingCircles_CircleId" FOREIGN KEY ("CircleId") REFERENCES "HealingCircles" ("Id") ON DELETE CASCADE,
        CONSTRAINT "FK_HealingCircleRegistrations_Users_UserId" FOREIGN KEY ("UserId") REFERENCES "Users" ("UserId") ON DELETE CASCADE
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260608071000_FixSchemaMismatches') THEN
    CREATE TABLE "SacredGuideWaitlist" (
        "WaitlistId" uuid NOT NULL,
        "SacredGuideId" uuid NOT NULL,
        "UserId" uuid NOT NULL,
        "JoinedOn" timestamp with time zone NOT NULL,
        "IsNotified" boolean NOT NULL,
        CONSTRAINT "PK_SacredGuideWaitlist" PRIMARY KEY ("WaitlistId"),
        CONSTRAINT "FK_SacredGuideWaitlist_SacredGuides_SacredGuideId" FOREIGN KEY ("SacredGuideId") REFERENCES "SacredGuides" ("SacredGuideId") ON DELETE CASCADE,
        CONSTRAINT "FK_SacredGuideWaitlist_Users_UserId" FOREIGN KEY ("UserId") REFERENCES "Users" ("UserId") ON DELETE CASCADE
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260608071000_FixSchemaMismatches') THEN
    CREATE TABLE "Subscriptions" (
        "SubscriptionId" uuid NOT NULL,
        "UserId" uuid NOT NULL,
        "StripeCustomerId" character varying(255),
        "StripeSubscriptionId" character varying(255) NOT NULL,
        "StripePriceId" character varying(255),
        "PlanName" character varying(100),
        "Status" character varying(50),
        "CurrentPeriodStart" timestamp with time zone,
        "CurrentPeriodEnd" timestamp with time zone,
        "CancelAtPeriodEnd" boolean NOT NULL,
        "Amount" numeric(10,2),
        "Currency" character varying(10) NOT NULL,
        "CreatedOn" timestamp with time zone NOT NULL,
        "UpdatedOn" timestamp with time zone,
        CONSTRAINT "PK_Subscriptions" PRIMARY KEY ("SubscriptionId"),
        CONSTRAINT "FK_Subscriptions_Users_UserId" FOREIGN KEY ("UserId") REFERENCES "Users" ("UserId") ON DELETE CASCADE
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260608071000_FixSchemaMismatches') THEN
    CREATE TABLE "UserBondingActivities" (
        "Id" integer GENERATED BY DEFAULT AS IDENTITY,
        "UserId" uuid NOT NULL,
        "ActivityId" uuid NOT NULL,
        "ActivityDate" timestamp with time zone NOT NULL,
        "CreatedAt" timestamp with time zone NOT NULL,
        CONSTRAINT "PK_UserBondingActivities" PRIMARY KEY ("Id"),
        CONSTRAINT "FK_UserBondingActivities_BondingActivities_ActivityId" FOREIGN KEY ("ActivityId") REFERENCES "BondingActivities" ("ActivityId") ON DELETE CASCADE,
        CONSTRAINT "FK_UserBondingActivities_Users_UserId" FOREIGN KEY ("UserId") REFERENCES "Users" ("UserId") ON DELETE CASCADE
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260608071000_FixSchemaMismatches') THEN
    CREATE TABLE "UserChakraProgresses" (
        "ChakraProgressId" uuid NOT NULL,
        "UserId" uuid NOT NULL,
        "ChakraId" uuid NOT NULL,
        "PauseTimeInSeconds" integer,
        "IsCompleted" boolean NOT NULL,
        "LastPlayedOn" timestamp with time zone NOT NULL,
        "CreatedOn" timestamp with time zone NOT NULL,
        "UpdatedOn" timestamp with time zone,
        CONSTRAINT "PK_UserChakraProgresses" PRIMARY KEY ("ChakraProgressId"),
        CONSTRAINT "FK_UserChakraProgresses_Chakras_ChakraId" FOREIGN KEY ("ChakraId") REFERENCES "Chakras" ("ChakraId") ON DELETE CASCADE,
        CONSTRAINT "FK_UserChakraProgresses_Users_UserId" FOREIGN KEY ("UserId") REFERENCES "Users" ("UserId") ON DELETE CASCADE
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260608071000_FixSchemaMismatches') THEN
    CREATE TABLE "UserCheckIns" (
        "Id" uuid NOT NULL,
        "UserId" uuid NOT NULL,
        "CheckInId" uuid NOT NULL,
        "Rating" integer,
        "CreatedOn" timestamp with time zone NOT NULL,
        "UpdatedOn" timestamp with time zone,
        "DailyPointsChange" integer,
        "ScoreSnapshot" integer,
        "ActivityDate" timestamp with time zone,
        "IsMissed" boolean NOT NULL,
        CONSTRAINT "PK_UserCheckIns" PRIMARY KEY ("Id"),
        CONSTRAINT "FK_UserCheckIns_CheckIns_CheckInId" FOREIGN KEY ("CheckInId") REFERENCES "CheckIns" ("CheckInId") ON DELETE CASCADE,
        CONSTRAINT "FK_UserCheckIns_Users_UserId" FOREIGN KEY ("UserId") REFERENCES "Users" ("UserId") ON DELETE CASCADE
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260608071000_FixSchemaMismatches') THEN
    CREATE TABLE "UserCredits" (
        "Id" uuid NOT NULL,
        "UserId" uuid NOT NULL,
        "CreditType" character varying(50) NOT NULL,
        "CreditsTotal" integer NOT NULL,
        "CreditsUsed" integer NOT NULL,
        "BillingCycleStart" timestamp with time zone NOT NULL,
        "BillingCycleEnd" timestamp with time zone NOT NULL,
        "IsDeleted" boolean NOT NULL,
        "CreatedOn" timestamp with time zone NOT NULL,
        "UpdatedOn" timestamp with time zone,
        CONSTRAINT "PK_UserCredits" PRIMARY KEY ("Id"),
        CONSTRAINT "FK_UserCredits_Users_UserId" FOREIGN KEY ("UserId") REFERENCES "Users" ("UserId") ON DELETE CASCADE
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260608071000_FixSchemaMismatches') THEN
    CREATE TABLE "UserSelectedTraits" (
        "Id" uuid NOT NULL,
        "UserId" uuid NOT NULL,
        "TraitId" uuid NOT NULL,
        "IsSelected" boolean NOT NULL,
        "CreatedOn" timestamp with time zone NOT NULL,
        CONSTRAINT "PK_UserSelectedTraits" PRIMARY KEY ("Id"),
        CONSTRAINT "FK_UserSelectedTraits_UserSpiritualTraits_TraitId" FOREIGN KEY ("TraitId") REFERENCES "UserSpiritualTraits" ("TraitId") ON DELETE CASCADE,
        CONSTRAINT "FK_UserSelectedTraits_Users_UserId" FOREIGN KEY ("UserId") REFERENCES "Users" ("UserId") ON DELETE CASCADE
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260608071000_FixSchemaMismatches') THEN
    CREATE TABLE "CommunityComments" (
        "CommentId" uuid NOT NULL,
        "PostId" uuid NOT NULL,
        "UserId" uuid NOT NULL,
        "Content" character varying(1000) NOT NULL,
        "CreatedOn" timestamp with time zone NOT NULL,
        "IsDeleted" boolean NOT NULL,
        "ParentCommentId" uuid,
        CONSTRAINT "PK_CommunityComments" PRIMARY KEY ("CommentId"),
        CONSTRAINT "FK_CommunityComments_CommunityComments_ParentCommentId" FOREIGN KEY ("ParentCommentId") REFERENCES "CommunityComments" ("CommentId"),
        CONSTRAINT "FK_CommunityComments_CommunityPosts_PostId" FOREIGN KEY ("PostId") REFERENCES "CommunityPosts" ("PostId") ON DELETE CASCADE,
        CONSTRAINT "FK_CommunityComments_Users_UserId" FOREIGN KEY ("UserId") REFERENCES "Users" ("UserId") ON DELETE CASCADE
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260608071000_FixSchemaMismatches') THEN
    CREATE TABLE "CommunityLikes" (
        "LikeId" uuid NOT NULL,
        "PostId" uuid NOT NULL,
        "UserId" uuid NOT NULL,
        "CreatedOn" timestamp with time zone NOT NULL,
        CONSTRAINT "PK_CommunityLikes" PRIMARY KEY ("LikeId"),
        CONSTRAINT "FK_CommunityLikes_CommunityPosts_PostId" FOREIGN KEY ("PostId") REFERENCES "CommunityPosts" ("PostId") ON DELETE CASCADE,
        CONSTRAINT "FK_CommunityLikes_Users_UserId" FOREIGN KEY ("UserId") REFERENCES "Users" ("UserId") ON DELETE CASCADE
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260608071000_FixSchemaMismatches') THEN
    CREATE TABLE "DogSelectedTraits" (
        "Id" uuid NOT NULL,
        "DogId" uuid NOT NULL,
        "UserId" uuid NOT NULL,
        "TraitId" uuid NOT NULL,
        "IsSelected" boolean NOT NULL,
        "CreatedOn" timestamp with time zone NOT NULL,
        CONSTRAINT "PK_DogSelectedTraits" PRIMARY KEY ("Id"),
        CONSTRAINT "FK_DogSelectedTraits_DogSpiritualTraits_TraitId" FOREIGN KEY ("TraitId") REFERENCES "DogSpiritualTraits" ("TraitId") ON DELETE CASCADE,
        CONSTRAINT "FK_DogSelectedTraits_Dogs_DogId" FOREIGN KEY ("DogId") REFERENCES "Dogs" ("DogId") ON DELETE CASCADE,
        CONSTRAINT "FK_DogSelectedTraits_Users_UserId" FOREIGN KEY ("UserId") REFERENCES "Users" ("UserId") ON DELETE CASCADE
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260608071000_FixSchemaMismatches') THEN
    CREATE TABLE "SubscriptionLogs" (
        "LogId" uuid NOT NULL,
        "SubscriptionId" uuid,
        "UserId" uuid,
        "EventType" character varying(100) NOT NULL,
        "EventData" text,
        "CreatedOn" timestamp with time zone NOT NULL,
        CONSTRAINT "PK_SubscriptionLogs" PRIMARY KEY ("LogId"),
        CONSTRAINT "FK_SubscriptionLogs_Subscriptions_SubscriptionId" FOREIGN KEY ("SubscriptionId") REFERENCES "Subscriptions" ("SubscriptionId"),
        CONSTRAINT "FK_SubscriptionLogs_Users_UserId" FOREIGN KEY ("UserId") REFERENCES "Users" ("UserId")
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260608071000_FixSchemaMismatches') THEN
    CREATE TABLE "PostReports" (
        "ReportId" uuid NOT NULL,
        "PostId" uuid,
        "CommentId" uuid,
        "ReporterUserId" uuid NOT NULL,
        "ReportedUserId" uuid,
        "ReportType" character varying(50) NOT NULL,
        "Priority" character varying(20) NOT NULL,
        "Status" character varying(20) NOT NULL,
        "Reason" character varying(255) NOT NULL,
        "Description" text,
        "ReportedOn" timestamp with time zone NOT NULL,
        CONSTRAINT "PK_PostReports" PRIMARY KEY ("ReportId"),
        CONSTRAINT "FK_PostReports_CommunityComments_CommentId" FOREIGN KEY ("CommentId") REFERENCES "CommunityComments" ("CommentId"),
        CONSTRAINT "FK_PostReports_CommunityPosts_PostId" FOREIGN KEY ("PostId") REFERENCES "CommunityPosts" ("PostId"),
        CONSTRAINT "FK_PostReports_Users_ReportedUserId" FOREIGN KEY ("ReportedUserId") REFERENCES "Users" ("UserId"),
        CONSTRAINT "FK_PostReports_Users_ReporterUserId" FOREIGN KEY ("ReporterUserId") REFERENCES "Users" ("UserId") ON DELETE CASCADE
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260608071000_FixSchemaMismatches') THEN
    CREATE INDEX "IX_CommunityComments_ParentCommentId" ON "CommunityComments" ("ParentCommentId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260608071000_FixSchemaMismatches') THEN
    CREATE INDEX "IX_CommunityComments_PostId" ON "CommunityComments" ("PostId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260608071000_FixSchemaMismatches') THEN
    CREATE INDEX "IX_CommunityComments_UserId" ON "CommunityComments" ("UserId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260608071000_FixSchemaMismatches') THEN
    CREATE INDEX "IX_CommunityLikes_PostId" ON "CommunityLikes" ("PostId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260608071000_FixSchemaMismatches') THEN
    CREATE INDEX "IX_CommunityLikes_UserId" ON "CommunityLikes" ("UserId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260608071000_FixSchemaMismatches') THEN
    CREATE INDEX "IX_CommunityPosts_UserId" ON "CommunityPosts" ("UserId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260608071000_FixSchemaMismatches') THEN
    CREATE INDEX "IX_DogDailySummaries_DogId" ON "DogDailySummaries" ("DogId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260608071000_FixSchemaMismatches') THEN
    CREATE INDEX "IX_DogDailySummaries_UserId" ON "DogDailySummaries" ("UserId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260608071000_FixSchemaMismatches') THEN
    CREATE UNIQUE INDEX "IX_Dogs_UserId" ON "Dogs" ("UserId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260608071000_FixSchemaMismatches') THEN
    CREATE INDEX "IX_DogSelectedTraits_DogId" ON "DogSelectedTraits" ("DogId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260608071000_FixSchemaMismatches') THEN
    CREATE INDEX "IX_DogSelectedTraits_TraitId" ON "DogSelectedTraits" ("TraitId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260608071000_FixSchemaMismatches') THEN
    CREATE INDEX "IX_DogSelectedTraits_UserId" ON "DogSelectedTraits" ("UserId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260608071000_FixSchemaMismatches') THEN
    CREATE INDEX "IX_ExpertQueries_UserId" ON "ExpertQueries" ("UserId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260608071000_FixSchemaMismatches') THEN
    CREATE INDEX "IX_HealingCircleRegistrations_CircleId" ON "HealingCircleRegistrations" ("CircleId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260608071000_FixSchemaMismatches') THEN
    CREATE INDEX "IX_HealingCircleRegistrations_UserId" ON "HealingCircleRegistrations" ("UserId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260608071000_FixSchemaMismatches') THEN
    CREATE INDEX "IX_HumanDailySummaries_UserId" ON "HumanDailySummaries" ("UserId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260608071000_FixSchemaMismatches') THEN
    CREATE INDEX "IX_PostReports_CommentId" ON "PostReports" ("CommentId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260608071000_FixSchemaMismatches') THEN
    CREATE INDEX "IX_PostReports_PostId" ON "PostReports" ("PostId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260608071000_FixSchemaMismatches') THEN
    CREATE INDEX "IX_PostReports_ReportedUserId" ON "PostReports" ("ReportedUserId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260608071000_FixSchemaMismatches') THEN
    CREATE INDEX "IX_PostReports_ReporterUserId" ON "PostReports" ("ReporterUserId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260608071000_FixSchemaMismatches') THEN
    CREATE INDEX "IX_RitualLogs_RitualId" ON "RitualLogs" ("RitualId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260608071000_FixSchemaMismatches') THEN
    CREATE INDEX "IX_SacredGuideWaitlist_SacredGuideId" ON "SacredGuideWaitlist" ("SacredGuideId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260608071000_FixSchemaMismatches') THEN
    CREATE INDEX "IX_SacredGuideWaitlist_UserId" ON "SacredGuideWaitlist" ("UserId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260608071000_FixSchemaMismatches') THEN
    CREATE INDEX "IX_SubscriptionLogs_SubscriptionId" ON "SubscriptionLogs" ("SubscriptionId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260608071000_FixSchemaMismatches') THEN
    CREATE INDEX "IX_SubscriptionLogs_UserId" ON "SubscriptionLogs" ("UserId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260608071000_FixSchemaMismatches') THEN
    CREATE INDEX "IX_Subscriptions_UserId" ON "Subscriptions" ("UserId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260608071000_FixSchemaMismatches') THEN
    CREATE INDEX "IX_UserBondingActivities_ActivityId" ON "UserBondingActivities" ("ActivityId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260608071000_FixSchemaMismatches') THEN
    CREATE INDEX "IX_UserBondingActivities_UserId" ON "UserBondingActivities" ("UserId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260608071000_FixSchemaMismatches') THEN
    CREATE INDEX "IX_UserChakraProgresses_ChakraId" ON "UserChakraProgresses" ("ChakraId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260608071000_FixSchemaMismatches') THEN
    CREATE INDEX "IX_UserChakraProgresses_UserId" ON "UserChakraProgresses" ("UserId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260608071000_FixSchemaMismatches') THEN
    CREATE INDEX "IX_UserCheckIns_CheckInId" ON "UserCheckIns" ("CheckInId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260608071000_FixSchemaMismatches') THEN
    CREATE INDEX "IX_UserCheckIns_UserId" ON "UserCheckIns" ("UserId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260608071000_FixSchemaMismatches') THEN
    CREATE INDEX "IX_UserCredits_UserId" ON "UserCredits" ("UserId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260608071000_FixSchemaMismatches') THEN
    CREATE INDEX "IX_Users_RoleId" ON "Users" ("RoleId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260608071000_FixSchemaMismatches') THEN
    CREATE INDEX "IX_UserSelectedTraits_TraitId" ON "UserSelectedTraits" ("TraitId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260608071000_FixSchemaMismatches') THEN
    CREATE INDEX "IX_UserSelectedTraits_UserId" ON "UserSelectedTraits" ("UserId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260608071000_FixSchemaMismatches') THEN
    INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
    VALUES ('20260608071000_FixSchemaMismatches', '9.0.10');
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260617104208_AddCoursesFeature') THEN
    CREATE TABLE "Courses" (
        "Id" uuid NOT NULL,
        "Title" character varying(300) NOT NULL,
        "Description" character varying(2000) NOT NULL,
        "Price" numeric(10,2) NOT NULL,
        "IsFreeWithPlus" boolean NOT NULL,
        "DisplayOrder" integer NOT NULL,
        "Status" character varying(50) NOT NULL,
        "CreatedAt" timestamp with time zone NOT NULL,
        CONSTRAINT "PK_Courses" PRIMARY KEY ("Id")
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260617104208_AddCoursesFeature') THEN
    CREATE TABLE "CourseWaitlists" (
        "Id" uuid NOT NULL,
        "UserId" uuid NOT NULL,
        "CourseId" uuid NOT NULL,
        "JoinedAt" timestamp with time zone NOT NULL,
        CONSTRAINT "PK_CourseWaitlists" PRIMARY KEY ("Id"),
        CONSTRAINT "FK_CourseWaitlists_Courses_CourseId" FOREIGN KEY ("CourseId") REFERENCES "Courses" ("Id") ON DELETE CASCADE,
        CONSTRAINT "FK_CourseWaitlists_Users_UserId" FOREIGN KEY ("UserId") REFERENCES "Users" ("UserId") ON DELETE CASCADE
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260617104208_AddCoursesFeature') THEN
    CREATE UNIQUE INDEX "IX_CourseWaitlists_UserId_CourseId" ON "CourseWaitlists" ("UserId", "CourseId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260617104208_AddCoursesFeature') THEN
    INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
    VALUES ('20260617104208_AddCoursesFeature', '9.0.10');
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260617165015_AddAuthRefreshTokens') THEN
    ALTER TABLE "Users" ADD "RefreshToken" character varying(500);
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260617165015_AddAuthRefreshTokens') THEN
    ALTER TABLE "Users" ADD "RefreshTokenExpiryTime" timestamp with time zone;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260617165015_AddAuthRefreshTokens') THEN
    INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
    VALUES ('20260617165015_AddAuthRefreshTokens', '9.0.10');
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260703054711_AddPreviousRefreshTokenColumns') THEN
    DROP INDEX "IX_Dogs_UserId";
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260703054711_AddPreviousRefreshTokenColumns') THEN
    ALTER TABLE "Users" ADD "IsAdmin" boolean NOT NULL DEFAULT FALSE;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260703054711_AddPreviousRefreshTokenColumns') THEN
    ALTER TABLE "Users" ADD "PreviousRefreshToken" character varying(500);
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260703054711_AddPreviousRefreshTokenColumns') THEN
    ALTER TABLE "Users" ADD "PreviousRefreshTokenExpiryTime" timestamp with time zone;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260703054711_AddPreviousRefreshTokenColumns') THEN
    ALTER TABLE "UserCheckIns" ADD "DogId" uuid;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260703054711_AddPreviousRefreshTokenColumns') THEN
    ALTER TABLE "UserBondingActivities" ADD "DogId" uuid;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260703054711_AddPreviousRefreshTokenColumns') THEN
    ALTER TABLE "UserActivitiesScores" ADD "DogId" uuid;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260703054711_AddPreviousRefreshTokenColumns') THEN
    ALTER TABLE "SubscriptionPlans" ADD "DonationAmount" numeric(10,2) NOT NULL DEFAULT 0.0;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260703054711_AddPreviousRefreshTokenColumns') THEN
    ALTER TABLE "RitualLogs" ADD "DogId" uuid;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260703054711_AddPreviousRefreshTokenColumns') THEN
    ALTER TABLE "JournalEntries" ADD "DogId" uuid;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260703054711_AddPreviousRefreshTokenColumns') THEN
    ALTER TABLE "Dogs" ADD datelost timestamp with time zone;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260703054711_AddPreviousRefreshTokenColumns') THEN
    ALTER TABLE "Dogs" ADD dateofdeath timestamp with time zone;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260703054711_AddPreviousRefreshTokenColumns') THEN
    ALTER TABLE "Dogs" ADD memorynote text;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260703054711_AddPreviousRefreshTokenColumns') THEN
    ALTER TABLE "Dogs" ADD status text NOT NULL DEFAULT '';
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260703054711_AddPreviousRefreshTokenColumns') THEN
    CREATE TABLE "CourseAssessments" (
        "Id" uuid NOT NULL,
        "CourseId" uuid NOT NULL,
        "AssessmentType" character varying(50) NOT NULL,
        "Title" character varying(300) NOT NULL,
        "Description" character varying(2000),
        "PassingScorePercent" integer NOT NULL,
        "DisplayOrder" integer NOT NULL,
        "IsPublished" boolean NOT NULL,
        "CreatedAt" timestamp with time zone NOT NULL,
        "UpdatedAt" timestamp with time zone,
        CONSTRAINT "PK_CourseAssessments" PRIMARY KEY ("Id"),
        CONSTRAINT "FK_CourseAssessments_Courses_CourseId" FOREIGN KEY ("CourseId") REFERENCES "Courses" ("Id") ON DELETE CASCADE
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260703054711_AddPreviousRefreshTokenColumns') THEN
    CREATE TABLE "CourseAudios" (
        "Id" uuid NOT NULL,
        "CourseId" uuid NOT NULL,
        "Title" character varying(300) NOT NULL,
        "Description" character varying(2000),
        "AudioUrl" character varying(1000),
        "DurationSeconds" integer,
        "DisplayOrder" integer NOT NULL,
        "IsPublished" boolean NOT NULL,
        "CreatedAt" timestamp with time zone NOT NULL,
        "UpdatedAt" timestamp with time zone,
        CONSTRAINT "PK_CourseAudios" PRIMARY KEY ("Id"),
        CONSTRAINT "FK_CourseAudios_Courses_CourseId" FOREIGN KEY ("CourseId") REFERENCES "Courses" ("Id") ON DELETE CASCADE
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260703054711_AddPreviousRefreshTokenColumns') THEN
    CREATE TABLE "CourseBookContents" (
        "Id" uuid NOT NULL,
        "CourseId" uuid NOT NULL,
        "Title" character varying(300) NOT NULL,
        "Description" character varying(2000),
        "FileUrl" character varying(1000),
        "DisplayOrder" integer NOT NULL,
        "IsPublished" boolean NOT NULL,
        "CreatedAt" timestamp with time zone NOT NULL,
        "UpdatedAt" timestamp with time zone,
        CONSTRAINT "PK_CourseBookContents" PRIMARY KEY ("Id"),
        CONSTRAINT "FK_CourseBookContents_Courses_CourseId" FOREIGN KEY ("CourseId") REFERENCES "Courses" ("Id") ON DELETE CASCADE
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260703054711_AddPreviousRefreshTokenColumns') THEN
    CREATE TABLE "CourseResources" (
        "Id" uuid NOT NULL,
        "CourseId" uuid NOT NULL,
        "Title" character varying(300) NOT NULL,
        "Description" character varying(2000),
        "FileUrl" character varying(1000),
        "ExternalUrl" character varying(1000),
        "DisplayOrder" integer NOT NULL,
        "IsPublished" boolean NOT NULL,
        "CreatedAt" timestamp with time zone NOT NULL,
        "UpdatedAt" timestamp with time zone,
        CONSTRAINT "PK_CourseResources" PRIMARY KEY ("Id"),
        CONSTRAINT "FK_CourseResources_Courses_CourseId" FOREIGN KEY ("CourseId") REFERENCES "Courses" ("Id") ON DELETE CASCADE
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260703054711_AddPreviousRefreshTokenColumns') THEN
    CREATE TABLE "CourseVideos" (
        "Id" uuid NOT NULL,
        "CourseId" uuid NOT NULL,
        "Title" character varying(300) NOT NULL,
        "Description" character varying(2000),
        "VideoUrl" character varying(1000),
        "ThumbnailUrl" character varying(1000),
        "DurationSeconds" integer,
        "DisplayOrder" integer NOT NULL,
        "IsPublished" boolean NOT NULL,
        "CreatedAt" timestamp with time zone NOT NULL,
        "UpdatedAt" timestamp with time zone,
        CONSTRAINT "PK_CourseVideos" PRIMARY KEY ("Id"),
        CONSTRAINT "FK_CourseVideos_Courses_CourseId" FOREIGN KEY ("CourseId") REFERENCES "Courses" ("Id") ON DELETE CASCADE
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260703054711_AddPreviousRefreshTokenColumns') THEN
    CREATE TABLE "CourseVisuals" (
        "Id" uuid NOT NULL,
        "CourseId" uuid NOT NULL,
        "Title" character varying(300) NOT NULL,
        "Description" character varying(2000),
        "ImageUrl" character varying(1000),
        "DisplayOrder" integer NOT NULL,
        "IsPublished" boolean NOT NULL,
        "CreatedAt" timestamp with time zone NOT NULL,
        "UpdatedAt" timestamp with time zone,
        CONSTRAINT "PK_CourseVisuals" PRIMARY KEY ("Id"),
        CONSTRAINT "FK_CourseVisuals_Courses_CourseId" FOREIGN KEY ("CourseId") REFERENCES "Courses" ("Id") ON DELETE CASCADE
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260703054711_AddPreviousRefreshTokenColumns') THEN
    CREATE TABLE "DetailedAnalysisReports" (
        "Id" uuid NOT NULL,
        "UserId" uuid NOT NULL,
        "DogId" uuid,
        "LatestDogCheckinId" uuid,
        "LatestEnvironmentCheckinId" uuid,
        "BaselineSnapshotJson" text,
        "LatestVitalsSnapshotJson" text,
        "PhotoUrlsJson" text,
        "ReportJson" text,
        "Status" character varying(20) NOT NULL,
        "CreatedAt" timestamp with time zone NOT NULL,
        "UpdatedAt" timestamp with time zone,
        CONSTRAINT "PK_DetailedAnalysisReports" PRIMARY KEY ("Id")
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260703054711_AddPreviousRefreshTokenColumns') THEN
    CREATE TABLE "LegacyProjectAdminPhotos" (
        "Id" uuid NOT NULL,
        "SectionKey" text NOT NULL,
        "PhotoUrl" text NOT NULL,
        "DisplayOrder" integer NOT NULL,
        "UploadedAt" timestamp with time zone NOT NULL,
        CONSTRAINT "PK_LegacyProjectAdminPhotos" PRIMARY KEY ("Id")
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260703054711_AddPreviousRefreshTokenColumns') THEN
    CREATE TABLE "LegacyProjectContents" (
        "Id" uuid NOT NULL,
        "SectionKey" text NOT NULL,
        "Description" text NOT NULL,
        "ImpactStatsJson" text NOT NULL,
        "UpdatedAt" timestamp with time zone NOT NULL,
        CONSTRAINT "PK_LegacyProjectContents" PRIMARY KEY ("Id")
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260703054711_AddPreviousRefreshTokenColumns') THEN
    CREATE TABLE "LegacyProjectUpdates" (
        "Id" uuid NOT NULL,
        "SectionKey" text NOT NULL,
        "Content" text NOT NULL,
        "Date" timestamp with time zone NOT NULL,
        CONSTRAINT "PK_LegacyProjectUpdates" PRIMARY KEY ("Id")
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260703054711_AddPreviousRefreshTokenColumns') THEN
    CREATE TABLE "ResearchSubmissions" (
        "Id" uuid NOT NULL,
        "UserId" uuid NOT NULL,
        "Title" text NOT NULL,
        "Description" text NOT NULL,
        "PhotoUrl" text NOT NULL,
        "Status" text NOT NULL,
        "CreatedAt" timestamp with time zone NOT NULL,
        CONSTRAINT "PK_ResearchSubmissions" PRIMARY KEY ("Id"),
        CONSTRAINT "FK_ResearchSubmissions_Users_UserId" FOREIGN KEY ("UserId") REFERENCES "Users" ("UserId") ON DELETE CASCADE
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260703054711_AddPreviousRefreshTokenColumns') THEN
    CREATE TABLE "SeniorDogSubmissions" (
        "Id" uuid NOT NULL,
        "UserId" uuid NOT NULL,
        "DogName" text NOT NULL,
        "Story" text NOT NULL,
        "PhotoUrl" text NOT NULL,
        "Status" text NOT NULL,
        "CreatedAt" timestamp with time zone NOT NULL,
        CONSTRAINT "PK_SeniorDogSubmissions" PRIMARY KEY ("Id"),
        CONSTRAINT "FK_SeniorDogSubmissions_Users_UserId" FOREIGN KEY ("UserId") REFERENCES "Users" ("UserId") ON DELETE CASCADE
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260703054711_AddPreviousRefreshTokenColumns') THEN
    CREATE TABLE "StoreProducts" (
        "Id" uuid NOT NULL,
        "Name" character varying(200) NOT NULL,
        "Description" text,
        "Price" numeric NOT NULL,
        "ImageUrl" text,
        "DisplayOrder" integer NOT NULL,
        "IsComingSoon" boolean NOT NULL,
        "CreatedAt" timestamp with time zone NOT NULL,
        CONSTRAINT "PK_StoreProducts" PRIMARY KEY ("Id")
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260703054711_AddPreviousRefreshTokenColumns') THEN
    CREATE TABLE "TreeDedications" (
        "Id" uuid NOT NULL,
        "UserId" uuid NOT NULL,
        "DogName" character varying(100) NOT NULL,
        "TributeMessage" character varying(300) NOT NULL,
        "PhotoUrl" text NOT NULL,
        "DedicationType" character varying(20) NOT NULL,
        "Status" character varying(30) NOT NULL,
        "GrowthStage" character varying(50) NOT NULL,
        "CreatedAt" timestamp with time zone NOT NULL,
        CONSTRAINT "PK_TreeDedications" PRIMARY KEY ("Id"),
        CONSTRAINT "FK_TreeDedications_Users_UserId" FOREIGN KEY ("UserId") REFERENCES "Users" ("UserId") ON DELETE CASCADE
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260703054711_AddPreviousRefreshTokenColumns') THEN
    CREATE TABLE "WellnessChecks" (
        "Id" uuid NOT NULL,
        "UserId" uuid NOT NULL,
        "Type" character varying(50) NOT NULL,
        "PhotoUrl" character varying(1000),
        "PhotoUrlsJson" text,
        "AnswersJson" text,
        "AiResponseJson" text,
        "DetailedOverviewJson" text,
        "EnvironmentCheckReferenceId" uuid,
        "ProgressInsightJson" text,
        "FitBarkDataSnapshotJson" text,
        "Status" character varying(20) NOT NULL,
        "CreatedAt" timestamp with time zone NOT NULL,
        "UpdatedAt" timestamp with time zone,
        CONSTRAINT "PK_WellnessChecks" PRIMARY KEY ("Id"),
        CONSTRAINT "FK_WellnessChecks_Users_UserId" FOREIGN KEY ("UserId") REFERENCES "Users" ("UserId") ON DELETE CASCADE
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260703054711_AddPreviousRefreshTokenColumns') THEN
    CREATE TABLE "CourseAssessmentQuestions" (
        "Id" uuid NOT NULL,
        "AssessmentId" uuid NOT NULL,
        "QuestionText" character varying(1000) NOT NULL,
        "DisplayOrder" integer NOT NULL,
        CONSTRAINT "PK_CourseAssessmentQuestions" PRIMARY KEY ("Id"),
        CONSTRAINT "FK_CourseAssessmentQuestions_CourseAssessments_AssessmentId" FOREIGN KEY ("AssessmentId") REFERENCES "CourseAssessments" ("Id") ON DELETE CASCADE
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260703054711_AddPreviousRefreshTokenColumns') THEN
    CREATE TABLE "CourseAssessmentOptions" (
        "Id" uuid NOT NULL,
        "QuestionId" uuid NOT NULL,
        "OptionText" character varying(500) NOT NULL,
        "IsCorrect" boolean NOT NULL,
        CONSTRAINT "PK_CourseAssessmentOptions" PRIMARY KEY ("Id"),
        CONSTRAINT "FK_CourseAssessmentOptions_CourseAssessmentQuestions_QuestionId" FOREIGN KEY ("QuestionId") REFERENCES "CourseAssessmentQuestions" ("Id") ON DELETE CASCADE
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260703054711_AddPreviousRefreshTokenColumns') THEN
    CREATE INDEX "IX_Dogs_UserId" ON "Dogs" ("UserId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260703054711_AddPreviousRefreshTokenColumns') THEN
    CREATE INDEX "IX_CourseAssessmentOptions_QuestionId" ON "CourseAssessmentOptions" ("QuestionId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260703054711_AddPreviousRefreshTokenColumns') THEN
    CREATE INDEX "IX_CourseAssessmentQuestions_AssessmentId" ON "CourseAssessmentQuestions" ("AssessmentId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260703054711_AddPreviousRefreshTokenColumns') THEN
    CREATE INDEX "IX_CourseAssessments_CourseId" ON "CourseAssessments" ("CourseId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260703054711_AddPreviousRefreshTokenColumns') THEN
    CREATE INDEX "IX_CourseAudios_CourseId" ON "CourseAudios" ("CourseId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260703054711_AddPreviousRefreshTokenColumns') THEN
    CREATE INDEX "IX_CourseBookContents_CourseId" ON "CourseBookContents" ("CourseId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260703054711_AddPreviousRefreshTokenColumns') THEN
    CREATE INDEX "IX_CourseResources_CourseId" ON "CourseResources" ("CourseId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260703054711_AddPreviousRefreshTokenColumns') THEN
    CREATE INDEX "IX_CourseVideos_CourseId" ON "CourseVideos" ("CourseId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260703054711_AddPreviousRefreshTokenColumns') THEN
    CREATE INDEX "IX_CourseVisuals_CourseId" ON "CourseVisuals" ("CourseId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260703054711_AddPreviousRefreshTokenColumns') THEN
    CREATE INDEX "IX_ResearchSubmissions_UserId" ON "ResearchSubmissions" ("UserId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260703054711_AddPreviousRefreshTokenColumns') THEN
    CREATE INDEX "IX_SeniorDogSubmissions_UserId" ON "SeniorDogSubmissions" ("UserId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260703054711_AddPreviousRefreshTokenColumns') THEN
    CREATE INDEX "IX_TreeDedications_UserId" ON "TreeDedications" ("UserId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260703054711_AddPreviousRefreshTokenColumns') THEN
    CREATE INDEX "IX_WellnessChecks_UserId" ON "WellnessChecks" ("UserId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260703054711_AddPreviousRefreshTokenColumns') THEN
    INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
    VALUES ('20260703054711_AddPreviousRefreshTokenColumns', '9.0.10');
    END IF;
END $EF$;
COMMIT;

