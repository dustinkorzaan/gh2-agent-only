using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Mvc.Testing;

namespace Gh.Api.Tests;

public sealed class HelloEndpointTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly HttpClient _client;

    public HelloEndpointTests(WebApplicationFactory<Program> factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task GetHelloReturnsGreetingAndUtcTimestamp()
    {
        // AC1
        var requestStartedAt = DateTimeOffset.UtcNow;
        using var response = await _client.GetAsync("/api/gh-api/hello");
        var responseReceivedAt = DateTimeOffset.UtcNow;

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var body = await response.Content.ReadFromJsonAsync<HelloResponse>();
        Assert.NotNull(body);
        Assert.Equal("Hello World", body.Message);
        Assert.Equal(TimeSpan.Zero, body.TimestampUtc.Offset);
        Assert.InRange(body.TimestampUtc, requestStartedAt, responseReceivedAt);
    }

    private sealed record HelloResponse(string Message, DateTimeOffset TimestampUtc);
}
