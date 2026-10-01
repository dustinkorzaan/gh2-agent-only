using Microsoft.AspNetCore.Mvc;

namespace Gh.Api.Controllers;

[ApiController]
[Route("health")]
public sealed class HealthController : ControllerBase
{
    [HttpGet]
    public ActionResult<HealthResponse> Get()
    {
        return Ok(new HealthResponse("ok"));
    }
}

public sealed record HealthResponse(string Status);
