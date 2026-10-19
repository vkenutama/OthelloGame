using System.Text;

namespace Othello.ConsoleApp;

using Othello.Domain;
using Othello.Domain.Utils;

class Program
{
    static WeakReference GetWeakRef()
    {
        return new WeakReference(new StringBuilder("Hello"));
    }

    static void Main(string[] args)
    {

        HumanPlayer player1 = new HumanPlayer
        {
            Color = PieceColor.Black,
            Name = "Joko"
        };

        HumanPlayer player2 = new HumanPlayer
        {
            Color = PieceColor.White,
            Name = "Wi"
        };


        GameManager game = new GameManager(player1, player2);
        game.Start();
        
        game.GetValidMoves();
        BoardVisualizer.VisualizeBoard(game.Board);
    }
}

class TryGC
{
    public TryGC()
    {
        // GC.SuppressFinalize(this);
    }

    ~TryGC()
    {
        Console.WriteLine("Finalizer called");
    }
}