using Othello.Api.Dtos;

namespace Othello.Api.Hubs;

public interface IGameClient
{
    Task ReceiveGameState(GameStateDto state);
    Task MovePlayed(MoveResultDto move);
    Task TurnSkipped(string skippedColor);
    Task GameOver(string result, int blackScore, int whiteScore);
    Task ErrorMessage(string message);
    Task ReceiveBroadcast(string message);
    Task LobbyDeleted(string message);
}