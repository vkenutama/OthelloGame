using System.Data;
using System.Diagnostics;
using System.Drawing;
using System.Security.Cryptography;
using Othello.Domain.Interfaces;

namespace Othello.Domain;

public class GameManager
{
    public IBoard Board { get; private set; }
    public PieceColor CurrentTurn { get; set; }
    public GameResult? Result { get; set; }
    private readonly IPlayer _blackPlayer;
    private readonly IPlayer _whitePlayer;
    private bool _isStarted;
    private bool _isProcessing = false;
    

    /// <summary>
    /// Game starting event
    /// </summary>
    public event Action GameStarted;

    /// <summary>
    /// Berhasil gerak
    /// </summary>
    public event Action<Move> MovePlayed;

    /// <summary>
    /// Jika score berubah
    /// </summary>
    public event Action<Score> ScoreChanged;

    /// <summary>
    /// Ketika ganti giliran player
    /// </summary>
    public event Action<PieceColor> TurnChanged;

    /// <summary>
    /// Player don't have valid move
    /// </summary>
    public event Action<PieceColor> TurnSkipped;

    /// <summary>
    /// Game over event
    /// </summary>
    public event Action<GameResult> GameOver;


    public GameManager(IPlayer player1, IPlayer player2)
    {
        // Make the board
        Board = new Board();

        // Place initial pieces
        PlaceInitialPieces();

        // Randomize player, who is color
        // 0 = player 1 white, 1 = player 1 black
        var rng = new Random();
        int rngResult = rng.Next(0, 1);

        if (rngResult == 0)
        {
            _whitePlayer = player1;
            _blackPlayer = player2;
        }
        else
        {
            _whitePlayer = player2;
            _blackPlayer = player1;
        }
    }

    public bool IsGameOver()
    {
        var whiteCanMove = HasValidMove(PieceColor.White);
        var blackCanMove = HasValidMove(PieceColor.Black);

        return !(whiteCanMove || blackCanMove);
    }

    /// <summary>
    /// Just a handling if an error occur
    /// </summary>
    /// <returns></returns>
    public MoveResult Start()
    {
        if (_isStarted)
        {
            return new MoveResult
            {
                Failure = MoveFailureReason.AlreadyStarted,
                Moves = null!,
                ISuccess = false
            };
        }

        CurrentTurn = PieceColor.Black;
        _isStarted = true;

        GameStarted?.Invoke();
        ScoreChanged?.Invoke(GetScore());
        TurnChanged?.Invoke(CurrentTurn);

        return new MoveResult
        {
            Failure = MoveFailureReason.None,
            Moves = null!,
            ISuccess = true
        };
    }

    public MoveResult TryPlayMove(Position position)
    {
        /*
         * Guards
         */

        #region Guards

        if (!_isStarted)
        {
            return new MoveResult()
            {
                Failure = MoveFailureReason.NotStarted,
                ISuccess = false,
                Moves = null!,
            };
        }

        if (IsGameOver())
        {
            return new MoveResult()
            {
                Failure = MoveFailureReason.GameOver,
                ISuccess = false,
                Moves = null!,
            };
        }

        if (_isProcessing)
        {
            return new MoveResult()
            {
                Failure = MoveFailureReason.ReentrantCall,
                ISuccess = false,
                Moves = null!,
            };
        }

        // Check if current input is inside the gameplay area array or not
        if (!IsInside(position))
        {
            return new MoveResult()
            {
                Failure = MoveFailureReason.OutOfBounds,
                Moves = null!,
                ISuccess = false
            };
        }

        // Check if cell is occupied
        bool occupied = GetCell(position)!.Piece is not null;
        if (occupied)
        {
            return new MoveResult
            {
                Failure = MoveFailureReason.CellOccupied,
                Moves = null!,
                ISuccess = false
            };
        }

        // If no flips available
        if (GetFlips(position, CurrentTurn) == null)
        {
            return new MoveResult
            {
                Failure = MoveFailureReason.NoPiecesFlipped,
                Moves = null!,
                ISuccess = false
            };
        }

        #endregion

        _isProcessing = true;

        var move = ApplyMove(position, CurrentTurn);

        MovePlayed?.Invoke(playerMove);

        // Advance to next player
        AdvanceTurn();

        return new MoveResult
        {
            Failure = MoveFailureReason.None,
            Moves = validMoves,
            ISuccess = true
        };
    }

    public IReadOnlyList<Position>? GetValidMoves()
    {
        var validMovePositions = FindValidMoves(CurrentTurn).Select(m => m.Target).ToList();
        
        return validMovePositions;
    }

    public Score GetScore()
    {
        int whiteScore = 0;
        int blackScore = 0;

        foreach (var cell in Board.Cells)
        {
            whiteScore += (cell.Piece?.Color == PieceColor.White) ? 1 : 0;
            blackScore += (cell.Piece?.Color == PieceColor.Black) ? 1 : 0;
        }

        return new Score
        {
            Black = blackScore,
            White = whiteScore
        };
    }

    public IPlayer GetPlayer(PieceColor color) => color == PieceColor.Black ? _blackPlayer : _whitePlayer;

    private void PlaceInitialPieces()
    {
        // Make the setup piece
        List<Piece> pieces = new List<Piece>();

        foreach (var color in new[] { PieceColor.White, PieceColor.Black })
        {
            pieces.Add(new Piece()
            {
                Color = color
            });
            pieces.Add(new Piece()
            {
                Color = color
            });
        }

        // Place the piece on the board
        int[,] setupPosition =
        {
            { 3, 3 }, // White
            { 4, 4 }, // White
            { 3, 4 }, // Black
            { 4, 3 }, // Black
        };

        // Place the four setup pieces
        for (int i = 0; i < pieces.Count; i++)
        {
            int row = setupPosition[i, 0];
            int col = setupPosition[i, 1];

            var cell = GetCell(new Position()
            {
                Row = row,
                Col = col
            });

            cell.Piece ??= pieces[i];
        }
    }

    private void PlayAutoTurns(List<Move> moves)
    {
    }

    /// <summary>
    /// Apply the move player made
    /// </summary>
    /// <param name="position"></param>
    /// <param name="color"></param>
    private Move ApplyMove(Position position, PieceColor color)
    {
        var cell = Board.Cells[position.Row, position.Col];
        cell.Piece ??= new Piece
        {
            Color = color
        };
        
        var flipped = findvalid

        return new Move
        {
            Target = position,
            Color = color,
            Flipped = null
        };
    }

    private void AdvanceTurn()
    {
        var opponent = CurrentTurn == PieceColor.Black ? PieceColor.White : PieceColor.Black;

        // Opponent has valid move
        if (HasValidMove(opponent))
        {
            CurrentTurn = opponent;
            TurnChanged?.Invoke(opponent);
        }

        // Opponent doesn't have valid move, current player still have
        if (HasValidMove(CurrentTurn))
        {
            TurnSkipped?.Invoke(opponent);
            TurnChanged?.Invoke(CurrentTurn);
        }

        // Both doesn't have valid move
        TryGetResult(out var result);
        Result = result;
        
        if (result != null)
        {
            GameOver?.Invoke(result.Value);
        }
    }
    
    private readonly IReadOnlyList<Direction> _directions = new List<Direction>()
    {
        new Direction
        {
            DRow = -1,
            DColumn = 0
        },
        new Direction
        {
            DRow = 1,
            DColumn = 0
        },

        new Direction
        {
            DRow = 0,
            DColumn = -1
        },

        new Direction
        {
            DRow = 0,
            DColumn = 1
        },

        new Direction
        {
            DRow = -1,
            DColumn = -1
        },
        new Direction
        {
            DRow = -1,
            DColumn = 1
        },

        new Direction
        {
            DRow = 1,
            DColumn = -1
        },
        new Direction
        {
            DRow = 1,
            DColumn = 1
        }
    };

    private List<Move> FindValidMoves(PieceColor color)
    {
        PieceColor opponentColor = color == PieceColor.Black ? PieceColor.White : PieceColor.Black;

        


        List<Move> validMoves = new List<Move>();

        // Loop through all the cell
        foreach (var cell in Board.Cells)
        {
            int row = cell.Position.Row;
            int col = cell.Position.Col;

            // Loop through all the direction in this cell
            foreach (var dir in _directions)
            {
                // Check 1 : Immediate neighbor (Distance 1)
                int currRow = row + dir.DRow;
                int currCol = col + dir.DColumn;

                Position offsettedPosition = new Position
                {
                    Row = currRow,
                    Col = currCol
                };

                ICell? offsettedCell = GetCell(offsettedPosition);

                // Off the board -> to next dir
                if (offsettedCell == null)
                {
                    continue;
                }

                // The cell does not contain piece -> to next dir
                if (offsettedCell.Piece == null)
                {
                    continue;
                }

                // This cell contain current player color
                if (offsettedCell.Piece.Color == color)
                {
                    continue;
                }

                // Check 2 : The Line March 
                if (offsettedCell.Piece.Color == opponentColor)
                {
                    while (true)
                    {
                        currRow += dir.DRow;
                        currCol += dir.DColumn;

                        offsettedPosition = new Position()
                        {
                            Row = currRow,
                            Col = currCol
                        };

                        offsettedCell = GetCell(offsettedPosition);

                        // Out of board
                        if (offsettedCell == null)
                        {
                            break;
                        }

                        // Empty cell
                        if (offsettedCell.Piece == null)
                        {
                            break;
                        }

                        // Target cell is opponent color
                        if (offsettedCell.Piece.Color == opponentColor)
                        {
                            continue;
                        }

                        // This cell is source position
                        if (offsettedCell.Piece.Color == color)
                        {
                            Position target = new Position()
                            {
                                Row = row,
                                Col = col
                            };

                            validMoves.Add(new Move
                            {
                                Target = target,
                                Color = color,
                                Flipped = GetFlips(target, color)
                            });
                            break;
                        }
                    }
                }
            }
        }


        return validMoves;
    }
    
    private List<Position>? GetFlips(Position position, PieceColor color)
    {
        // Get the 
    }

    /// <summary>
    /// Get cell based on <see cref="Position"/>
    /// </summary>
    /// <param name="position"></param>
    /// <returns></returns>
    private ICell? GetCell(Position position)
    {
        try
        {
            return Board.Cells[position.Row, position.Col];
        }
        catch (IndexOutOfRangeException e)
        {
            return null;
        }
    }

    private IPiece GetPiece(PieceColor color)
    {
        return new Piece
        {
            Color = color
        };
    }

    /// <summary>
    /// Check if current color has a valid move 
    /// </summary>
    /// <param name="color"></param>
    /// <returns></returns>
    private bool HasValidMove(PieceColor color) => FindValidMoves(color).Count > 0;


    /// <summary>
    /// Try to get the result of the game
    /// </summary>
    /// <param name="result">Output the <see cref="GameResult"/> enum</param>
    /// <returns>False if the game is not over</returns>
    private bool TryGetResult(out GameResult? result)
    {
        if (!IsGameOver())
        {
            result = null;
            return false;
        }

        Score score = GetScore();

        result = (score.White > score.Black) ? GameResult.WhiteWins :
            (score.White < score.Black) ? GameResult.BlackWins : GameResult.Draw;

        return true;
    }

    /// <summary>
    /// Check if the position is inside the 8x8 board gameplay 
    /// </summary>
    /// <param name="position">Player move position</param>
    /// <returns></returns>
    private bool IsInside(Position position)
    {
        if (position.Col > 7 || position.Row > 7 || position.Col < 0 || position.Row < 0)
        {
            return false;
        }

        return true;
    }
}