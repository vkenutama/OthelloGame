namespace Othello.Domain.Interfaces;

public interface ICell
{
    public Position Position { get; set; }
    public IPiece? Piece { get; set; }
}