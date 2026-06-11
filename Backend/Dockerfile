# Stage 1: Build
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy solution and project files for layer-cached restore
COPY Hounded_Herart.sln ./
COPY Hounded_Heart.Api/Hounded_Heart.Api.csproj Hounded_Heart.Api/
COPY Hounded_Heart.Models/Hounded_Heart.Models.csproj Hounded_Heart.Models/
COPY Hounded_Heart.Services/Hounded_Heart.Services.csproj Hounded_Heart.Services/

RUN dotnet restore Hounded_Heart.Api/Hounded_Heart.Api.csproj

# Copy the rest of the source and publish
COPY . .
RUN dotnet publish -c Release -o /app/out Hounded_Heart.Api/Hounded_Heart.Api.csproj

# Stage 2: Runtime
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app

COPY --from=build /app/out ./out

ENV ASPNETCORE_URLS=http://+:8080
ENV ASPNETCORE_ENVIRONMENT=Production

EXPOSE 8080

ENTRYPOINT ["dotnet", "out/Hounded_Heart.Api.dll"]
