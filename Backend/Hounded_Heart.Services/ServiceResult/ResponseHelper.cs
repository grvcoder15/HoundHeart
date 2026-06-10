namespace Hounded_Heart.Services.ServiceResult
{
    public static class ResponseHelper
    {
        public static ApiResponse<T> Success<T>(T data, string message = "Success", int statusCode = 200)
        {
            return new ApiResponse<T>
            {
                Success = true,
                Message = message,
                Data = data,
                StatusCode = statusCode
            };
        }

        public static ApiResponse<T> Fail<T>(string message, int statusCode = 400)
        {
            return new ApiResponse<T>
            {
                Success = false,
                Message = message,
                Data = default,
                StatusCode = statusCode
            };
        }

        
    }

}
