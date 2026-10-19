namespace Othello.Domain.Interfaces;

public interface IAutoPlayer
{
    public Move ChooseMove(IReadOnlyList<Move> moves);
}