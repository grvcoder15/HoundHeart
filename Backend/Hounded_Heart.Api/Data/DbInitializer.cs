using Hounded_Heart.Models.Data;
using Hounded_Heart.Models.Dtos;
using Microsoft.EntityFrameworkCore;

namespace Hounded_Heart.Api.Data
{
    public static class DbInitializer
    {
        public static async Task Initialize(AppDbContext context)
        {
            // Seed default roles
            if (!await context.Roles.AnyAsync())
            {
                context.Roles.AddRange(
                    new Role { Id = 1, RoleName = "User", CreatedOn = DateTime.UtcNow, UpdatedOn = DateTime.UtcNow },
                    new Role { Id = 2, RoleName = "Admin", CreatedOn = DateTime.UtcNow, UpdatedOn = DateTime.UtcNow }
                );
                await context.SaveChangesAsync();
            }

            // Seed spiritual traits (insert only missing names)
            var now = DateTime.UtcNow;

            var userTraitsToSeed = new List<UserSpiritualTrait>
            {
                new UserSpiritualTrait { TraitId = Guid.NewGuid(), TraitName = "Patient", Description = "Able to wait calmly and tolerate delays", IsActive = true, IsDeleted = false, CreatedAt = now },
                new UserSpiritualTrait { TraitId = Guid.NewGuid(), TraitName = "Resilient", Description = "Bounces back from challenges", IsActive = true, IsDeleted = false, CreatedAt = now },
                new UserSpiritualTrait { TraitId = Guid.NewGuid(), TraitName = "Compassionate", Description = "Deeply caring and empathetic towards others", IsActive = true, IsDeleted = false, CreatedAt = now },
                new UserSpiritualTrait { TraitId = Guid.NewGuid(), TraitName = "Grateful", Description = "Appreciative of life and its blessings", IsActive = true, IsDeleted = false, CreatedAt = now },
                new UserSpiritualTrait { TraitId = Guid.NewGuid(), TraitName = "Creative", Description = "Imaginative and expressive", IsActive = true, IsDeleted = false, CreatedAt = now },
                new UserSpiritualTrait { TraitId = Guid.NewGuid(), TraitName = "Open-hearted", Description = "Receptive to love and connection", IsActive = true, IsDeleted = false, CreatedAt = now },
                new UserSpiritualTrait { TraitId = Guid.NewGuid(), TraitName = "Grounded", Description = "Stable and connected to earth", IsActive = true, IsDeleted = false, CreatedAt = now },
                new UserSpiritualTrait { TraitId = Guid.NewGuid(), TraitName = "Mindful", Description = "Present and aware in the moment", IsActive = true, IsDeleted = false, CreatedAt = now }
            };

            var existingUserTraitNames = await context.UserSpiritualTraits
                .Select(t => t.TraitName)
                .ToListAsync();

            var missingUserTraits = userTraitsToSeed
                .Where(t => !existingUserTraitNames.Contains(t.TraitName))
                .ToList();

            if (missingUserTraits.Any())
            {
                await context.UserSpiritualTraits.AddRangeAsync(missingUserTraits);
                await context.SaveChangesAsync();
            }

            var dogTraitsToSeed = new List<DogSpiritualTrait>
            {
                new DogSpiritualTrait { TraitId = Guid.NewGuid(), TraitName = "Affectionate", Description = "Shows warmth and loving behavior", IsActive = true, IsDeleted = false, CreatedAt = now },
                new DogSpiritualTrait { TraitId = Guid.NewGuid(), TraitName = "Playful", Description = "Exhibits joyful and energetic behavior", IsActive = true, IsDeleted = false, CreatedAt = now },
                new DogSpiritualTrait { TraitId = Guid.NewGuid(), TraitName = "Loyal", Description = "Shows unwavering devotion and faithfulness", IsActive = true, IsDeleted = false, CreatedAt = now },
                new DogSpiritualTrait { TraitId = Guid.NewGuid(), TraitName = "Calm", Description = "Peaceful and serene demeanor", IsActive = true, IsDeleted = false, CreatedAt = now },
                new DogSpiritualTrait { TraitId = Guid.NewGuid(), TraitName = "Intuitive", Description = "Senses emotions and energy of others", IsActive = true, IsDeleted = false, CreatedAt = now },
                new DogSpiritualTrait { TraitId = Guid.NewGuid(), TraitName = "Energetic", Description = "Full of vitality and enthusiasm", IsActive = true, IsDeleted = false, CreatedAt = now },
                new DogSpiritualTrait { TraitId = Guid.NewGuid(), TraitName = "Gentle", Description = "Displays calm and tender nature", IsActive = true, IsDeleted = false, CreatedAt = now },
                new DogSpiritualTrait { TraitId = Guid.NewGuid(), TraitName = "Protective", Description = "Guards and watches over loved ones", IsActive = true, IsDeleted = false, CreatedAt = now }
            };

            var existingDogTraitNames = await context.DogSpiritualTraits
                .Select(t => t.TraitName)
                .ToListAsync();

            var missingDogTraits = dogTraitsToSeed
                .Where(t => !existingDogTraitNames.Contains(t.TraitName))
                .ToList();

            if (missingDogTraits.Any())
            {
                await context.DogSpiritualTraits.AddRangeAsync(missingDogTraits);
                await context.SaveChangesAsync();
            }

            // Seed journal tags if missing
            if (!await context.Tags.AnyAsync())
            {
                context.Tags.AddRange(
                    new Tags { TagName = "Memory" },
                    new Tags { TagName = "Letter" },
                    new Tags { TagName = "Gratitude" },
                    new Tags { TagName = "Milestone" },
                    new Tags { TagName = "Adventure" },
                    new Tags { TagName = "Healing" },
                    new Tags { TagName = "Daily" },
                    new Tags { TagName = "Special Moment" }
                );
                await context.SaveChangesAsync();
            }

            // Seed missing bonding activities
            // Seed missing bonding activities or update existing points
            var allActivities = new[]
            {
                new BondingActivity { ActivityId = Guid.NewGuid(), ActivityName = "Bedtime Blessing", Points = 2, Category = "Emotional", InteractionType = "Redirect" },
                new BondingActivity { ActivityId = Guid.NewGuid(), ActivityName = "Belly Rubs", Points = 2, Category = "Physical", InteractionType = "Checkbox" },
                new BondingActivity { ActivityId = Guid.NewGuid(), ActivityName = "Chakra Sync", Points = 2, Category = "Spiritual", InteractionType = "Redirect" },
                new BondingActivity { ActivityId = Guid.NewGuid(), ActivityName = "Energy Check-in", Points = 2, Category = "Emotional", InteractionType = "Redirect" },
                new BondingActivity { ActivityId = Guid.NewGuid(), ActivityName = "Evening Reflection", Points = 2, Category = "Spiritual", InteractionType = "Checkbox" },
                new BondingActivity { ActivityId = Guid.NewGuid(), ActivityName = "Feeding Time", Points = 1, Category = "Physical", InteractionType = "Checkbox" },
                new BondingActivity { ActivityId = Guid.NewGuid(), ActivityName = "Gratitude Moment", Points = 2, Category = "Emotional", InteractionType = "Checkbox" },
                new BondingActivity { ActivityId = Guid.NewGuid(), ActivityName = "Grooming", Points = 1, Category = "Physical", InteractionType = "Checkbox" },
                new BondingActivity { ActivityId = Guid.NewGuid(), ActivityName = "Meditation Together", Points = 3, Category = "Spiritual", InteractionType = "Redirect" },
                new BondingActivity { ActivityId = Guid.NewGuid(), ActivityName = "Mindful Walk", Points = 2, Category = "Physical", InteractionType = "Checkbox" },
                new BondingActivity { ActivityId = Guid.NewGuid(), ActivityName = "Morning Intention Setting", Points = 2, Category = "Spiritual", InteractionType = "Checkbox" },
                new BondingActivity { ActivityId = Guid.NewGuid(), ActivityName = "Morning Walk", Points = 2, Category = "Physical", InteractionType = "Checkbox" },
                new BondingActivity { ActivityId = Guid.NewGuid(), ActivityName = "Outdoor Adventure", Points = 5, Category = "Physical", InteractionType = "Checkbox" },
                new BondingActivity { ActivityId = Guid.NewGuid(), ActivityName = "Playtime", Points = 2, Category = "Physical", InteractionType = "Checkbox" },
                new BondingActivity { ActivityId = Guid.NewGuid(), ActivityName = "Synchronized Breathing", Points = 2, Category = "Spiritual", InteractionType = "Redirect" },
                new BondingActivity { ActivityId = Guid.NewGuid(), ActivityName = "Training Session", Points = 4, Category = "Physical", InteractionType = "Checkbox" },
                new BondingActivity { ActivityId = Guid.NewGuid(), ActivityName = "Nature Walk", Points = 3, Category = "Spiritual", InteractionType = "Checkbox" },
                new BondingActivity { ActivityId = Guid.NewGuid(), ActivityName = "Cuddle Time", Points = 2, Category = "Emotional", InteractionType = "Checkbox" },
                new BondingActivity { ActivityId = Guid.NewGuid(), ActivityName = "New Trick Practice", Points = 3, Category = "Emotional", InteractionType = "Checkbox" },
                new BondingActivity { ActivityId = Guid.NewGuid(), ActivityName = "Play Fetch", Points = 2, Category = "Physical", InteractionType = "Checkbox" },
                new BondingActivity { ActivityId = Guid.NewGuid(), ActivityName = "Heart-to-Heart Reflection", Points = 2, Category = "Emotional", InteractionType = "Input" }
            };

            foreach (var act in allActivities)
            {
                var existingAct = await context.BondingActivities.FirstOrDefaultAsync(a => a.ActivityName == act.ActivityName);
                if (existingAct == null)
                {
                    context.BondingActivities.Add(act);
                }
                else
                {
                    // Update the points to match the new values
                    if (existingAct.Points != act.Points)
                    {
                        existingAct.Points = act.Points;
                        context.BondingActivities.Update(existingAct);
                    }
                }
            }
            await context.SaveChangesAsync();

            // Seed all 7 Daily Check-in questions if not yet seeded
            var allCheckInQuestions = new[]
            {
                new { Q = "How present are you in this moment? (0/10)",                               Low = "Distracted",            High = "Fully Present" },
                new { Q = "How much quality time have you spent with your dog today? (0/10)",         Low = "0 Hours",               High = "10+ Hours" },
                new { Q = "How balanced do you feel emotionally today? (0/10)",                       Low = "Overwhelmed",           High = "Centered / Peaceful" },
                new { Q = "How is your dog's behavior today? (0/10)",                                 Low = "Restless / Stressed",   High = "Calm / Playful" },
                new { Q = "How strong is your spiritual connection with your dog right now? (0/10)",  Low = "Disconnected",          High = "Deeply Connected" },
                new { Q = "How is your energy level today? (0/10)",                                   Low = "Low Energy",            High = "High Energy" },
                new { Q = "Emergency/Neglect: Was your dog left alone or walk missed? (0/10)",        Low = "No Issues",             High = "Emergency Occurred" }
            };

            foreach (var q in allCheckInQuestions)
            {
                var existsCheckIn = await context.CheckIns.AnyAsync(c => c.Questions == q.Q);
                if (!existsCheckIn)
                {
                    await context.CheckIns.AddAsync(new CheckIn
                    {
                        CheckInId = Guid.NewGuid(),
                        Questions = q.Q,
                        Rating = 0,
                        LowEnergyLabel = q.Low,
                        HighEnergyLabel = q.High,
                        CreatedOn = DateTime.UtcNow,
                        IsDeleted = false
                    });
                }
            }
            await context.SaveChangesAsync();

            // Seed Healing Circles if empty
            if (!await context.HealingCircles.AnyAsync())
            {
                var circles = new List<HealingCircle>
                {
                    new HealingCircle
                    {
                        Id = Guid.NewGuid(),
                        Title = "Full Moon Healing Circle",
                        Time = DateTime.UtcNow.AddDays(3).ToString("o"), // ISO-8601 string for robust parsing
                        Description = "Join us for a guided meditation session to harness the full moon's energy with your canine companion.",
                        ParticipantsCount = 15,
                        MaxParticipants = 200,
                        IsPremium = false,
                        CreatedOn = DateTime.UtcNow
                    },
                    new HealingCircle
                    {
                        Id = Guid.NewGuid(),
                        Title = "Chakra Alignment Workshop",
                        Time = DateTime.UtcNow.AddDays(5).ToString("o"),
                        Description = "Premium members exclusive workshop on aligning your chakras with your dog's energy centers.",
                        ParticipantsCount = 8,
                        MaxParticipants = 100,
                        IsPremium = true,
                        CreatedOn = DateTime.UtcNow
                    },
                    new HealingCircle
                    {
                        Id = Guid.NewGuid(),
                        Title = "Community Gratitude Gathering",
                        Time = DateTime.UtcNow.AddDays(8).ToString("o"),
                        Description = "Share your gratitude stories and celebrate the bonds we've strengthened this month.",
                        ParticipantsCount = 23,
                        MaxParticipants = 300,
                        IsPremium = false,
                        CreatedOn = DateTime.UtcNow
                    }
                };

                await context.HealingCircles.AddRangeAsync(circles);
                await context.SaveChangesAsync();
            }
        }
    }
}
