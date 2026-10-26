using Othello.Api.Dtos;

namespace Othello.Api.Hubs;

public interface IOthelloGameplayService
{
    Task MakeMove(MakeMoveDto dto);
    Task StartGame(StartGameDto dto);
}