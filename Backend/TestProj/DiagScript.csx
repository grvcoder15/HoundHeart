using System;
using System.Threading.Tasks;
using Npgsql;

var connStr = @"Host=db.vwohagwmmdqbgnswxwjb.supabase.co;Port=6543;Database=postgres;Username=postgres;Password=Csharptek@105;SSL Mode=Require;Trust Server Certificate=true";
await using var conn = new NpgsqlConnection(connStr);
await conn.OpenAsync();

async Task Query(string label, string sql)
{
    Console.WriteLine($"\n=== {label} ===");
    await using var cmd = new NpgsqlCommand(sql, conn);
    await using var r = await cmd.ExecuteReaderAsync();
    bool any = false;
    while (await r.ReadAsync())
    {
        any = true;
        var cols = new string[r.FieldCount];
        for (int i = 0; i < r.FieldCount; i++)
            cols[i] = $"{r.GetName(i)}={( r.IsDBNull(i) ? "NULL" : r.GetValue(i))}";
        Console.WriteLine("  " + string.Join(" | ", cols));
    }
    if (!any) Console.WriteLine("  (no rows)");
}

await Query("DogBaselines for this dog",
    @"SELECT ""DogId"", ""IsBaselineEstablished"", ""AvgActivityScore"", ""AvgMinActive"", ""BaselineDays"" 
      FROM ""DogBaselines"" WHERE ""DogId"" = '69d60cde-6f5d-4d40-829e-957d31f568ee'");

await Query("UserBaselines for this user",
    @"SELECT ""UserId"", ""IsBaselineEstablished"", ""AvgSteps"", ""BaselineDays""
      FROM ""UserBaselines"" WHERE ""UserId"" = 'a404d592-0892-4a74-9d3c-9a8233a180f4'");

await Query("DogVitals last 7 days (count per day)",
    @"SELECT DATE(""TimestampUtc"") as day, COUNT(*) as records, AVG(""ActivityScore"") as avg_activity
      FROM ""DogVitals"" WHERE ""DogId"" = '69d60cde-6f5d-4d40-829e-957d31f568ee'
      AND ""TimestampUtc"" >= NOW() - INTERVAL '7 days'
      GROUP BY DATE(""TimestampUtc"") ORDER BY day DESC");

await Query("HumanVitals last 7 days (count per day)",
    @"SELECT DATE(""TimestampUtc"") as day, COUNT(*) as records, AVG(""Steps"") as avg_steps
      FROM ""HumanVitals"" WHERE ""UserId"" = 'a404d592-0892-4a74-9d3c-9a8233a180f4'
      AND ""TimestampUtc"" >= NOW() - INTERVAL '7 days'
      GROUP BY DATE(""TimestampUtc"") ORDER BY day DESC");

await Query("TODAY DogVitals (critical - is currentDogVital null?)",
    @"SELECT ""TimestampUtc"", ""ActivityScore"", ""MinActive"", ""MinPlay"", ""State""
      FROM ""DogVitals"" WHERE ""DogId"" = '69d60cde-6f5d-4d40-829e-957d31f568ee'
      AND ""TimestampUtc"" >= NOW()::date AND ""TimestampUtc"" < NOW()::date + INTERVAL '1 day'
      ORDER BY ""TimestampUtc"" DESC LIMIT 3");

await Query("TODAY HumanVitals",
    @"SELECT ""TimestampUtc"", ""Steps"", ""ActiveMinutes"", ""StressScore"", ""HRV""
      FROM ""HumanVitals"" WHERE ""UserId"" = 'a404d592-0892-4a74-9d3c-9a8233a180f4'
      AND ""TimestampUtc"" >= NOW()::date AND ""TimestampUtc"" < NOW()::date + INTERVAL '1 day'
      ORDER BY ""TimestampUtc"" DESC LIMIT 3");

await Query("CheckIns table - Questions field (keyword matching)",
    @"SELECT ""CheckInId"", ""Questions"" FROM ""CheckIns"" WHERE ""IsDeleted"" = FALSE");
