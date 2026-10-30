// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import App from "../App.jsx";
import ConnectFour from "../components/ConnectFour.jsx";
import AgentMonitoringPanel from "../components/AgentMonitoringPanel.jsx";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

function getTttCells() {
  return screen.getByRole("grid", { name: "Tic-Tac-Toe board" }).querySelectorAll('[role="gridcell"]');
}

describe("React game UI", () => {
  it("undoes the winning human move and rolls back its scoreboard increment", () => {
    vi.spyOn(Math, "random")
      .mockReturnValueOnce(0.25)
      .mockReturnValueOnce(0.2);
    render(<App />);

    fireEvent.change(screen.getByRole("combobox", { name: "DIFFICULTY" }), {
      target: { value: "easy" },
    });
    fireEvent.change(screen.getByRole("combobox", { name: "Select AI agent strategy" }), {
      target: { value: "random" },
    });

    fireEvent.click(screen.getByRole("gridcell", { name: "Cell 1: empty" }));
    fireEvent.click(screen.getByRole("gridcell", { name: "Cell 2: empty" }));
    fireEvent.click(screen.getByRole("gridcell", { name: "Cell 3: empty" }));

    expect(screen.getByText("X wins the game")).toBeTruthy();
    expect(document.querySelector(".scoreboard .score-x + strong")?.textContent).toBe("1");

    fireEvent.click(screen.getByRole("button", { name: "Undo" }));

    expect(document.querySelector(".scoreboard .score-x + strong")?.textContent).toBe("0");
    expect([...getTttCells()].map((cell) => cell.textContent)).toEqual([
      "X", "X", "", "O", "O", "", "", "", "",
    ]);
    expect(screen.getByText("Your move")).toBeTruthy();
  });

  it("reset clears Tic-Tac-Toe board and move history", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    render(<App />);

    fireEvent.change(screen.getByRole("combobox", { name: "DIFFICULTY" }), {
      target: { value: "easy" },
    });
    fireEvent.click(screen.getByRole("gridcell", { name: "Cell 1: empty" }));
    expect([...getTttCells()].filter((cell) => cell.textContent).length).toBe(2);

    fireEvent.click(screen.getByRole("button", { name: "Reset board" }));

    expect([...getTttCells()].every((cell) => cell.textContent === "")).toBe(true);
    expect(screen.getByText("Your moves will appear here as the game progresses.")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Undo" }).disabled).toBe(true);
  });

  it("uses the explicitly selected agent for a real Tic-Tac-Toe move", () => {
    render(<App />);
    fireEvent.change(screen.getByRole("combobox", { name: "Select AI agent strategy" }), {
      target: { value: "minimax" },
    });

    fireEvent.click(screen.getByRole("gridcell", { name: "Cell 1: empty" }));

    expect(screen.getByText("Minimax Agent")).toBeTruthy();
    expect(screen.getByText("MINIMAX")).toBeTruthy();
    expect(screen.getByText("NODES VISITED").parentElement.textContent).not.toContain("N/A");
  });

  it("alternates Tic-Tac-Toe AI turns and starting player while keeping human mode X-first", () => {
    render(<App />);
    fireEvent.change(screen.getByRole("combobox", { name: "GAME MODE" }), {
      target: { value: "ai" },
    });

    expect(screen.getByText("X is thinking")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Advance AI move →" }));
    expect(screen.getByText("O is thinking")).toBeTruthy();
    expect([...getTttCells()].filter((cell) => cell.textContent === "X")).toHaveLength(1);

    fireEvent.click(screen.getByRole("button", { name: "Reset board" }));
    expect(screen.getByText("O is thinking")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Advance AI move →" }));
    expect(screen.getByText("X is thinking")).toBeTruthy();
    expect([...getTttCells()].filter((cell) => cell.textContent === "O")).toHaveLength(1);

    fireEvent.change(screen.getByRole("combobox", { name: "GAME MODE" }), {
      target: { value: "human" },
    });
    expect(screen.getByText("Your move")).toBeTruthy();

    fireEvent.change(screen.getByRole("combobox", { name: "GAME MODE" }), {
      target: { value: "ai" },
    });
    fireEvent.change(screen.getByRole("combobox", { name: "AI first player policy" }), {
      target: { value: "O" },
    });
    expect(screen.getByText("O is thinking")).toBeTruthy();
  });

  it("records completed Tic-Tac-Toe AI matches from actual games and resets statistics on request", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.37);
    render(<App />);
    fireEvent.change(screen.getByRole("combobox", { name: "GAME MODE" }), {
      target: { value: "ai" },
    });
    fireEvent.change(screen.getByRole("combobox", { name: "X AI strategy" }), {
      target: { value: "random" },
    });
    fireEvent.change(screen.getByRole("combobox", { name: "O AI strategy" }), {
      target: { value: "random" },
    });

    for (let move = 0; move < 9; move++) {
      fireEvent.click(screen.getByRole("button", { name: "Advance AI move →" }));
    }

    const stats = screen.getByRole("region", { name: "AI vs AI match statistics" });
    expect(within(stats).getByText("Games played").nextElementSibling.textContent).toBe("1");
    const visibleBoard = [...getTttCells()].map((cell) => cell.textContent);
    fireEvent.click(screen.getByRole("button", { name: "Advance AI move →" }));
    expect([...getTttCells()].map((cell) => cell.textContent)).toEqual(visibleBoard);

    fireEvent.click(within(stats).getByRole("button", { name: "Reset statistics" }));
    expect(within(stats).getByText("Games played").nextElementSibling.textContent).toBe("0");
  });

  it("does not display analysis from a board that changed before the scheduled search", async () => {
    vi.useFakeTimers();
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: /^Analyze position$/ }));
    fireEvent.click(screen.getByRole("gridcell", { name: "Cell 1: empty" }));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(20);
    });

    expect(screen.queryByText(/Predicted optimal line/)).toBeNull();
    expect(screen.queryByText("Search tree candidate branches (Player O)")).toBeNull();
  });

  it("invalidates Connect Four analysis when the board is reset", async () => {
    vi.useFakeTimers();
    render(<ConnectFour />);

    fireEvent.click(screen.getByRole("button", { name: /Analyze position/ }));
    fireEvent.click(screen.getByRole("button", { name: "Reset board" }));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(20);
    });

    expect(screen.queryByText(/Predicted optimal line/)).toBeNull();
    expect(screen.getByText("Undo is not available in Connect Four. Use Reset board to start over.")).toBeTruthy();
    expect(screen.getAllByRole("gridcell")).toHaveLength(42);
    expect(screen.getByRole("grid").querySelectorAll(".piece-R, .piece-Y")).toHaveLength(0);
  });

  it("alternates Connect Four AI turns and starting player", async () => {
    vi.useFakeTimers();
    render(<ConnectFour />);
    fireEvent.change(screen.getByRole("combobox", { name: "GAME MODE" }), {
      target: { value: "ai" },
    });
    fireEvent.change(screen.getByRole("combobox", { name: "Red AI strategy" }), {
      target: { value: "random" },
    });
    fireEvent.change(screen.getByRole("combobox", { name: "Yellow AI strategy" }), {
      target: { value: "random" },
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(500);
    });
    expect(screen.getByText("Yellow AI to move")).toBeTruthy();
    expect(screen.getByRole("grid").querySelectorAll(".piece-R")).toHaveLength(1);

    fireEvent.click(screen.getByRole("button", { name: "Reset board" }));
    expect(screen.getByText("Yellow AI to move")).toBeTruthy();
    expect(screen.getByRole("grid").querySelectorAll(".piece-R, .piece-Y")).toHaveLength(0);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(500);
    });
    expect(screen.getByText("Red AI to move")).toBeTruthy();
    expect(screen.getByRole("grid").querySelectorAll(".piece-Y")).toHaveLength(1);
  });

  it("records Connect Four match totals and game length from completed AI play", async () => {
    vi.useFakeTimers();
    vi.spyOn(Math, "random").mockReturnValue(0);
    render(<ConnectFour />);
    fireEvent.change(screen.getByRole("combobox", { name: "GAME MODE" }), {
      target: { value: "ai" },
    });
    fireEvent.change(screen.getByRole("combobox", { name: "Red AI strategy" }), {
      target: { value: "random" },
    });
    fireEvent.change(screen.getByRole("combobox", { name: "Yellow AI strategy" }), {
      target: { value: "random" },
    });

    for (let move = 0; move < 20 && !screen.queryByText("Red wins!"); move++) {
      await act(async () => {
        await vi.advanceTimersByTimeAsync(500);
      });
    }

    expect(screen.getByText("Red wins!")).toBeTruthy();
    const stats = screen.getByRole("region", { name: "AI vs AI match statistics" });
    expect(within(stats).getByText("Games played").nextElementSibling.textContent).toBe("1");
    expect(within(stats).getByText("Red wins").nextElementSibling.textContent).toBe("1 (100.0%)");
    expect(within(stats).getByText("Average game length").nextElementSibling.textContent).toBe("19.0 moves");
    expect(within(stats).getByText("Started by Red / Yellow").nextElementSibling.textContent).toBe("1 / 0");

    const pieceCount = screen.getByRole("grid").querySelectorAll(".piece-R, .piece-Y").length;
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });
    expect(screen.getByRole("grid").querySelectorAll(".piece-R, .piece-Y")).toHaveLength(pieceCount);
  });

  it("shows the coordinator's actual status instead of a static active badge", () => {
    const masterAgent = { status: "ready" };
    const props = {
      game: "tic-tac-toe",
      masterAgent,
      lastDecision: null,
      currentBoard: null,
    };
    const { rerender } = render(<AgentMonitoringPanel {...props} />);

    expect(screen.getByRole("status", { name: "Master Agent READY" })).toBeTruthy();

    masterAgent.status = "error";
    rerender(<AgentMonitoringPanel {...props} />);

    expect(screen.getByRole("status", { name: "Master Agent ERROR" })).toBeTruthy();
  });
});
