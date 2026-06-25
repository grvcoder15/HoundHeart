using Hounded_Heart.Models.Data;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Text.RegularExpressions;

namespace Hounded_Heart.Services.Helpers
{
    public static class SubscriptionDonationHelper
    {
        private static readonly Regex FixedDonationRegex = new(
            @"\$(\d+(?:\.\d{1,2})?)\s*donation",
            RegexOptions.IgnoreCase | RegexOptions.Compiled);

        private static readonly Regex PercentDonationRegex = new(
            @"(\d+(?:\.\d{1,2})?)\s*%\s*(?:of\s*)?donation",
            RegexOptions.IgnoreCase | RegexOptions.Compiled);

        public static SubscriptionPlan? ResolvePlan(
            Subscription subscription,
            IReadOnlyList<SubscriptionPlan> plans)
        {
            if (!string.IsNullOrWhiteSpace(subscription.StripePriceId))
            {
                var byPriceId = plans.FirstOrDefault(p =>
                    !string.IsNullOrWhiteSpace(p.StripePriceId) &&
                    p.StripePriceId.Equals(subscription.StripePriceId, StringComparison.OrdinalIgnoreCase));

                if (byPriceId != null)
                    return byPriceId;
            }

            if (string.IsNullOrWhiteSpace(subscription.PlanName))
                return null;

            var nameMatches = plans
                .Where(p => p.PlanName.Equals(subscription.PlanName, StringComparison.OrdinalIgnoreCase))
                .ToList();

            if (nameMatches.Count == 1)
                return nameMatches[0];

            if (nameMatches.Count > 1 && subscription.Amount.HasValue)
            {
                return nameMatches
                    .OrderBy(p => Math.Abs(p.Price - subscription.Amount.Value))
                    .FirstOrDefault();
            }

            return nameMatches.FirstOrDefault();
        }

        public static decimal CalculateDonation(
            Subscription subscription,
            SubscriptionPlan? plan,
            decimal premiumShirtGiveBackAmount = 6m)
        {
            if (plan == null)
                return 0m;

            var paidAmount = subscription.Amount ?? plan.Price;
            var donation = plan.DonationAmount > 0
                ? plan.DonationAmount
                : ParseDonationFromFeatures(plan.Features, paidAmount, plan.Price);

            if (premiumShirtGiveBackAmount > 0 &&
                plan.TierLevel.Equals("premium", StringComparison.OrdinalIgnoreCase) &&
                IncludesPremiumShirtBenefit(plan.Features))
            {
                donation += premiumShirtGiveBackAmount;
            }

            return donation;
        }

        public static decimal ParseDonationFromFeatures(string? featuresJson, decimal paidAmount, decimal planPrice)
        {
            foreach (var feature in ReadFeatures(featuresJson))
            {
                var percentMatch = PercentDonationRegex.Match(feature);
                if (percentMatch.Success &&
                    decimal.TryParse(percentMatch.Groups[1].Value, out var percent))
                {
                    return Math.Round(paidAmount * percent / 100m, 2);
                }

                var fixedMatch = FixedDonationRegex.Match(feature);
                if (fixedMatch.Success &&
                    decimal.TryParse(fixedMatch.Groups[1].Value, out var fixedAmount))
                {
                    if (planPrice > 0 && paidAmount > 0 && paidAmount != planPrice)
                        return Math.Round(fixedAmount * paidAmount / planPrice, 2);

                    return fixedAmount;
                }
            }

            return 0m;
        }

        private static bool IncludesPremiumShirtBenefit(string? featuresJson) =>
            ReadFeatures(featuresJson).Any(feature =>
                feature.Contains("t-shirt", StringComparison.OrdinalIgnoreCase) ||
                feature.Contains("tshirt", StringComparison.OrdinalIgnoreCase));

        private static IEnumerable<string> ReadFeatures(string? featuresJson)
        {
            if (string.IsNullOrWhiteSpace(featuresJson))
                return Array.Empty<string>();

            try
            {
                return JsonSerializer.Deserialize<List<string>>(featuresJson) ?? new List<string>();
            }
            catch
            {
                return Array.Empty<string>();
            }
        }
    }
}
