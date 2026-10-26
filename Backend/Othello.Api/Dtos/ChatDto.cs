namespace Othello.Api.Dtos;

public record SendChatDto
{
    public string Message { get; set; } = string.Empty;
    public string Username { get; set; } = string.Empty;
    public DateTime PostedAt { get; private set; } = DateTime.UtcNow;
    public int? LobbyId { get; set; } = null;
}

public record ReceiveChatDto
{
    public string Id { get; init; } = Guid.NewGuid().ToString();
    public string Message { get; set; } = string.Empty;
    public string Username { get; set; } = string.Empty;
    public DateTime PostedAt { get; init; } = DateTime.UtcNow;
    public int? LobbyId { get; init; } = null;
}
