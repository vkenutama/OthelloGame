namespace Othello.Api.Models;

public class Chat : IChat
{
    public string Message { get; set; } = string.Empty;
    public string Username { get; set; } = string.Empty;
    public DateTime PostedAt { get; set; } = DateTime.UtcNow;
    
    /// <summary>
    /// If null, this chat belong to global chat
    /// </summary>
    public int? LobbyId { get; set; }
}