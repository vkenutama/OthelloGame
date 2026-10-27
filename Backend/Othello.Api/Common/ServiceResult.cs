using Microsoft.AspNetCore.Mvc;

namespace Othello.Api.Common;

public enum ServiceErrorType
{
    None,
    NotFound,
    BadRequest,
    Conflict,
    Unauthorized,
    InternalError
}

public class ServiceResult<T>
{
    public bool IsSuccess { get; }
    public T? Data { get; }
    public string? ErrorMessage { get; }
    public ServiceErrorType ErrorType { get; }

    private ServiceResult(bool isSuccess, T? data, string? errorMessage, ServiceErrorType errorType)
    {
        IsSuccess = isSuccess;
        Data = data;
        ErrorMessage = errorMessage;
        ErrorType = errorType;
    }

    public static ServiceResult<T> Success(T data) =>
        new(true, data, null, ServiceErrorType.None);

    public static ServiceResult<T> NotFound(string message = "Resource not found") =>
        new(false, default, message, ServiceErrorType.NotFound);

    public static ServiceResult<T> BadRequest(string message) =>
        new(false, default, message, ServiceErrorType.BadRequest);

    public static ServiceResult<T> Conflict(string message) =>
        new(false, default, message, ServiceErrorType.Conflict);

    public static ServiceResult<T> Unauthorized(string message) =>
        new(false, default, message, ServiceErrorType.Unauthorized);

    public static ServiceResult<T> Failure(string message, ServiceErrorType errorType = ServiceErrorType.BadRequest) =>
        new(false, default, message, errorType);
}

public class ServiceResult
{
    public bool IsSuccess { get; }
    public string? ErrorMessage { get; }
    public ServiceErrorType ErrorType { get; }

    private ServiceResult(bool isSuccess, string? errorMessage, ServiceErrorType errorType)
    {
        IsSuccess = isSuccess;
        ErrorMessage = errorMessage;
        ErrorType = errorType;
    }

    public static ServiceResult Success() =>
        new(true, null, ServiceErrorType.None);

    public static ServiceResult NotFound(string message = "Resource not found") =>
        new(false, message, ServiceErrorType.NotFound);

    public static ServiceResult BadRequest(string message) =>
        new(false, message, ServiceErrorType.BadRequest);

    public static ServiceResult Conflict(string message) =>
        new(false, message, ServiceErrorType.Conflict);

    public static ServiceResult Unauthorized(string message) =>
        new(false, message, ServiceErrorType.Unauthorized);

    public static ServiceResult Failure(string message, ServiceErrorType errorType = ServiceErrorType.BadRequest) =>
        new(false, message, errorType);
}

public static class ServiceResultExtensions
{
    public static ActionResult ToActionResult<T>(this ServiceResult<T> result)
    {
        if (result.IsSuccess)
        {
            return new OkObjectResult(result.Data);
        }

        return result.ErrorType switch
        {
            ServiceErrorType.NotFound => new NotFoundObjectResult(new { message = result.ErrorMessage }),
            ServiceErrorType.Conflict => new ConflictObjectResult(new { message = result.ErrorMessage }),
            ServiceErrorType.Unauthorized => new UnauthorizedObjectResult(new { message = result.ErrorMessage }),
            _ => new BadRequestObjectResult(new { message = result.ErrorMessage })
        };
    }

    public static ActionResult ToActionResult(this ServiceResult result)
    {
        if (result.IsSuccess)
        {
            return new OkResult();
        }

        return result.ErrorType switch
        {
            ServiceErrorType.NotFound => new NotFoundObjectResult(new { message = result.ErrorMessage }),
            ServiceErrorType.Conflict => new ConflictObjectResult(new { message = result.ErrorMessage }),
            ServiceErrorType.Unauthorized => new UnauthorizedObjectResult(new { message = result.ErrorMessage }),
            _ => new BadRequestObjectResult(new { message = result.ErrorMessage })
        };
    }
}
