using System;
using System.Collections.Generic;
using System.Linq;
using Othello.Domain;
using Othello.Domain.Interfaces;
using Spectre.Console;

namespace Othello.ConsoleApp;

class Program
{
    static void Main(string[] args)
    {
        Console.OutputEncoding = System.Text.Encoding.UTF8;

        SafeClear();
        AnsiConsole.Write(
            new FigletText("OTHELLO")
                .Centered()
                .Color(Color.Cyan1));

        AnsiConsole.Write(new Rule("[yellow]Classic Strategy Board Game[/]") { Style = Style.Parse("grey") });
        AnsiConsole.WriteLine();

        var player1 = new HumanPlayer { Name = "Player 1" };
        var player2 = new GreedyAIPlayer();
        Board board = new Board();
        Piece blackPiece = new Piece
        {
            Color = PieceColor.Black
        };

        Piece whitePiece = new Piece
        {
            Color = PieceColor.White
        };
        GameManager game = new GameManager(player1, player2, board, blackPiece, whitePiece);

        var eventLogs = new List<string>();

        void LogEvent(string markup)
        {
            eventLogs.Add(markup);
            if (eventLogs.Count > 6)
            {
                eventLogs.RemoveAt(0);
            }
        }

        // Hook up domain events
        game.GameStarted += () =>
        {
            var blackPlayer = game.GetPlayer(PieceColor.Black);
            var whitePlayer = game.GetPlayer(PieceColor.White);
            LogEvent(
                $"[green]Game started![/] Black: [cyan]{blackPlayer.Name}[/], White: [white]{whitePlayer.Name}[/]");
        };

        game.MovePlayed += move =>
        {
            var colorMarkup = move.Color == PieceColor.Black ? "[cyan]Black[/]" : "[white]White[/]";
            LogEvent(
                $"{colorMarkup} played at [yellow]({move.Target.Row}, {move.Target.Col})[/], flipped [green]{move.Flipped.Count}[/] piece(s).");
        };

        game.TurnSkipped += color =>
        {
            var colorMarkup = color == PieceColor.Black ? "[cyan]Black[/]" : "[white]White[/]";
            LogEvent($"[bold yellow]! {colorMarkup} has no valid moves. Turn skipped![/]");
        };

        game.TurnChanged += nextTurn =>
        {
            var colorMarkup = nextTurn == PieceColor.Black ? "[cyan]Black[/]" : "[white]White[/]";
            LogEvent($"Turn passed to {colorMarkup}.");
        };

        game.ScoreChanged += score =>
        {
            LogEvent($"Score update: [cyan]B: {score.Black}[/] | [white]W: {score.White}[/]");
        };

        game.GameOver += result => { LogEvent($"[bold green]GAME OVER![/] Winner: [yellow]{result}[/]"); };

        // Start game
        var startResult = game.Start();
        if (!startResult.IsSuccess)
        {
            AnsiConsole.MarkupLine($"[red]Failed to start game: {startResult.Failure}[/]");
            return;
        }

        // Game Loop
        while (!game.IsGameOver())
        {
            RenderGameState(game, eventLogs);

            var validMoves = game.GetValidMoves() ?? new List<Position>();
            if (validMoves.Count == 0)
            {
                AnsiConsole.MarkupLine(
                    "[yellow]No valid moves available for current player. Press Enter to proceed...[/]");
                Console.ReadLine();
                continue;
            }

            var input = ReadInput(
                "[green]Enter move[/] as [yellow]<row> <col>[/] (e.g. [yellow]2 3[/]) or [red]'quit'[/]:");

            if (string.Equals(input, "quit", StringComparison.OrdinalIgnoreCase) ||
                string.Equals(input, "exit", StringComparison.OrdinalIgnoreCase))
            {
                AnsiConsole.MarkupLine("[yellow]Game aborted by user.[/]");
                break;
            }

            var parts = input.Split(new[] { ' ', ',', ';' }, StringSplitOptions.RemoveEmptyEntries);
            if (parts.Length != 2 || !int.TryParse(parts[0], out int row) || !int.TryParse(parts[1], out int col))
            {
                LogEvent("[red]Invalid input format! Use '<row> <col>' (e.g. '2 3')[/]");
                continue;
            }

            var targetPos = new Position { Row = row, Col = col };
            var moveResult = game.TryPlayMove(targetPos);

            if (!moveResult.IsSuccess)
            {
                LogEvent($"[red]Invalid move ({row}, {col}): {moveResult.Failure}[/]");
            }
        }

        // Final Game State
        SafeClear();
        AnsiConsole.Write(new Rule("[bold green]Final Result[/]") { Style = Style.Parse("green") });
        RenderGameState(game, eventLogs);

        var finalScore = game.GetScore();
        var winnerText = game.Result switch
        {
            GameResult.BlackWins => "[bold cyan]Black Wins![/]",
            GameResult.WhiteWins => "[bold white]White Wins![/]",
            GameResult.Draw => "[bold yellow]It's a Draw![/]",
            _ => "[grey]Game ended.[/]"
        };

        AnsiConsole.Write(new Panel(
                new Markup(
                    $"[bold]Final Score:[/] [cyan]Black: {finalScore.Black}[/] | [white]White: {finalScore.White}[/]\n\nResult: {winnerText}"))
            .Header("[bold yellow]Game Summary[/]")
            .Border(BoxBorder.Double)
            .BorderColor(Color.Yellow)
            .Padding(2, 1));

        AnsiConsole.MarkupLine("\n[grey]Thank you for playing Othello![/]\n");
    }

    static void RenderGameState(GameManager game, List<string> eventLogs)
    {
        var currentTurn = game.CurrentTurn;
        var currentPlayer = game.GetPlayer(currentTurn);
        var score = game.GetScore();
        var validMoves = game.GetValidMoves() ?? new List<Position>();

        // Board Table
        var boardTable = CreateBoardTable(game.Board, validMoves);

        // Status Panel
        var statusTable = new Table().Border(TableBorder.None).HideHeaders();
        statusTable.AddColumn("Label");
        statusTable.AddColumn("Value");

        var turnColor = currentTurn == PieceColor.Black ? "cyan" : "white";
        statusTable.AddRow("[bold]Current Turn:[/]", $"[{turnColor}]{currentTurn} ({currentPlayer.Name})[/]");
        statusTable.AddRow("[bold]Black (B):[/]", $"[cyan]{score.Black}[/]");
        statusTable.AddRow("[bold]White (W):[/]", $"[white]{score.White}[/]");

        var movesText = validMoves.Count > 0
            ? string.Join(", ", validMoves.Select(p => $"({p.Row},{p.Col})"))
            : "[grey]None[/]";
        statusTable.AddRow("[bold]Valid Moves:[/]", $"[green]{movesText}[/]");

        var infoPanel = new Panel(statusTable)
            .Header("[bold yellow]Match Info[/]")
            .Border(BoxBorder.Rounded)
            .BorderColor(Color.Blue);

        // Logs Panel
        var logRows = eventLogs.Count > 0
            ? string.Join("\n", eventLogs)
            : "[grey]No events yet.[/]";
        var logPanel = new Panel(new Markup(logRows))
            .Header("[bold yellow]Event Log[/]")
            .Border(BoxBorder.Rounded)
            .BorderColor(Color.Grey);

        // Combine into layout
        var rightSide = new Rows(infoPanel, logPanel);
        var layoutGrid = new Grid();
        layoutGrid.AddColumn();
        layoutGrid.AddColumn();
        layoutGrid.AddRow(boardTable, rightSide);

        AnsiConsole.Write(layoutGrid);
        AnsiConsole.WriteLine();
    }

    static Table CreateBoardTable(IBoard board, IReadOnlyList<Position>? validMoves)
    {
        var validSet = validMoves != null
            ? new HashSet<(int, int)>(validMoves.Select(p => (p.Row, p.Col)))
            : new HashSet<(int, int)>();

        var table = new Table()
            .Border(TableBorder.Rounded)
            .BorderColor(Color.Grey);

        table.AddColumn(new TableColumn("[grey]Row[/]").Centered());
        for (int c = 0; c < 8; c++)
        {
            table.AddColumn(new TableColumn($"[yellow]{c}[/]").Centered());
        }

        for (int r = 0; r < 8; r++)
        {
            var rowCells = new List<string> { $"[yellow]{r}[/]" };

            for (int c = 0; c < 8; c++)
            {
                var piece = board.Cells[r, c].Piece;
                if (piece != null)
                {
                    if (piece.Color == PieceColor.Black)
                    {
                        rowCells.Add("[bold cyan]B[/]");
                    }
                    else
                    {
                        rowCells.Add("[bold white]W[/]");
                    }
                }
                else if (validSet.Contains((r, c)))
                {
                    rowCells.Add("[bold green]*[/]");
                }
                else
                {
                    rowCells.Add("[grey]·[/]");
                }
            }

            table.AddRow(rowCells.ToArray());
        }

        table.Caption(new TableTitle("[grey]* = Valid Move | B = Black | W = White[/]"));
        return table;
    }

    static void SafeClear()
    {
        try
        {
            if (!Console.IsOutputRedirected && !Console.IsInputRedirected)
            {
                AnsiConsole.Clear();
            }
        }
        catch
        {
            // Silently ignore if running in redirected/piped environment
        }
    }

    static string ReadInput(string promptMarkup)
    {
        AnsiConsole.Markup(promptMarkup + " ");
        return Console.ReadLine()?.Trim() ?? "quit";
    }
}