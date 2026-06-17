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

            // Seed Subscription Plans if missing
            if (!await context.SubscriptionPlans.AnyAsync())
            {
                var plans = new List<SubscriptionPlan>
                {
                    new SubscriptionPlan
                    {
                        PlanId = Guid.NewGuid(),
                        PlanName = "Free Member",
                        Description = "Essential access to begin your HoundHeart journey",
                        Price = 0.00m,
                        Currency = "USD",
                        BillingPeriod = "Forever",
                        TierLevel = "free",
                        StripePriceId = null,
                        Features = "[\"Create and manage account\",\"Create and manage dog profile(s)\",\"Basic app access\",\"Access to newsletter and announcements\",\"Purchase books and merchandise\"]",
                        Badge = null,
                        SavingsText = null,
                        DisplayOrder = 1,
                        IsActive = true,
                        CreatedOn = DateTime.UtcNow
                    },
                    new SubscriptionPlan
                    {
                        PlanId = Guid.NewGuid(),
                        PlanName = "HoundHeart Plus",
                        Description = "Advanced wellness and connection tools for dedicated members",
                        Price = 9.99m,
                        Currency = "USD",
                        BillingPeriod = "monthly",
                        TierLevel = "plus",
                        StripePriceId = "price_1TgHoZ1CAX7d2eZrgU1c51Pb",
                        Features = "[\"Includes all Free Member features\",\"Full app access\",\"Full Bonded Score access\",\"Wellness tracking tools\",\"Free digital and audio book\",\"Travel directory access\",\"Partner discounts and wearable connection\"]",
                        Badge = "Most Popular",
                        SavingsText = null,
                        DisplayOrder = 2,
                        IsActive = true,
                        CreatedOn = DateTime.UtcNow
                    },
                    new SubscriptionPlan
                    {
                        PlanId = Guid.NewGuid(),
                        PlanName = "HoundHeart Plus",
                        Description = "Advanced wellness and connection tools for dedicated members",
                        Price = 79.99m,
                        Currency = "USD",
                        BillingPeriod = "yearly",
                        TierLevel = "plus",
                        StripePriceId = "price_1TgI9r1CAX7d2eZrFT5sBfQz",
                        Features = "[\"Includes all Free Member features\",\"Full app access\",\"Full Bonded Score access\",\"Wellness tracking tools\",\"Free digital and audio book\",\"Travel directory access\",\"Partner discounts and wearable connection\"]",
                        Badge = "Best Value",
                        SavingsText = "Save $40/year (17% off)",
                        DisplayOrder = 3,
                        IsActive = true,
                        CreatedOn = DateTime.UtcNow
                    },
                    new SubscriptionPlan
                    {
                        PlanId = Guid.NewGuid(),
                        PlanName = "HoundHeart Premium",
                        Description = "The complete premium lifestyle package for top-tier members",
                        Price = 149.99m,
                        Currency = "USD",
                        BillingPeriod = "yearly",
                        TierLevel = "premium",
                        StripePriceId = "price_1TgHps1CAX7d2eZrYmgLh6m6",
                        Features = "[\"Includes all HoundHeart Plus features\",\"Paperback HoundHeart book\",\"Official HoundHeart T-shirt\",\"$10 donation to animal welfare charities\",\"Travel Club access and premium discounts\",\"Premium Member badge in profile\"]",
                        Badge = "Best Value",
                        SavingsText = "Yearly Only",
                        DisplayOrder = 4,
                        IsActive = true,
                        CreatedOn = DateTime.UtcNow
                    }
                };

                await context.SubscriptionPlans.AddRangeAsync(plans);
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
                new BondingActivity { ActivityId = Guid.NewGuid(), ActivityName = "Nerve Center Sync", Points = 2, Category = "Spiritual", InteractionType = "Redirect" },
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

            // Seed courses placeholder catalog (11 coming-soon courses)
            var courseSeeds = new[]
            {
                new Course
                {
                    Id = Guid.NewGuid(),
                    Title = "Foundations of Co-Regulation",
                    Description = "Learn the core principles of human-dog co-regulation and how to build calm, safe, shared emotional states. This foundational course introduces practical daily rituals for nervous system alignment.",
                    Price = 49m,
                    IsFreeWithPlus = true,
                    DisplayOrder = 1,
                    Status = "ComingSoon",
                    CreatedAt = DateTime.UtcNow
                },
                new Course
                {
                    Id = Guid.NewGuid(),
                    Title = "The Body Electric: Nerve Center Activation for Human-Dog Co-Regulation",
                    Description = "Explore how body awareness and energetic mapping support deeper connection with your dog. You will practice techniques that help activate and stabilize your internal regulation centers.",
                    Price = 149m,
                    IsFreeWithPlus = false,
                    DisplayOrder = 2,
                    Status = "ComingSoon",
                    CreatedAt = DateTime.UtcNow
                },
                new Course
                {
                    Id = Guid.NewGuid(),
                    Title = "Healing Through the Eyes: Building the Oxytocin Bond",
                    Description = "Understand the science of eye contact, trust, and oxytocin release in human-canine bonding. This course teaches simple relational exercises to strengthen emotional safety and affection.",
                    Price = 99m,
                    IsFreeWithPlus = false,
                    DisplayOrder = 3,
                    Status = "ComingSoon",
                    CreatedAt = DateTime.UtcNow
                },
                new Course
                {
                    Id = Guid.NewGuid(),
                    Title = "Canine Anxiety: A Co-Regulatory Approach",
                    Description = "Learn to identify anxiety patterns in dogs and respond with grounded, co-regulatory support. You will build a step-by-step calm-response framework for difficult moments.",
                    Price = 149m,
                    IsFreeWithPlus = false,
                    DisplayOrder = 4,
                    Status = "ComingSoon",
                    CreatedAt = DateTime.UtcNow
                },
                new Course
                {
                    Id = Guid.NewGuid(),
                    Title = "Trauma Recovery: Healing Together",
                    Description = "Discover trauma-informed practices for healing emotional stress in both humans and dogs. The course focuses on pacing, safety, and trust restoration through shared routines.",
                    Price = 149m,
                    IsFreeWithPlus = false,
                    DisplayOrder = 5,
                    Status = "ComingSoon",
                    CreatedAt = DateTime.UtcNow
                },
                new Course
                {
                    Id = Guid.NewGuid(),
                    Title = "Pack Dynamics: Co-Regulation in Multi-Dog Households",
                    Description = "Develop co-regulation strategies for homes with multiple dogs and layered energy dynamics. You will learn practical structure methods to reduce friction and improve harmony.",
                    Price = 99m,
                    IsFreeWithPlus = false,
                    DisplayOrder = 6,
                    Status = "ComingSoon",
                    CreatedAt = DateTime.UtcNow
                },
                new Course
                {
                    Id = Guid.NewGuid(),
                    Title = "From Leash to Leadership: Co-Regulation Skills for Professional Life",
                    Description = "Apply co-regulation principles from your dog relationship to leadership, communication, and workplace resilience. This course bridges emotional regulation into real-world professional settings.",
                    Price = 149m,
                    IsFreeWithPlus = false,
                    DisplayOrder = 7,
                    Status = "ComingSoon",
                    CreatedAt = DateTime.UtcNow
                },
                new Course
                {
                    Id = Guid.NewGuid(),
                    Title = "Healing Touch: Co-Regulatory Bodywork for You and Your Dog",
                    Description = "Learn gentle bodywork and touch-based grounding routines for relaxation and recovery. Sessions are designed to support both nervous systems with safe physical connection.",
                    Price = 99m,
                    IsFreeWithPlus = false,
                    DisplayOrder = 8,
                    Status = "ComingSoon",
                    CreatedAt = DateTime.UtcNow
                },
                new Course
                {
                    Id = Guid.NewGuid(),
                    Title = "The Aging Bond: Co-Regulation in the Senior Years",
                    Description = "Support aging dogs and caregivers through compassionate routines that prioritize mobility, calm, and emotional steadiness. The course offers practical adaptations for late-life wellbeing.",
                    Price = 99m,
                    IsFreeWithPlus = false,
                    DisplayOrder = 9,
                    Status = "ComingSoon",
                    CreatedAt = DateTime.UtcNow
                },
                new Course
                {
                    Id = Guid.NewGuid(),
                    Title = "Puppy Foundations: Building the Co-Regulatory Bond from Day One",
                    Description = "Start your puppy journey with emotionally intelligent foundations that shape lifelong trust. Learn routines that reduce overwhelm while building secure, resilient attachment.",
                    Price = 99m,
                    IsFreeWithPlus = false,
                    DisplayOrder = 10,
                    Status = "ComingSoon",
                    CreatedAt = DateTime.UtcNow
                },
                new Course
                {
                    Id = Guid.NewGuid(),
                    Title = "The 30-Day Co-Regulation Challenge",
                    Description = "Follow a guided 30-day progression of short, repeatable co-regulation practices for measurable change. Ideal for building consistency and deepening your bond through daily action.",
                    Price = 29m,
                    IsFreeWithPlus = false,
                    DisplayOrder = 11,
                    Status = "ComingSoon",
                    CreatedAt = DateTime.UtcNow
                }
            };

            var existingCourseTitles = await context.Courses
                .Select(c => c.Title)
                .ToListAsync();

            var missingCourses = courseSeeds
                .Where(c => !existingCourseTitles.Contains(c.Title))
                .ToList();

            if (missingCourses.Any())
            {
                await context.Courses.AddRangeAsync(missingCourses);
                await context.SaveChangesAsync();
            }

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

            // Seed default Rituals if table is empty
            if (!await context.Rituals.AnyAsync())
            {
                var rituals = new[]
                {
                    new Ritual { Id = Guid.NewGuid(), Title = "Morning Intention Setting", Description = "Start your day with a clear intention.", Duration = "5 min", Category = "Morning", IconType = "Sun" },
                    new Ritual { Id = Guid.NewGuid(), Title = "Gratitude Moment",          Description = "Reflect on what you are grateful for.",  Duration = "2 min", Category = "Morning", IconType = "Heart" },
                    new Ritual { Id = Guid.NewGuid(), Title = "Energy Check-in",           Description = "Assess your current energy levels.",       Duration = "1 min", Category = "Morning", IconType = "Battery" },
                    new Ritual { Id = Guid.NewGuid(), Title = "Mindful Walk",              Description = "Take a walk with full awareness.",          Duration = "15 min", Category = "Afternoon", IconType = "Walk" },
                    new Ritual { Id = Guid.NewGuid(), Title = "Evening Reflection",        Description = "Reflect on the events of the day.",         Duration = "10 min", Category = "Evening", IconType = "Moon" },
                    new Ritual { Id = Guid.NewGuid(), Title = "Bedtime Blessing",          Description = "Send a blessing before sleep.",             Duration = "5 min",  Category = "Evening", IconType = "Star" },
                };
                await context.Rituals.AddRangeAsync(rituals);
                await context.SaveChangesAsync();
            }
        }
    }
}
