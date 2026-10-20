using Othello.Domain.Interfaces;

namespace Othello.Domain;

public class GameManager
{
    public IBoard Board { get; private set; }
    public PieceColor CurrentTurn { get; set; }
    public GameResult? Result { get; set; }
    private readonly IPlayer _blackPlayer;
    private readonly IPlayer _whitePlayer;
    private readonly IPiece _blackPiece;
    private readonly IPiece _whitePiece;
    private bool _isStarted;
    private bool _isProcessing;

    private static readonly IReadOnlyList<Direction> _directions = new List<Direction>
    {
        new Direction { DRow = -1, DCol = 0 },
        new Direction { DRow = 1, DCol = 0 },
        new Direction { DRow = 0, DCol = -1 },
        new Direction { DRow = 0, DCol = 1 },
        new Direction { DRow = -1, DCol = -1 },
        new Direction { DRow = -1, DCol = 1 },
        new Direction { DRow = 1, DCol = -1 },
        new Direction { DRow = 1, DCol = 1 }
    };

    /// <summary>
    /// Game starting event
    /// </summary>
    public event Action? GameStarted;

    /// <summary>
    /// Move played event
    /// </summary>
    public event Action<Move>? MovePlayed;

    /// <summary>
    /// Score changed event
    /// </summary>
    public event Action<Score>? ScoreChanged;

    /// <summary>
    /// Turn changed event
    /// </summary>
    public event Action<PieceColor>? TurnChanged;

    /// <summary>
    /// Player has no valid move event
    /// </summary>
    public event Action<PieceColor>? TurnSkipped;

    /// <summary>
    /// Game over event
    /// </summary>
    public event Action<GameResult>? GameOver;

    public GameManager(IPlayer player1, IPlayer player2)
    {
        Board = new Board();
        _blackPiece = new Piece { Color = PieceColor.Black };
        _whitePiece = new Piece { Color = PieceColor.White };

        // Randomize player colors
        var rng = new Random();
        if (rng.Next(0, 2) == 0)
        {
            _whitePlayer = player1;
            _blackPlayer = player2;
        }
        else
        {
            _whitePlayer = player2;
            _blackPlayer = player1;
        }

        _whitePlayer.Color = PieceColor.White;
        _blackPlayer.Color = PieceColor.Black;
        CurrentTurn = PieceColor.Black;
        PlaceInitialPieces();
    }

    public GameManager(IPlayer blackPlayer, IPlayer whitePlayer, IBoard board, IPiece blackPiece, IPiece whitePiece)
    {
        _blackPlayer = blackPlayer;
        _whitePlayer = whitePlayer;
        _blackPlayer.Color = PieceColor.Black;
        _whitePlayer.Color = PieceColor.White;
        Board = board;
        _blackPiece = blackPiece;
        _whitePiece = whitePiece;
        CurrentTurn = PieceColor.Black;
        PlaceInitialPieces();
    }

    public bool IsGameOver()
    {
        var whiteCanMove = HasValidMove(PieceColor.White);
        var blackCanMove = HasValidMove(PieceColor.Black);

        return !(whiteCanMove || blackCanMove);
    }

    public MoveResult Start()
    {
        if (_isStarted)
        {
            return new MoveResult
            {
                Failure = MoveFailureReason.AlreadyStarted,
                Moves = null!,
                IsSuccess = false
            };
        }

        CurrentTurn = PieceColor.Black;
        _isStarted = true;

        GameStarted?.Invoke();
        ScoreChanged?.Invoke(GetScore());
        TurnChanged?.Invoke(CurrentTurn);

        List<Move> autoMoves = new List<Move>();
        _isProcessing = true;
        try
        {
            PlayAutoTurns(autoMoves);
        }
        finally
        {
            _isProcessing = false;
        }

        return new MoveResult
        {
            Failure = MoveFailureReason.None,
            Moves = autoMoves,
            IsSuccess = true
        };
    }

    public MoveResult TryPlayMove(Position position)
    {
        #region Guards

        if (!_isStarted)
        {
            return new MoveResult
            {
                Failure = MoveFailureReason.NotStarted,
                IsSuccess = false,
                Moves = null!,
            };
        }

        if (IsGameOver())
        {
            return new MoveResult
            {
                Failure = MoveFailureReason.GameOver,
                IsSuccess = false,
                Moves = null!,
            };
        }

        if (_isProcessing)
        {
            return new MoveResult
            {
                Failure = MoveFailureReason.ReentrantCall,
                IsSuccess = false,
                Moves = null!,
            };
        }

        if (!IsInside(position))
        {
            return new MoveResult
            {
                Failure = MoveFailureReason.OutOfBounds,
                Moves = null!,
                IsSuccess = false
            };
        }

        var cell = GetCell(position);
        if (cell?.Piece != null)
        {
            return new MoveResult
            {
                Failure = MoveFailureReason.CellOccupied,
                Moves = null!,
                IsSuccess = false
            };
        }

        if (GetFlips(position, CurrentTurn) == null)
        {
            return new MoveResult
            {
                Failure = MoveFailureReason.NoPiecesFlipped,
                Moves = null!,
                IsSuccess = false
            };
        }

        #endregion

        _isProcessing = true;
        try
        {
            var move = ApplyMove(position, CurrentTurn);
            MovePlayed?.Invoke(move);
            ScoreChanged?.Invoke(GetScore());

            List<Move> moves = new List<Move> { move };

            AdvanceTurn();
            PlayAutoTurns(moves);

            return new MoveResult
            {
                Failure = MoveFailureReason.None,
                Moves = moves,
                IsSuccess = true
            };
        }
        finally
        {
            _isProcessing = false;
        }
    }

    public IReadOnlyList<Position>? GetValidMoves()
    {
        return FindValidMoves(CurrentTurn).Select(m => m.Target).ToList();
    }

    public Score GetScore()
    {
        int blackScore = 0;
        int whiteScore = 0;

        foreach (var cell in Board.Cells)
        {
            if (cell.Piece == null)
            {
                continue;
            }

            if (cell.Piece.Color == PieceColor.Black)
            {
                blackScore++;
            }
            else
            {
                whiteScore++;
            }
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
        int[,] setupPosition =
        {
            { 3, 3 }, // White
            { 4, 4 }, // White
            { 3, 4 }, // Black
            { 4, 3 }, // Black
        };

        IPiece[] pieces =
        {
            GetPiece(PieceColor.White),
            GetPiece(PieceColor.White),
            GetPiece(PieceColor.Black),
            GetPiece(PieceColor.Black)
        };

        for (int i = 0; i < pieces.Length; i++)
        {
            int row = setupPosition[i, 0];
            int col = setupPosition[i, 1];

            var cell = GetCell(new Position { Row = row, Col = col });
            if (cell != null)
            {
                cell.Piece ??= pieces[i];
            }
        }
    }

    private void PlayAutoTurns(List<Move> moves)
    {
        while (!IsGameOver() && GetPlayer(CurrentTurn) is IAutoPlayer auto)
        {
            var candidates = FindValidMoves(CurrentTurn);
            if (candidates.Count == 0)
            {
                break;
            }

            var choice = auto.ChooseMove(candidates);
            if (choice == null || !candidates.Any(c => c.Target.Row == choice.Target.Row && c.Target.Col == choice.Target.Col))
            {
                throw new InvalidOperationException($"Auto player {((IPlayer)auto).Name} returned an invalid move.");
            }

            var move = ApplyMove(choice.Target, CurrentTurn);
            MovePlayed?.Invoke(move);
            ScoreChanged?.Invoke(GetScore());
            moves.Add(move);

            AdvanceTurn();
        }
    }

    private Move ApplyMove(Position position, PieceColor color)
    {
        var flipped = GetFlips(position, color) ?? new List<Position>();

        var targetCell = Board.Cells[position.Row, position.Col];
        targetCell.Piece = GetPiece(color);

        foreach (var flipPos in flipped)
        {
            var cellToFlip = Board.Cells[flipPos.Row, flipPos.Col];
            if (cellToFlip.Piece != null)
            {
                cellToFlip.Piece = GetPiece(color);
            }
        }

        return new Move
        {
            Target = position,
            Color = color,
            Flipped = flipped
        };
    }

    private void AdvanceTurn()
    {
        var opponent = CurrentTurn == PieceColor.Black ? PieceColor.White : PieceColor.Black;

        if (HasValidMove(opponent))
        {
            CurrentTurn = opponent;
            TurnChanged?.Invoke(opponent);
        }
        else if (HasValidMove(CurrentTurn))
        {
            TurnSkipped?.Invoke(opponent);
            TurnChanged?.Invoke(CurrentTurn);
        }

        TryGetResult(out var result);
        Result = result;

        if (result != null)
        {
            GameOver?.Invoke(result.Value);
        }
    }

    private List<Move> FindValidMoves(PieceColor color)
    {
        List<Move> validMoves = new List<Move>();

        foreach (var cell in Board.Cells)
        {
            if (cell.Piece != null)
            {
                continue;
            }

            var flips = GetFlips(cell.Position, color);
            if (flips != null && flips.Count > 0)
            {
                validMoves.Add(new Move
                {
                    Target = cell.Position,
                    Color = color,
                    Flipped = flips
                });
            }
        }

        return validMoves;
    }

    private List<Position>? GetFlips(Position position, PieceColor color)
    {
        var targetCell = GetCell(position);
        if (targetCell == null || targetCell.Piece != null)
        {
            return null;
        }

        PieceColor opponentColor = (color == PieceColor.Black) ? PieceColor.White : PieceColor.Black;
        List<Position> totalFlips = new List<Position>();

        foreach (var dir in _directions)
        {
            List<Position> potentialFlips = new List<Position>();
            int currRow = position.Row + dir.DRow;
            int currCol = position.Col + dir.DCol;

            while (true)
            {
                var nextPos = new Position { Row = currRow, Col = currCol };
                var cell = GetCell(nextPos);

                if (cell == null || cell.Piece == null)
                {
                    break;
                }

                if (cell.Piece.Color == opponentColor)
                {
                    potentialFlips.Add(nextPos);
                    currRow += dir.DRow;
                    currCol += dir.DCol;
                    continue;
                }

                if (cell.Piece.Color == color)
                {
                    if (potentialFlips.Count > 0)
                    {
                        totalFlips.AddRange(potentialFlips);
                    }

                    break;
                }
            }
        }

        return totalFlips.Count > 0 ? totalFlips : null;
    }

    private ICell? GetCell(Position position)
    {
        try
        {
            return Board.Cells[position.Row, position.Col];
        }
        catch (IndexOutOfRangeException)
        {
            return null;
        }
    }

    private IPiece GetPiece(PieceColor color) => color == PieceColor.Black ? _blackPiece : _whitePiece;

    private bool HasValidMove(PieceColor color)
    {
        foreach (var cell in Board.Cells)
        {
            if (cell.Piece == null && GetFlips(cell.Position, color) != null)
            {
                return true;
            }
        }
        return false;
    }

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

    private bool IsInside(Position position)
    {
        return position.Col >= 0 && position.Col <= 7 && position.Row >= 0 && position.Row <= 7;
    }
}
