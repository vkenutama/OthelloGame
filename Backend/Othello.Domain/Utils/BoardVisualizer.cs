using Othello.Domain.Interfaces;

namespace Othello.Domain.Utils;

public static class BoardVisualizer
{
    public static void VisualizeBoard(IBoard board)
    {
        string msg = string.Empty;
        for (int i = 0; i < 8; i++)
        {
            msg += "[";
            for (int j = 0; j < 8; j++)
            {
                var cell = board.Cells[i, j];
                var piece = cell.Piece;

                msg += "[";

                if (piece == null)
                    msg += " ";
                else
                {
                    msg += (piece.Color == PieceColor.White) ? "W" : "B";
                }

                msg += "]";

            }

            msg += "]\r\n";
        }

        Console.WriteLine(msg);
    }
}