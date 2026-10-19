namespace Othello.Domain;

public enum MoveFailureReason
{
    None,
    NotStarted, // handling
    AlreadyStarted, // handling
    GameOver, 
    OutOfBounds,
    CellOccupied, // other player
    NoPiecesFlipped, // no valid move
    ReentrantCall // handling if other player playing when it's not them turn handling interrupt
}