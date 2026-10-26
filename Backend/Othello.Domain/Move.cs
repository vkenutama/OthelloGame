namespace Othello.Domain;

public record Move()
{
    public Position Target { get; set; }
    public PieceColor Color { get; set; }
    public IReadOnlyList<Position> Flipped { get; init; } = Array.Empty<Position>();
}
