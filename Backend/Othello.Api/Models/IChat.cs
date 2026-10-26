namespace Othello.Api.Models;

public interface IChat
{
    public string Message { get; set; }
    public string Username { get; set; }
    public DateTime PostedAt { get; set; }
    public int? LobbyId { get; set; } 
}