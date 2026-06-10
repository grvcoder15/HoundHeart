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

            // Seed bonding activities if missing
            if (!await context.BondingActivities.AnyAsync())
            {
                context.BondingActivities.AddRange(
                    new BondingActivity { ActivityId = Guid.NewGuid(), ActivityName = "Morning Walk", Points = 10, Category = "Physical", InteractionType = "Checkbox" },
                    new BondingActivity { ActivityId = Guid.NewGuid(), ActivityName = "Play Fetch", Points = 10, Category = "Physical", InteractionType = "Checkbox" },
                    new BondingActivity { ActivityId = Guid.NewGuid(), ActivityName = "Training Session", Points = 15, Category = "Physical", InteractionType = "Checkbox" },
                    new BondingActivity { ActivityId = Guid.NewGuid(), ActivityName = "Grooming", Points = 10, Category = "Physical", InteractionType = "Checkbox" },
                    new BondingActivity { ActivityId = Guid.NewGuid(), ActivityName = "Meditation Together", Points = 15, Category = "Spiritual", InteractionType = "Checkbox" },
                    new BondingActivity { ActivityId = Guid.NewGuid(), ActivityName = "Nature Walk", Points = 10, Category = "Spiritual", InteractionType = "Checkbox" },
                    new BondingActivity { ActivityId = Guid.NewGuid(), ActivityName = "Cuddle Time", Points = 10, Category = "Emotional", InteractionType = "Checkbox" },
                    new BondingActivity { ActivityId = Guid.NewGuid(), ActivityName = "New Trick Practice", Points = 15, Category = "Emotional", InteractionType = "Checkbox" }
                );
                await context.SaveChangesAsync();
            }

            // Check if "Dog Behavior" check-in exists
            var checkInText = "How is your dog's behavior today? (0/10)";
            var exists = await context.CheckIns.AnyAsync(c => c.Questions == checkInText);

            if (!exists)
            {
                var newCheckIn = new CheckIn
                {
                    CheckInId = Guid.NewGuid(),
                    Questions = checkInText, // Matches user request
                    Rating = 0, // Default in DB, but frontend handles user interaction
                    LowEnergyLabel = "Restless / Stressed",
                    HighEnergyLabel = "Calm / Playful",
                    CreatedOn = DateTime.UtcNow,
                    IsDeleted = false
                };

                await context.CheckIns.AddAsync(newCheckIn);
                await context.SaveChangesAsync();
            }
        }
    }
}
