"use client";

import { useState, useEffect, useCallback } from "react";

type Player = "X" | "O";
type CellValue = Player | null;
type GameStatus = "playing" | "won" | "draw";

interface Stats {
  xWins: number;
  oWins: number;
  draws: number;
  total: number;
}

interface HistoryItem {
  id: number;
  winner: string;
  createdAt: string;
}

const WINNING_LINES = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

function calculateWinner(board: CellValue[]): {
  winner: Player | null;
  line: number[] | null;
} {
  for (const line of WINNING_LINES) {
    const [a, b, c] = line;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { winner: board[a] as Player, line };
    }
  }
  return { winner: null, line: null };
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function Home() {
  const [board, setBoard] = useState<CellValue[]>(Array(9).fill(null));
  const [currentPlayer, setCurrentPlayer] = useState<Player>("X");
  const [gameStatus, setGameStatus] = useState<GameStatus>("playing");
  const [winnerInfo, setWinnerInfo] = useState<{
    winner: Player | null;
    line: number[] | null;
  }>({ winner: null, line: null });
  const [stats, setStats] = useState<Stats>({
    xWins: 0,
    oWins: 0,
    draws: 0,
    total: 0,
  });
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [savedGame, setSavedGame] = useState(false);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch("/api/games");
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats);
        setHistory(data.history);
      }
    } catch (err) {
      console.error("Failed to fetch stats:", err);
    } finally {
      setLoadingStats(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const saveGameResult = useCallback(
    async (winner: string) => {
      try {
        const res = await fetch("/api/games", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ winner }),
        });
        if (res.ok) {
          await fetchStats();
        }
      } catch (err) {
        console.error("Failed to save game result:", err);
      }
    },
    [fetchStats]
  );

  const handleCellClick = useCallback(
    (index: number) => {
      if (board[index] || gameStatus !== "playing") return;

      const newBoard = [...board];
      newBoard[index] = currentPlayer;

      const { winner, line } = calculateWinner(newBoard);

      if (winner) {
        setBoard(newBoard);
        setWinnerInfo({ winner, line });
        setGameStatus("won");
        if (!savedGame) {
          setSavedGame(true);
          saveGameResult(winner);
        }
      } else if (newBoard.every((cell) => cell !== null)) {
        setBoard(newBoard);
        setGameStatus("draw");
        if (!savedGame) {
          setSavedGame(true);
          saveGameResult("Draw");
        }
      } else {
        setBoard(newBoard);
        setCurrentPlayer(currentPlayer === "X" ? "O" : "X");
      }
    },
    [board, currentPlayer, gameStatus, savedGame, saveGameResult]
  );

  const handleRestart = useCallback(() => {
    setBoard(Array(9).fill(null));
    setCurrentPlayer("X");
    setGameStatus("playing");
    setWinnerInfo({ winner: null, line: null });
    setSavedGame(false);
  }, []);

  const getStatusContent = () => {
    if (gameStatus === "won" && winnerInfo.winner) {
      return (
        <div className="turn-indicator">
          <span
            className={`turn-badge ${winnerInfo.winner.toLowerCase()}`}
          >
            {winnerInfo.winner}
          </span>
          <span className={`status-text winner-${winnerInfo.winner.toLowerCase()}`}>
            Player {winnerInfo.winner} wins! 🎉
          </span>
        </div>
      );
    }
    if (gameStatus === "draw") {
      return (
        <span className="status-text draw">It&apos;s a draw! 🤝</span>
      );
    }
    return (
      <div className="turn-indicator">
        <span className={`turn-badge ${currentPlayer.toLowerCase()}`}>
          {currentPlayer}
        </span>
        <span className="status-text">
          Player {currentPlayer}&apos;s turn
        </span>
      </div>
    );
  };

  return (
    <div className="container">
      <header className="header">
        <h1>Tic Tac Toe</h1>
        <p>Classic two-player strategy game</p>
      </header>

      <div className="game-layout">
        <div className="game-section">
          <div className="status-card">{getStatusContent()}</div>

          <div className="board">
            {board.map((cell, index) => {
              const isWinningCell =
                winnerInfo.line?.includes(index) ?? false;
              const cellClass = [
                "cell",
                cell ? cell.toLowerCase() : "",
                cell ? "filled" : "",
                isWinningCell ? "winning" : "",
                gameStatus !== "playing" && !cell ? "game-over" : "",
              ]
                .filter(Boolean)
                .join(" ");

              return (
                <button
                  key={index}
                  className={cellClass}
                  onClick={() => handleCellClick(index)}
                  aria-label={`Cell ${index + 1}${
                    cell ? `, ${cell}` : ""
                  }`}
                >
                  {cell}
                </button>
              );
            })}
          </div>

          <button className="restart-btn" onClick={handleRestart}>
            ↺ Restart Game
          </button>
        </div>

        <div className="sidebar">
          <div className="card">
            <h2>Scoreboard</h2>
            {loadingStats ? (
              <div className="loading">Loading...</div>
            ) : (
              <div className="scoreboard">
                <div className="score-item">
                  <div className="score-label">
                    <span className="score-dot x"></span>
                    Player X Wins
                  </div>
                  <span className="score-value x">{stats.xWins}</span>
                </div>
                <div className="score-item">
                  <div className="score-label">
                    <span className="score-dot o"></span>
                    Player O Wins
                  </div>
                  <span className="score-value o">{stats.oWins}</span>
                </div>
                <div className="score-item">
                  <div className="score-label">
                    <span className="score-dot draw"></span>
                    Draws
                  </div>
                  <span className="score-value draw">{stats.draws}</span>
                </div>
              </div>
            )}
          </div>

          <div className="card">
            <h2>Recent Games</h2>
            {loadingStats ? (
              <div className="loading">Loading...</div>
            ) : history.length === 0 ? (
              <div className="empty-history">No games played yet</div>
            ) : (
              <div className="history-list">
                {history.map((item) => (
                  <div key={item.id} className="history-item">
                    <span
                      className={`history-winner ${
                        item.winner === "Draw"
                          ? "draw"
                          : item.winner.toLowerCase()
                      }`}
                    >
                      {item.winner === "Draw"
                        ? "Draw"
                        : `Player ${item.winner} Won`}
                    </span>
                    <span className="history-date">
                      {formatDate(item.createdAt)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
