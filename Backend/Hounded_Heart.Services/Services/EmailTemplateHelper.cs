using System.Net;

namespace Hounded_Heart.Services.Services
{
    public static class EmailTemplateHelper
    {
        public static string Build(string heading, string? recipientName, string bodyHtml)
        {
            var name = WebUtility.HtmlEncode(recipientName ?? "there");
            return $@"
<html>
<body style='font-family: Arial, sans-serif;'>
  <h2>{WebUtility.HtmlEncode(heading)}</h2>
  <p>Hi {name},</p>
  {bodyHtml}
  <p>Best regards,<br/>The Hound Heart Team</p>
</body>
</html>";
        }
    }
}
