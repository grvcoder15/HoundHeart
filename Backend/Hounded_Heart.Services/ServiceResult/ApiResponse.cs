using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Hounded_Heart.Services.ServiceResult
{
    public class ApiResponse<T>
    {
        public bool Success { get; set; } 
        public string Message { get; set; } = string.Empty;
        public T Data { get; set; } 
        public int StatusCode { get; set; } 
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    }
}
