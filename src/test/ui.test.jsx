// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
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
