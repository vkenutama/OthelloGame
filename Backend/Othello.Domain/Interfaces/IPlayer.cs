namespace Othello.Domain.Interfaces;

public interface IPlayer
{
    public PieceColor Color { get; set; }
    public string Name { get; set; }
}