namespace Othello.Api.Dtos;

public record PositionDto(int Row, int Col);

public record GameStateDto
{
    public required string GameId { get; init; }
    public required string?[,] Board { get; init; } // e.g. "B", "W", or null
    public required string CurrentTurn { get; init; } // "Black" or "White"
    
    public required int BlackScore { get; init; }
    public required int WhiteScore { get; init; }
    public required IReadOnlyList<PositionDto> ValidMoves { get; init; }
    public bool IsGameOver { get; init; }
    public string? Winner { get; init; }
    
}

public record MoveResultDto
{
    public required PositionDto PositionDto { get; init; }
    public required string Color { get; init; }
    public required int FlippedCount {get; init; }
    
}

public record MakeMoveDto
{
    public int LobbyId { get; init; }
    public string PlayerUsername { get; init; } = string.Empty;
    public int Row { get; init; }
    public int Col { get; init; }
}