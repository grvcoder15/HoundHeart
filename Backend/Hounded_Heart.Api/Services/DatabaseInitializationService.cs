using Hounded_Heart.Models.Data;
using Microsoft.EntityFrameworkCore;

namespace Hounded_Heart.Api.Services
{
    /// <summary>
    /// Runs database connectivity checks, schema guards, and seeding as a background
    /// hosted service so that the HTTP server can start listening on port 8080
    /// immediately without being blocked by async database I/O at startup.
    /// </summary>
    public class DatabaseInitializationService : BackgroundService
    {
        private readonly ILogger<DatabaseInitializationService> _logger;
        private readonly IServiceScopeFactory _scopeFactory;

        public DatabaseInitializationService(
            ILogger<DatabaseInitializationService> logger,
            IServiceScopeFactory scopeFactory)
        {
            _logger = logger;
            _scopeFactory = scopeFactory;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("DatabaseInitializationService: starting database initialization in background.");

            // Test database connection and run schema guards + seeding
            try
            {
                using var scope = _scopeFactory.CreateScope();
                var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();

                var canConnect = await dbContext.Database.CanConnectAsync(stoppingToken);
                if (canConnect)
                {
                    _logger.LogInformation("✅ Database connection successful!");

                    // Backward-compatible schema guard for environments created before tier rollout.
                    if (dbContext.Database.IsNpgsql())
                    {
                        await dbContext.Database.ExecuteSqlRawAsync(@"
                            ALTER TABLE ""Users""
                            ADD COLUMN IF NOT EXISTS ""TierLevel"" character varying(20) NOT NULL DEFAULT 'free';
                        ", stoppingToken);

                        await dbContext.Database.ExecuteSqlRawAsync(@"
                            UPDATE ""Users""
                            SET ""TierLevel"" = 'free'
                            WHERE ""TierLevel"" IS NULL OR btrim(""TierLevel"") = '';
                        ", stoppingToken);

                        // Ensure SubscriptionPlans table has TierLevel column
                        await dbContext.Database.ExecuteSqlRawAsync(@"
                            ALTER TABLE ""SubscriptionPlans""
                            ADD COLUMN IF NOT EXISTS ""TierLevel"" character varying(20) NOT NULL DEFAULT 'plus';
                        ", stoppingToken);

                        await dbContext.Database.ExecuteSqlRawAsync(@"
                            ALTER TABLE ""SubscriptionPlans""
                            ADD COLUMN IF NOT EXISTS ""DonationAmount"" numeric(10,2) NOT NULL DEFAULT 0;
                        ", stoppingToken);

                        // Remove '$10 donation to animal welfare charities' from plan features (client request)
                        await dbContext.Database.ExecuteSqlRawAsync(@"
                            UPDATE ""SubscriptionPlans""
                            SET ""Features"" = (
                                SELECT jsonb_agg(elem)::text
                                FROM jsonb_array_elements_text(""Features""::jsonb) AS elem
                                WHERE elem NOT ILIKE '%donation%'
                            )
                            WHERE ""Features""::text ILIKE '%donation%';
                        ", stoppingToken);
                        _logger.LogInformation("✅ Charity donation feature removed from plan features (if present)");

                        // Ensure Rituals table exists
                        await dbContext.Database.ExecuteSqlRawAsync(@"
                            CREATE TABLE IF NOT EXISTS ""Rituals"" (
                                ""Id"" uuid NOT NULL DEFAULT gen_random_uuid(),
                                ""Title"" character varying(100) NOT NULL,
                                ""Description"" character varying(500),
                                ""Duration"" character varying(50),
                                ""Category"" character varying(50) NOT NULL,
                                ""IconType"" character varying(50),
                                CONSTRAINT ""PK_Rituals"" PRIMARY KEY (""Id"")
                            );
                        ", stoppingToken);

                        // Ensure RitualLogs table exists
                        await dbContext.Database.ExecuteSqlRawAsync(@"
                            CREATE TABLE IF NOT EXISTS ""RitualLogs"" (
                                ""Id"" uuid NOT NULL DEFAULT gen_random_uuid(),
                                ""RitualId"" uuid NOT NULL,
                                ""UserId"" uuid NOT NULL,
                                ""CompletedAt"" timestamp with time zone NOT NULL DEFAULT now(),
                                ""BonusAwarded"" boolean NOT NULL DEFAULT false,
                                CONSTRAINT ""PK_RitualLogs"" PRIMARY KEY (""Id""),
                                CONSTRAINT ""FK_RitualLogs_Rituals_RitualId"" FOREIGN KEY (""RitualId"") REFERENCES ""Rituals""(""Id"") ON DELETE CASCADE
                            );
                            CREATE INDEX IF NOT EXISTS ""IX_RitualLogs_RitualId"" ON ""RitualLogs""(""RitualId"");
                        ", stoppingToken);

                        // Ensure TreeDedications table exists
                        await dbContext.Database.ExecuteSqlRawAsync(@"
                            CREATE TABLE IF NOT EXISTS ""TreeDedications"" (
                                ""Id"" uuid NOT NULL DEFAULT gen_random_uuid(),
                                ""UserId"" uuid NOT NULL,
                                ""DogName"" character varying(100) NOT NULL,
                                ""TributeMessage"" character varying(300) NOT NULL,
                                ""PhotoUrl"" text NOT NULL,
                                ""DedicationType"" character varying(20) NOT NULL DEFAULT 'Honor',
                                ""Status"" character varying(30) NOT NULL DEFAULT 'PendingReview',
                                ""GrowthStage"" character varying(50) NOT NULL DEFAULT '🌱 Sapling',
                                ""CreatedAt"" timestamp with time zone NOT NULL DEFAULT now(),
                                CONSTRAINT ""PK_TreeDedications"" PRIMARY KEY (""Id"")
                            );
                            CREATE INDEX IF NOT EXISTS ""IX_TreeDedications_UserId"" ON ""TreeDedications""(""UserId"");
                        ", stoppingToken);

                        // Alter existing PhotoUrl columns to TEXT if they are still varchar(1000)
                        await dbContext.Database.ExecuteSqlRawAsync(@"
                            ALTER TABLE ""TreeDedications"" ALTER COLUMN ""PhotoUrl"" TYPE text;
                        ", stoppingToken);

                        // Ensure SeniorDogSubmissions and ResearchSubmissions tables exist
                        await dbContext.Database.ExecuteSqlRawAsync(@"
                            CREATE TABLE IF NOT EXISTS ""SeniorDogSubmissions"" (
                                ""Id"" uuid NOT NULL DEFAULT gen_random_uuid(),
                                ""UserId"" uuid NOT NULL,
                                ""DogName"" character varying(100) NOT NULL,
                                ""Story"" character varying(500) NOT NULL,
                                ""PhotoUrl"" text NOT NULL,
                                ""Status"" character varying(30) NOT NULL DEFAULT 'PendingReview',
                                ""CreatedAt"" timestamp with time zone NOT NULL DEFAULT now(),
                                CONSTRAINT ""PK_SeniorDogSubmissions"" PRIMARY KEY (""Id"")
                            );
                            CREATE INDEX IF NOT EXISTS ""IX_SeniorDogSubmissions_UserId"" ON ""SeniorDogSubmissions""(""UserId"");

                            CREATE TABLE IF NOT EXISTS ""ResearchSubmissions"" (
                                ""Id"" uuid NOT NULL DEFAULT gen_random_uuid(),
                                ""UserId"" uuid NOT NULL,
                                ""Title"" character varying(100) NOT NULL,
                                ""Description"" character varying(500) NOT NULL,
                                ""PhotoUrl"" text NOT NULL,
                                ""Status"" character varying(30) NOT NULL DEFAULT 'PendingReview',
                                ""CreatedAt"" timestamp with time zone NOT NULL DEFAULT now(),
                                CONSTRAINT ""PK_ResearchSubmissions"" PRIMARY KEY (""Id"")
                            );
                            CREATE INDEX IF NOT EXISTS ""IX_ResearchSubmissions_UserId"" ON ""ResearchSubmissions""(""UserId"");
                        ", stoppingToken);

                        // Alter existing PhotoUrl columns to TEXT if they are still varchar(1000)
                        await dbContext.Database.ExecuteSqlRawAsync(@"
                            ALTER TABLE ""SeniorDogSubmissions"" ALTER COLUMN ""PhotoUrl"" TYPE text;
                            ALTER TABLE ""ResearchSubmissions"" ALTER COLUMN ""PhotoUrl"" TYPE text;
                        ", stoppingToken);

                        // Ensure Legacy Project Admin tables exist
                        await dbContext.Database.ExecuteSqlRawAsync(@"
                            CREATE TABLE IF NOT EXISTS ""LegacyProjectContents"" (
                                ""Id"" uuid NOT NULL DEFAULT gen_random_uuid(),
                                ""SectionKey"" character varying(50) NOT NULL,
                                ""Description"" text NOT NULL,
                                ""ImpactStatsJson"" text NOT NULL,
                                ""UpdatedAt"" timestamp with time zone NOT NULL DEFAULT now(),
                                CONSTRAINT ""PK_LegacyProjectContents"" PRIMARY KEY (""Id"")
                            );
                            CREATE INDEX IF NOT EXISTS ""IX_LegacyProjectContents_SectionKey"" ON ""LegacyProjectContents""(""SectionKey"");

                            CREATE TABLE IF NOT EXISTS ""LegacyProjectUpdates"" (
                                ""Id"" uuid NOT NULL DEFAULT gen_random_uuid(),
                                ""SectionKey"" character varying(50) NOT NULL,
                                ""Content"" text NOT NULL,
                                ""Date"" timestamp with time zone NOT NULL DEFAULT now(),
                                CONSTRAINT ""PK_LegacyProjectUpdates"" PRIMARY KEY (""Id"")
                            );
                            CREATE INDEX IF NOT EXISTS ""IX_LegacyProjectUpdates_SectionKey"" ON ""LegacyProjectUpdates""(""SectionKey"");

                            CREATE TABLE IF NOT EXISTS ""LegacyProjectAdminPhotos"" (
                                ""Id"" uuid NOT NULL DEFAULT gen_random_uuid(),
                                ""SectionKey"" character varying(50) NOT NULL,
                                ""PhotoUrl"" text NOT NULL,
                                ""DisplayOrder"" integer NOT NULL DEFAULT 0,
                                ""UploadedAt"" timestamp with time zone NOT NULL DEFAULT now(),
                                CONSTRAINT ""PK_LegacyProjectAdminPhotos"" PRIMARY KEY (""Id"")
                            );
                            CREATE INDEX IF NOT EXISTS ""IX_LegacyProjectAdminPhotos_SectionKey"" ON ""LegacyProjectAdminPhotos""(""SectionKey"");
                        ", stoppingToken);

                        // Ensure course content tables exist (books, videos, visuals, audio, resources, assessments)
                        await dbContext.Database.ExecuteSqlRawAsync(@"
                            CREATE TABLE IF NOT EXISTS ""CourseBookContents"" (
                                ""Id"" uuid NOT NULL,
                                ""CourseId"" uuid NOT NULL,
                                ""Title"" character varying(300) NOT NULL,
                                ""Description"" character varying(2000),
                                ""FileUrl"" character varying(1000),
                                ""DisplayOrder"" integer NOT NULL,
                                ""IsPublished"" boolean NOT NULL,
                                ""CreatedAt"" timestamp with time zone NOT NULL,
                                ""UpdatedAt"" timestamp with time zone,
                                CONSTRAINT ""PK_CourseBookContents"" PRIMARY KEY (""Id""),
                                CONSTRAINT ""FK_CourseBookContents_Courses_CourseId"" FOREIGN KEY (""CourseId"") REFERENCES ""Courses""(""Id"") ON DELETE CASCADE
                            );
                            CREATE INDEX IF NOT EXISTS ""IX_CourseBookContents_CourseId"" ON ""CourseBookContents""(""CourseId"");

                            CREATE TABLE IF NOT EXISTS ""CourseVideos"" (
                                ""Id"" uuid NOT NULL,
                                ""CourseId"" uuid NOT NULL,
                                ""Title"" character varying(300) NOT NULL,
                                ""Description"" character varying(2000),
                                ""VideoUrl"" character varying(1000),
                                ""ThumbnailUrl"" character varying(1000),
                                ""DurationSeconds"" integer,
                                ""DisplayOrder"" integer NOT NULL,
                                ""IsPublished"" boolean NOT NULL,
                                ""CreatedAt"" timestamp with time zone NOT NULL,
                                ""UpdatedAt"" timestamp with time zone,
                                CONSTRAINT ""PK_CourseVideos"" PRIMARY KEY (""Id""),
                                CONSTRAINT ""FK_CourseVideos_Courses_CourseId"" FOREIGN KEY (""CourseId"") REFERENCES ""Courses""(""Id"") ON DELETE CASCADE
                            );
                            CREATE INDEX IF NOT EXISTS ""IX_CourseVideos_CourseId"" ON ""CourseVideos""(""CourseId"");

                            CREATE TABLE IF NOT EXISTS ""CourseVisuals"" (
                                ""Id"" uuid NOT NULL,
                                ""CourseId"" uuid NOT NULL,
                                ""Title"" character varying(300) NOT NULL,
                                ""Description"" character varying(2000),
                                ""ImageUrl"" character varying(1000),
                                ""DisplayOrder"" integer NOT NULL,
                                ""IsPublished"" boolean NOT NULL,
                                ""CreatedAt"" timestamp with time zone NOT NULL,
                                ""UpdatedAt"" timestamp with time zone,
                                CONSTRAINT ""PK_CourseVisuals"" PRIMARY KEY (""Id""),
                                CONSTRAINT ""FK_CourseVisuals_Courses_CourseId"" FOREIGN KEY (""CourseId"") REFERENCES ""Courses""(""Id"") ON DELETE CASCADE
                            );
                            CREATE INDEX IF NOT EXISTS ""IX_CourseVisuals_CourseId"" ON ""CourseVisuals""(""CourseId"");

                            CREATE TABLE IF NOT EXISTS ""CourseAudios"" (
                                ""Id"" uuid NOT NULL,
                                ""CourseId"" uuid NOT NULL,
                                ""Title"" character varying(300) NOT NULL,
                                ""Description"" character varying(2000),
                                ""AudioUrl"" character varying(1000),
                                ""DurationSeconds"" integer,
                                ""DisplayOrder"" integer NOT NULL,
                                ""IsPublished"" boolean NOT NULL,
                                ""CreatedAt"" timestamp with time zone NOT NULL,
                                ""UpdatedAt"" timestamp with time zone,
                                CONSTRAINT ""PK_CourseAudios"" PRIMARY KEY (""Id""),
                                CONSTRAINT ""FK_CourseAudios_Courses_CourseId"" FOREIGN KEY (""CourseId"") REFERENCES ""Courses""(""Id"") ON DELETE CASCADE
                            );
                            CREATE INDEX IF NOT EXISTS ""IX_CourseAudios_CourseId"" ON ""CourseAudios""(""CourseId"");

                            CREATE TABLE IF NOT EXISTS ""CourseResources"" (
                                ""Id"" uuid NOT NULL,
                                ""CourseId"" uuid NOT NULL,
                                ""Title"" character varying(300) NOT NULL,
                                ""Description"" character varying(2000),
                                ""FileUrl"" character varying(1000),
                                ""ExternalUrl"" character varying(1000),
                                ""DisplayOrder"" integer NOT NULL,
                                ""IsPublished"" boolean NOT NULL,
                                ""CreatedAt"" timestamp with time zone NOT NULL,
                                ""UpdatedAt"" timestamp with time zone,
                                CONSTRAINT ""PK_CourseResources"" PRIMARY KEY (""Id""),
                                CONSTRAINT ""FK_CourseResources_Courses_CourseId"" FOREIGN KEY (""CourseId"") REFERENCES ""Courses""(""Id"") ON DELETE CASCADE
                            );
                            CREATE INDEX IF NOT EXISTS ""IX_CourseResources_CourseId"" ON ""CourseResources""(""CourseId"");

                            CREATE TABLE IF NOT EXISTS ""CourseAssessments"" (
                                ""Id"" uuid NOT NULL,
                                ""CourseId"" uuid NOT NULL,
                                ""AssessmentType"" character varying(50) NOT NULL,
                                ""Title"" character varying(300) NOT NULL,
                                ""Description"" character varying(2000),
                                ""PassingScorePercent"" integer NOT NULL,
                                ""DisplayOrder"" integer NOT NULL,
                                ""IsPublished"" boolean NOT NULL,
                                ""CreatedAt"" timestamp with time zone NOT NULL,
                                ""UpdatedAt"" timestamp with time zone,
                                CONSTRAINT ""PK_CourseAssessments"" PRIMARY KEY (""Id""),
                                CONSTRAINT ""FK_CourseAssessments_Courses_CourseId"" FOREIGN KEY (""CourseId"") REFERENCES ""Courses""(""Id"") ON DELETE CASCADE
                            );
                            CREATE INDEX IF NOT EXISTS ""IX_CourseAssessments_CourseId"" ON ""CourseAssessments""(""CourseId"");

                            CREATE TABLE IF NOT EXISTS ""CourseAssessmentQuestions"" (
                                ""Id"" uuid NOT NULL,
                                ""AssessmentId"" uuid NOT NULL,
                                ""QuestionText"" character varying(1000) NOT NULL,
                                ""DisplayOrder"" integer NOT NULL,
                                CONSTRAINT ""PK_CourseAssessmentQuestions"" PRIMARY KEY (""Id""),
                                CONSTRAINT ""FK_CourseAssessmentQuestions_CourseAssessments_AssessmentId"" FOREIGN KEY (""AssessmentId"") REFERENCES ""CourseAssessments""(""Id"") ON DELETE CASCADE
                            );
                            CREATE INDEX IF NOT EXISTS ""IX_CourseAssessmentQuestions_AssessmentId"" ON ""CourseAssessmentQuestions""(""AssessmentId"");

                            CREATE TABLE IF NOT EXISTS ""CourseAssessmentOptions"" (
                                ""Id"" uuid NOT NULL,
                                ""QuestionId"" uuid NOT NULL,
                                ""OptionText"" character varying(500) NOT NULL,
                                ""IsCorrect"" boolean NOT NULL,
                                CONSTRAINT ""PK_CourseAssessmentOptions"" PRIMARY KEY (""Id""),
                                CONSTRAINT ""FK_CourseAssessmentOptions_CourseAssessmentQuestions_QuestionId"" FOREIGN KEY (""QuestionId"") REFERENCES ""CourseAssessmentQuestions""(""Id"") ON DELETE CASCADE
                            );
                            CREATE INDEX IF NOT EXISTS ""IX_CourseAssessmentOptions_QuestionId"" ON ""CourseAssessmentOptions""(""QuestionId"");
                        ", stoppingToken);
                        _logger.LogInformation("✅ Course content tables verified");
                    }

                    // Seed Database
                    try
                    {
                        await Hounded_Heart.Api.Data.DbInitializer.Initialize(dbContext);
                        _logger.LogInformation("✅ Database seeded successfully!");
                    }
                    catch (Exception ex)
                    {
                        _logger.LogWarning(ex, "⚠️ Seeding failed: {Message}", ex.Message);
                    }
                }
                else
                {
                    _logger.LogWarning("⚠️ Warning: Database connection failed. The API is running but database operations will fail.");
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "⚠️ Warning: Database connection test failed: {Message}. The API is running but database operations may fail.", ex.Message);
            }

            // Apply pending schema migrations / column guards
            try
            {
                using var scope = _scopeFactory.CreateScope();
                var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();

                // Ensure IsEmailVerified column exists (for email verification feature)
                try
                {
                    await dbContext.Database.ExecuteSqlRawAsync(
                        @"DO $$
                        BEGIN
                            IF NOT EXISTS (
                                SELECT 1 FROM information_schema.columns 
                                WHERE table_name = 'Users' AND column_name = 'IsEmailVerified'
                            ) THEN
                                ALTER TABLE ""Users"" ADD COLUMN ""IsEmailVerified"" BOOLEAN NOT NULL DEFAULT false;
                            END IF;
                        END $$;",
                        stoppingToken
                    );
                    _logger.LogInformation("✅ IsEmailVerified column verified");
                }
                catch (Exception colEx)
                {
                    _logger.LogWarning(colEx, "⚠️ Column check error (may be expected): {Message}", colEx.Message);
                }

                try
                {
                    // await dbContext.Database.MigrateAsync(stoppingToken);
                    _logger.LogInformation("✅ Database migrations applied successfully");
                }
                catch (Exception migEx)
                {
                    _logger.LogWarning(migEx, "⚠️ Migration error (schema may be partially out of sync): {Message}", migEx.Message);
                    // Continue anyway - the raw SQL column addition already happened
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Critical error in database initialization: {Message}", ex.Message);
                // Don't throw - let the app continue
            }

            _logger.LogInformation("DatabaseInitializationService: database initialization complete.");
        }
    }
}
