using Othello.Domain.Interfaces;

namespace Othello.Domain;

public class Board : IBoard
{
    public int Size
    {
        get => Cells.Length;
    }

    public ICell[,] Cells { get; set; }

    public Board()
    {
        // Make the 8x8 cell  
        ICell[,] cells = new ICell[8, 8];

        for (int i = 0; i < 8; i++)
        {
            for (int j = 0; j < 8; j++)
            {
                cells[i, j] = new Cell
                {
                    Position = new Position
                    {
                        Row = i,
                        Col = j,

                    },
                    Piece = null
                };
            }
        }

        Cells = cells;
    }
}