# 🔗 .NET 8 API Integration Guide

## 📋 Overview

This guide explains how to integrate your .NET 8 backend API with the HoundHeart frontend.

## 🚀 Quick Setup

### 1. **Set Your API URL**

Create a `.env` file in your project root:
```bash
VITE_API_URL=https://mqckx32p-7194.inc1.devtunnels.ms/api
```

Or update directly in `src/services/apiService.js` (already configured).

### 2. **Update API Service**

Edit `src/services/apiService.js` line 2:
```javascript
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://mqckx32p-7194.inc1.devtunnels.ms/api';
```

## 🔧 Your .NET 8 API Integration

### **API Endpoint Structure**

Your .NET 8 API expects this request format:

#### **POST /Account/register**
```json
{
  "Email": "user@example.com",
  "Password": "password123",
  "FullName": "John Doe",
  "ProfilePhoto": null,
  "IsTermsAccepted": true
}
```

#### **Expected Response Format**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "UserId": "guid-here",
    "Token": "jwt-token-here"
  }
}
```

### **Error Response Format**
```json
{
  "success": false,
  "message": "Error description",
  "statusCode": 400
}
```

## 🛠️ Implementation Details

### **Frontend Changes Made:**

1. **Created `src/services/apiService.js`**
   - Handles API calls to your .NET 8 backend
   - Maps frontend data to your API format
   - Manages authentication tokens

2. **Updated `src/Pages/SignupPage.jsx`**
   - Added API integration
   - Added loading states
   - Added error handling
   - Added form validation

### **Data Mapping:**

| Frontend Field | .NET 8 API Field | Type |
|----------------|------------------|------|
| `email` | `Email` | string |
| `password` | `Password` | string |
| `fullName` | `FullName` | string |
| `isTermsAccepted` | `IsTermsAccepted` | boolean |
| `profilePhoto` | `ProfilePhoto` | string? |

## 🔒 Authentication Flow

1. **User submits signup form**
2. **Frontend validates data**
3. **API call to `/Account/register`**
4. **Backend creates user and returns JWT token**
5. **Frontend stores token in localStorage**
6. **Navigate to profile setup**

## 🚨 Error Handling

The integration handles these error scenarios:

- **Email already exists** (400)
- **Invalid email format** (400)
- **Password too short** (400)
- **Terms not accepted** (400)
- **Network errors** (500)
- **Server errors** (500)

## 🧪 Testing the Integration

### **Step 1: Start Your .NET 8 API**
```bash
# In your .NET project directory
dotnet run
```

### **Step 2: Update API URL**
Set your API URL in the environment or directly in `apiService.js`

### **Step 3: Test the Flow**
1. Open your React app
2. Navigate to signup page
3. Fill out the form
4. Submit and check browser console for API calls

### **Step 4: Check Network Tab**
- Open browser DevTools
- Go to Network tab
- Submit the form
- Look for the POST request to `/Account/register`

## 🔧 Troubleshooting

### **CORS Issues**
If you get CORS errors, add this to your .NET 8 API:

```csharp
// In Program.cs or Startup.cs
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactApp", policy =>
    {
        policy.WithOrigins("http://localhost:3000", "http://localhost:5173")
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

// Use the policy
app.UseCors("AllowReactApp");
```

### **API URL Issues**
- Make sure your .NET API is running
- Check the correct port (usually 7000 or 5000)
- Verify the endpoint path is correct

### **Token Issues**
- Check if the JWT token is being returned
- Verify token is stored in localStorage
- Check token format matches expectations

## 📱 Frontend Features

### **✅ Implemented Features:**
- Form validation matching your .NET 8 model
- Loading states during API calls
- Error handling for all scenarios
- Token management
- Responsive design maintained

### **✅ Validation Rules:**
- Email format validation
- Password minimum 6 characters
- Full name required
- Terms acceptance required

## 🎯 Next Steps

1. **Test the current integration**
2. **Verify API responses**
3. **Check token storage**
4. **Test error scenarios**
5. **Move to login integration**

## 📞 Support

If you encounter issues:

1. **Check browser console** for error messages
2. **Check Network tab** for API call details
3. **Verify your .NET API** is running and accessible
4. **Check CORS configuration** in your .NET API
5. **Verify endpoint paths** match your API

## 🔄 API Call Flow

```
Frontend Form → Validation → API Service → .NET 8 API → Response → Token Storage → Navigation
```

The integration is now ready to work with your .NET 8 backend! 🎉
