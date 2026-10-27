namespace Othello.Domain;

public record MoveResult
{
    public MoveFailureReason Failure { get; set; }
    public IReadOnlyList<Move> Moves { get; set; } = Array.Empty<Move>();
    public bool IsSuccess { get; set; }
}
