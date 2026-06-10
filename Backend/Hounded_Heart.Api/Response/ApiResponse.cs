using System;

namespace Hounded_Heart.Api.Response
{
    public class ApiResponse<T>
    {
        public bool Success { get; set; }

        public string Message { get; set; } = string.Empty;

        public T Data { get; set; }

        public int StatusCode { get; set; } // HTTP status code

        public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    }
}
