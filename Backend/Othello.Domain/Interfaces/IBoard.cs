namespace Othello.Domain.Interfaces;

public interface IBoard
{
    public int Size { get;}
    public ICell[,] Cells { get; set; }
}