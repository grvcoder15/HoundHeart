using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Hounded_Heart.Models.Data
{
    [Table("SiteSettings")]
    public class SiteSetting
    {
        [Key]
        [MaxLength(100)]
        public string SettingKey { get; set; }

        public string SettingValue { get; set; }
    }
}
