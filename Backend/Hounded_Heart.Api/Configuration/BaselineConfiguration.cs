namespace Hounded_Heart.Api.Configuration
{
    public class BaselineConfiguration
    {
        public const string SectionName = "BaselineConfiguration";
        
        /// <summary>
        /// Duration in minutes to wait before attempting baseline calculation
        /// </summary>
        public int DurationMinutes { get; set; } = 15;
        
        /// <summary>
        /// Minimum number of vitals records required for baseline calculation
        /// </summary>
        public int MinimumDataPoints { get; set; } = 8;
        
        /// <summary>
        /// How often the background service checks for baseline calculation opportunities
        /// </summary>
        public int CheckIntervalMinutes { get; set; } = 1;
        
        /// <summary>
        /// Whether automatic baseline calculation is enabled
        /// </summary>
        public bool EnableAutomaticCalculation { get; set; } = true;
    }
}