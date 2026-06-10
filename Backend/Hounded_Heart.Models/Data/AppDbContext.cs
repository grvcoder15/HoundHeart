using Hounded_Heart.Models.Dtos;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Hounded_Heart.Models.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options)
        : base(options) { }

        protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
        {
            base.OnConfiguring(optionsBuilder);
            
            // Suppress pending model changes warning during migrations
            optionsBuilder.ConfigureWarnings(w => 
                w.Ignore(Microsoft.EntityFrameworkCore.Diagnostics.RelationalEventId.PendingModelChangesWarning));
        }
        public DbSet<User> Users { get; set; }
        public DbSet<Dog> Dogs { get; set; }
        public DbSet<UserSpiritualTrait> UserSpiritualTraits { get; set; }
        public DbSet<DogSpiritualTrait> DogSpiritualTraits { get; set; }
        public DbSet<UserSelectedTrait> UserSelectedTraits { get; set; }
        public DbSet<DogSelectedTrait> DogSelectedTraits { get; set; }
        public DbSet<Chakra> Chakras { get; set; }
        public DbSet<UserChakraProgress> UserChakraProgresses { get; set; }
        public DbSet<CheckIn> CheckIns { get; set; }
        public DbSet<UserCheckIn> UserCheckIns { get; set; }
        public DbSet<Role> Roles { get; set; }  
        public DbSet<Tags> Tags { get; set; }
        public DbSet<JournalEntry> JournalEntries { get; set; }
        public DbSet<BondingActivity> BondingActivities { get; set; }
        public DbSet<UserBondingActivity> UserBondingActivities { get; set; }
        public DbSet<ChakraRitualProgress> ChakraRitualProgresses { get; set; }
        public DbSet<UserOtp> UserOtps { get; set; }
        public DbSet<ExpertQuery> ExpertQueries { get; set; }
        public DbSet<UserChakraRating> UserChakraRatings { get; set; }
        public DbSet<GuidedPractice> GuidedPractices { get; set; }
        public DbSet<Scores> Scores { get; set; }
        public DbSet<UserActivitiesScore> UserActivitiesScores { get; set; }
        public DbSet<ScoringRule> ScoringRules { get; set; }
        public DbSet<Ritual> Rituals { get; set; }
        public DbSet<RitualLog> RitualLogs { get; set; }
        public DbSet<ChakraLog> ChakraLogs { get; set; }
        public DbSet<BreathingPattern> BreathingPatterns { get; set; }
        public DbSet<TargetCycle> TargetCycles { get; set; }
        public DbSet<UserBreathingPreference> UserBreathingPreferences { get; set; }
        public DbSet<SacredGuide> SacredGuides { get; set; }
        public DbSet<SacredGuideWaitlist> SacredGuideWaitlists { get; set; }
        public DbSet<SacredGuidePurchase> SacredGuidePurchases { get; set; }
        public DbSet<Subscription> Subscriptions { get; set; }
        public DbSet<SubscriptionLog> SubscriptionLogs { get; set; }
        public DbSet<SubscriptionPlan> SubscriptionPlans { get; set; }

        // Community module
        public DbSet<CommunityPost> CommunityPosts { get; set; }
        public DbSet<CommunityLike> CommunityLikes { get; set; }
        public DbSet<CommunityComment> CommunityComments { get; set; }
        public DbSet<HealingCircle> HealingCircles { get; set; }
        public DbSet<TrendingTopic> TrendingTopics { get; set; }
        public DbSet<CommunityDiscussion> CommunityDiscussions { get; set; }
        public DbSet<HealingCircleRegistration> HealingCircleRegistrations { get; set; }
        public DbSet<PostReport> PostReports { get; set; }
        public DbSet<UserCredit> UserCredits { get; set; }

        // FAQ module
        public DbSet<FAQ> FAQs { get; set; }

        public DbSet<ExpertQueryCategory> ExpertQueryCategories { get; set; }
        public DbSet<SiteSetting> SiteSettings { get; set; }
        public DbSet<PreRegistration> PreRegistrations { get; set; }

        // Phase 1 Wearables
        public DbSet<HumanProfile> HumanProfiles { get; set; }
        public DbSet<DogProfile> DogProfiles { get; set; }
        public DbSet<DeviceConnection> DeviceConnections { get; set; }
        public DbSet<StressEvent> StressEvents { get; set; }
        public DbSet<NotificationLog> NotificationLogs { get; set; }
        public DbSet<MessageLog> MessageLogs { get; set; }
        public DbSet<HumanVitalsRecord> HumanVitals { get; set; }
        public DbSet<DogVitalsRecord> DogVitals { get; set; }
        public DbSet<UserBaselines> UserBaselines { get; set; }
        public DbSet<DogBaseline> DogBaselines { get; set; }
        public DbSet<SyncScoreRecord> SyncScoreRecords { get; set; }
        public DbSet<WellnessAlert> WellnessAlerts { get; set; }

        // Daily Aggregated Data
        public DbSet<HumanDailySummary> HumanDailySummaries { get; set; }
        public DbSet<DogDailySummary> DogDailySummaries { get; set; }
        // FitBark Integration
        public DbSet<FitBarkDog> FitBarkDogs { get; set; }
        public DbSet<FitBarkActivityLog> FitBarkActivityLogs { get; set; }
    }
}
    