namespace Othello.Domain;

public record MoveResult()
{
    public MoveFailureReason Failure { get; set; }
    public IReadOnlyList<Move> Moves { get; set; }
    public bool IsSuccess { get; set; }
}