import type { Digit, Session } from '../api/types';

interface GameBoardProps {
  session: Session;
  paused: boolean;
  selected?: [number, number];
  setSelected: (cell: [number, number]) => void;
  firstFocusableCell?: [number, number];
  selectedValue: number;
  cellClass: (row: number, column: number) => string;
  automaticCandidates: boolean;
  pendingCells?: Set<string>;
}

export const GameBoard = ({
  session,
  paused,
  selected,
  setSelected,
  firstFocusableCell,
  selectedValue,
  cellClass,
  automaticCandidates,
  pendingCells = new Set(),
}: GameBoardProps) => (
  <div className={`board-stage${paused ? ' board-stage--paused' : ''}`}>
    <div className="game-board" role="grid" aria-label="Sudoku game board">
      {session.snapshot.values.flatMap((rowValues, row) =>
        rowValues.map((value, column) => {
          const notes = session.snapshot.notes[row]?.[column] ?? [];
          const candidates = session.snapshot.candidates[row]?.[column] ?? [];
          const showAutomaticCandidates = automaticCandidates;
          const displayedNotes = showAutomaticCandidates ? candidates : notes;
          const given = session.snapshot.givens[row]?.[column] !== 0;
          const invalid = session.snapshot.invalid[row]?.[column] === true;
          const pending = pendingCells.has(`${row}-${column}`);
          const isSelected = selected?.[0] === row && selected?.[1] === column;
          const isFocusable = isSelected
            ? true
            : !selected &&
              firstFocusableCell?.[0] === row &&
              firstFocusableCell?.[1] === column;
          const cellContent = value
            ? `${given ? 'given ' : ''}${value}`
            : showAutomaticCandidates && displayedNotes.length > 0
              ? `empty, automatic candidates ${displayedNotes.join(', ')}`
              : notes.length > 0
                ? `empty, notes ${notes.join(', ')}`
                : 'empty';
          return (
            <button
              key={`${row}-${column}`}
              className={cellClass(row, column)}
              data-cell={`${row}-${column}`}
              type="button"
              role="gridcell"
              aria-invalid={invalid || undefined}
              aria-busy={pending || undefined}
              aria-selected={isSelected}
              aria-label={`Row ${row + 1}, column ${column + 1}, ${cellContent}${pending ? ', checking' : ''}${invalid ? ', invalid' : ''}`}
              tabIndex={isFocusable ? 0 : -1}
              onPointerDown={(event) => {
                if (event.pointerType !== 'touch') setSelected([row, column]);
              }}
              onFocus={() => setSelected([row, column])}
              onClick={() => setSelected([row, column])}
            >
              {value ? (
                <span className="cell-value">{value}</span>
              ) : (
                <span
                  className={`cell-notes${showAutomaticCandidates ? ' cell-notes--automatic' : ''}`}
                  aria-hidden="true"
                >
                  {Array.from({ length: 9 }, (_, index) => {
                    const digit = (index + 1) as Digit;
                    const isMatchingNote =
                      selectedValue !== 0 &&
                      digit === selectedValue &&
                      displayedNotes.includes(digit);
                    return (
                      <span
                        key={index}
                        className={
                          isMatchingNote ? 'cell-note--matching' : undefined
                        }
                      >
                        {displayedNotes.includes(digit) ? digit : ''}
                      </span>
                    );
                  })}
                </span>
              )}
            </button>
          );
        }),
      )}
    </div>
    {paused && (
      <div className="pause-cover" role="status">
        <strong>Puzzle paused</strong>
        <span>Your time is stopped.</span>
      </div>
    )}
  </div>
);
