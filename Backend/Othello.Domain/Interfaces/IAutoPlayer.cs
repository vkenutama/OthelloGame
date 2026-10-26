namespace Othello.Domain.Interfaces;

public interface IAutoPlayer : IPlayer
{
    public Move ChooseMove(IReadOnlyList<Move> moves);
}
