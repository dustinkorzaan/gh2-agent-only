var builder = WebApplication.CreateBuilder(args);
var app = builder.Build();

app.MapGet(
    "/api/gh-api/hello",
    () => Results.Ok(new HelloResponse("Hello World", DateTimeOffset.UtcNow)));

app.Run();

public sealed record HelloResponse(string Message, DateTimeOffset TimestampUtc);

public partial class Program { }
