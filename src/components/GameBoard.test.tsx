// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { makeSession, makeSnapshot } from '../test/fixtures';
import { GameBoard } from './GameBoard';

describe('GameBoard', () => {
  it('renders 81 accessible cells and lets candidate preview hide saved notes', () => {
    const snapshot = makeSnapshot();
    snapshot.values[0]![0] = 5;
    snapshot.givens[0]![0] = 5;
    snapshot.values[0]![1] = 3;
    snapshot.invalid[0]![1] = true;
    snapshot.notes[0]![2] = [3, 7];
    snapshot.candidates[0]![2] = [1, 4, 8];
    snapshot.candidates[0]![3] = [1, 4, 8];
    snapshot.notes[0]![4] = [2, 6];
    snapshot.candidates[0]![4] = [1, 2, 6, 9];
    const setSelected = vi.fn();

    const { rerender } = render(
      <GameBoard
        session={makeSession({ snapshot })}
        paused={false}
        selected={[0, 1]}
        setSelected={setSelected}
        firstFocusableCell={[0, 2]}
        selectedValue={3}
        cellClass={(row, column) => `cell-${row}-${column}`}
        automaticCandidates
      />,
    );

    expect(screen.getAllByRole('gridcell')).toHaveLength(81);
    expect(screen.getByLabelText('Row 1, column 1, given 5')).toBeTruthy();
    const invalid = screen.getByLabelText('Row 1, column 2, 3, invalid');
    expect(invalid.getAttribute('aria-invalid')).toBe('true');
    expect(invalid.tabIndex).toBe(0);
    expect(
      screen.getByLabelText(
        'Row 1, column 3, empty, automatic candidates 1, 4, 8',
      ),
    ).toBeTruthy();
    expect(
      screen.getByLabelText(
        'Row 1, column 4, empty, automatic candidates 1, 4, 8',
      ),
    ).toHaveClass('cell-0-3');
    expect(
      screen.getByLabelText(
        'Row 1, column 5, empty, automatic candidates 1, 2, 6, 9',
      ),
    ).toHaveTextContent('1269');

    rerender(
      <GameBoard
        session={makeSession({ snapshot })}
        paused={false}
        selected={[0, 1]}
        setSelected={setSelected}
        firstFocusableCell={[0, 2]}
        selectedValue={3}
        cellClass={(row, column) => `cell-${row}-${column}`}
        automaticCandidates={false}
      />,
    );
    expect(
      screen.getByLabelText('Row 1, column 3, empty, notes 3, 7'),
    ).toBeTruthy();
    expect(document.querySelector('.cell-note--matching')).toHaveTextContent(
      '3',
    );
    fireEvent.click(
      screen.getByLabelText('Row 1, column 3, empty, notes 3, 7'),
    );
    expect(setSelected).toHaveBeenCalledWith([0, 2]);
  });

  it('commits desktop pointer selection before the click completes', () => {
    const setSelected = vi.fn();
    render(
      <GameBoard
        session={makeSession({ snapshot: makeSnapshot() })}
        paused={false}
        selected={[0, 0]}
        setSelected={setSelected}
        firstFocusableCell={[0, 0]}
        selectedValue={0}
        cellClass={() => 'game-cell'}
        automaticCandidates={false}
      />,
    );

    const nextCell = screen.getByLabelText('Row 1, column 2, empty');
    fireEvent.pointerDown(nextCell, { pointerType: 'mouse' });
    expect(setSelected).toHaveBeenCalledWith([0, 1]);

    setSelected.mockClear();
    fireEvent.pointerDown(nextCell, { pointerType: 'touch' });
    expect(setSelected).not.toHaveBeenCalled();
    fireEvent.click(nextCell);
    expect(setSelected).toHaveBeenCalledWith([0, 1]);
  });

  it('gives the first open cell the roving tab stop and conceals a paused board', () => {
    render(
      <GameBoard
        session={makeSession({ snapshot: makeSnapshot() })}
        paused
        setSelected={vi.fn()}
        firstFocusableCell={[2, 4]}
        selectedValue={0}
        cellClass={() => 'game-cell'}
        automaticCandidates={false}
      />,
    );
    expect(screen.getByLabelText('Row 3, column 5, empty').tabIndex).toBe(0);
    expect(screen.getByRole('status')).toHaveTextContent(
      'Puzzle pausedYour time is stopped.',
    );
    expect(document.querySelector('.board-stage--paused')).toBeTruthy();
  });
});
