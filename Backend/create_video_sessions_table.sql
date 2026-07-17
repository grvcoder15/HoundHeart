-- =============================================================================
-- Migration: Create VideoSessions table
-- Feature:   Paid Video Consultation (Daily.co + Stripe)
-- Run on:    Supabase PostgreSQL
-- =============================================================================

CREATE TABLE IF NOT EXISTS "VideoSessions" (
    "SessionId"              UUID            NOT NULL DEFAULT gen_random_uuid(),
    "UserId"                 UUID            NOT NULL,
    "ExpertId"               UUID            NULL,
    "RoomUrl"                VARCHAR(500)    NOT NULL,
    "RoomName"               VARCHAR(200)    NOT NULL DEFAULT '',
    "StripePaymentIntentId"  VARCHAR(200)    NULL,
    "StartTime"              TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    "ExpiresAt"              TIMESTAMPTZ     NOT NULL,
    "EndTime"                TIMESTAMPTZ     NULL,
    "AmountPaid"             DECIMAL(10, 2)  NOT NULL DEFAULT 30.00,
    "IsActive"               BOOLEAN         NOT NULL DEFAULT TRUE,
    "CreatedAt"              TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    CONSTRAINT "PK_VideoSessions" PRIMARY KEY ("SessionId"),
    CONSTRAINT "FK_VideoSessions_Users" FOREIGN KEY ("UserId")
        REFERENCES "Users" ("UserId") ON DELETE CASCADE
);

-- Indexes for common query patterns
CREATE INDEX IF NOT EXISTS "IX_VideoSessions_UserId"
    ON "VideoSessions" ("UserId");

CREATE INDEX IF NOT EXISTS "IX_VideoSessions_StripePaymentIntentId"
    ON "VideoSessions" ("StripePaymentIntentId");

CREATE INDEX IF NOT EXISTS "IX_VideoSessions_IsActive"
    ON "VideoSessions" ("IsActive");

-- Verify
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'VideoSessions'
ORDER BY ordinal_position;
