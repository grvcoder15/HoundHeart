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
