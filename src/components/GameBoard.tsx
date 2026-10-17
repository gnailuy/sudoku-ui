import type {
  Digit,
  HintLink,
  HintMark,
  HintNode,
  HintRole,
  HintTarget,
  GameState,
} from '../api/types';

interface GameBoardProps {
  session: GameState;
  paused: boolean;
  readOnly?: boolean;
  selected?: [number, number];
  setSelected: (cell: [number, number]) => void;
  firstFocusableCell?: [number, number];
  selectedValue: number;
  cellClass: (row: number, column: number) => string;
  showCandidates: boolean;
  visibleCandidateCells?: Set<string>;
  pendingCells?: Set<string>;
  hintMarks?: HintMark[];
  hintNodes?: HintNode[];
  hintLinks?: HintLink[];
}

const targetIncludesCell = (
  target: HintTarget,
  row: number,
  column: number,
) => {
  const oneBasedRow = row + 1;
  const oneBasedColumn = column + 1;
  if (target.kind === 'cell' || target.kind === 'candidate')
    return target.row === oneBasedRow && target.column === oneBasedColumn;
  if (target.kind === 'row') return target.index === oneBasedRow;
  if (target.kind === 'column') return target.index === oneBasedColumn;
  if (target.kind === 'box')
    return (
      target.index === Math.floor(row / 3) * 3 + Math.floor(column / 3) + 1
    );
  return false;
};

const candidatePoint = (target: HintTarget) => {
  const value = target.value ?? 5;
  return {
    x: (target.column ?? 1) - 1 + (((value - 1) % 3) + 0.5) / 3,
    y: (target.row ?? 1) - 1 + (Math.floor((value - 1) / 3) + 0.5) / 3,
  };
};

const nodeLabelPoint = (target: HintTarget) => {
  const point = candidatePoint(target);
  const topEdge = point.y < 0.4;
  const localX = point.x - Math.floor(point.x);
  const x = topEdge ? point.x + (localX > 0.65 ? -0.3 : 0.3) : point.x;
  const y = topEdge ? point.y + 0.38 : point.y - 0.38;
  return {
    x: Math.min(8.85, Math.max(0.15, x)),
    y: Math.min(8.82, Math.max(0.18, y)),
  };
};

const HintScene = ({
  nodes,
  links,
}: {
  nodes: HintNode[];
  links: HintLink[];
}) => {
  if (nodes.length === 0) return null;
  const byId = new Map(nodes.map((node) => [node.id, node]));
  return (
    <svg className="hint-scene" viewBox="0 0 9 9" aria-hidden="true">
      <defs>
        <marker
          id="hint-arrow"
          markerUnits="userSpaceOnUse"
          markerWidth="0.24"
          markerHeight="0.24"
          viewBox="0 0 5 5"
          refX="4"
          refY="2.5"
          orient="auto"
        >
          <path d="M0,0 L5,2.5 L0,5 z" />
        </marker>
      </defs>
      {links.map((link, index) => {
        const from = byId.get(link.from);
        const to = byId.get(link.to);
        if (!from || !to) return null;
        const a = candidatePoint(from.target);
        const b = candidatePoint(to.target);
        return (
          <line
            key={`${link.from}-${link.to}-${index}`}
            className={`hint-link hint-link--${link.kind}`}
            x1={a.x}
            y1={a.y}
            x2={b.x}
            y2={b.y}
          />
        );
      })}
      {nodes.map((node) => {
        const labelPoint = nodeLabelPoint(node.target);
        const label = node.order ? String(node.order) : node.group;
        if (!label) return null;
        return (
          <g key={node.id} className="hint-node">
            <text x={labelPoint.x} y={labelPoint.y}>
              {label}
            </text>
          </g>
        );
      })}
    </svg>
  );
};

const roleLabel: Record<HintRole, string> = {
  focus: 'hint focus',
  premise: 'hint evidence',
  eliminated: 'candidate eliminated',
  conclusion: 'hint conclusion',
  problem: 'needs correction',
  extra: 'impossible candidate',
};

export const GameBoard = ({
  session,
  paused,
  readOnly = false,
  selected,
  setSelected,
  firstFocusableCell,
  selectedValue,
  cellClass,
  showCandidates,
  visibleCandidateCells = new Set(),
  pendingCells = new Set(),
  hintMarks = [],
  hintNodes = [],
  hintLinks = [],
}: GameBoardProps) => (
  <div className={`board-stage${paused ? ' board-stage--paused' : ''}`}>
    <div
      className="game-board"
      role="grid"
      aria-label="Sudoku game board"
      aria-readonly={readOnly || undefined}
    >
      {session.snapshot.values.flatMap((rowValues, row) =>
        rowValues.map((value, column) => {
          const candidates = session.snapshot.candidates[row]?.[column] ?? [];
          const cellCandidatesVisible =
            showCandidates || visibleCandidateCells.has(`${row}-${column}`);
          const given = session.snapshot.givens[row]?.[column] !== 0;
          const invalid = session.snapshot.invalid[row]?.[column] === true;
          const pending = pendingCells.has(`${row}-${column}`);
          const hintRoles = Array.from(
            new Set(
              hintMarks
                .filter(({ target }) => targetIncludesCell(target, row, column))
                .map(({ role }) => role),
            ),
          );
          const nodeDescriptions = hintNodes
            .filter(({ target }) => targetIncludesCell(target, row, column))
            .map((node) =>
              [
                node.group ? `group ${node.group}` : '',
                node.order ? `chain position ${node.order}` : '',
              ]
                .filter(Boolean)
                .join(', '),
            )
            .filter(Boolean);
          const hintDescription = [
            ...hintRoles.map((role) => roleLabel[role]),
            ...nodeDescriptions,
          ].join(', ');
          const isSelected = selected?.[0] === row && selected?.[1] === column;
          const isFocusable = isSelected
            ? true
            : !selected &&
              firstFocusableCell?.[0] === row &&
              firstFocusableCell?.[1] === column;
          const cellContent = value
            ? `${given ? 'given ' : ''}${value}`
            : cellCandidatesVisible && candidates.length > 0
              ? `empty, candidates ${candidates.join(', ')}`
              : 'empty';
          return (
            <button
              key={`${row}-${column}`}
              className={[
                cellClass(row, column),
                ...hintRoles.map((role) => `game-cell--hint-${role}`),
              ]
                .filter(Boolean)
                .join(' ')}
              data-cell={`${row}-${column}`}
              type="button"
              role="gridcell"
              aria-invalid={invalid || undefined}
              aria-busy={pending || undefined}
              aria-selected={isSelected}
              aria-disabled={readOnly || undefined}
              aria-label={`Row ${row + 1}, column ${column + 1}, ${cellContent}${pending ? ', checking' : ''}${invalid ? ', invalid' : ''}${hintDescription ? `, ${hintDescription}` : ''}`}
              tabIndex={!readOnly && isFocusable ? 0 : -1}
              onPointerDown={(event) => {
                if (!readOnly && event.pointerType !== 'touch')
                  setSelected([row, column]);
              }}
              onFocus={() => {
                if (!readOnly) setSelected([row, column]);
              }}
              onClick={() => {
                if (!readOnly) setSelected([row, column]);
              }}
            >
              {value ? (
                <span className="cell-value">{value}</span>
              ) : (
                <span
                  className={`cell-notes${showCandidates ? ' cell-notes--automatic' : ''}`}
                  aria-hidden="true"
                >
                  {Array.from({ length: 9 }, (_, index) => {
                    const digit = (index + 1) as Digit;
                    const isMatchingNote =
                      cellCandidatesVisible &&
                      selectedValue !== 0 &&
                      digit === selectedValue &&
                      candidates.includes(digit);
                    const candidateRoles = hintMarks
                      .filter(
                        ({ target }) =>
                          target.kind === 'candidate' &&
                          target.row === row + 1 &&
                          target.column === column + 1 &&
                          target.value === digit,
                      )
                      .map(({ role }) => `cell-note--hint-${role}`);
                    const hintNode = hintNodes.find(
                      ({ target }) =>
                        target.kind === 'candidate' &&
                        target.row === row + 1 &&
                        target.column === column + 1 &&
                        target.value === digit,
                    );
                    const digitVisible =
                      (cellCandidatesVisible && candidates.includes(digit)) ||
                      candidateRoles.length > 0 ||
                      Boolean(hintNode);
                    return (
                      <span
                        key={index}
                        className={
                          [
                            isMatchingNote ? 'cell-note--matching' : '',
                            ...candidateRoles,
                            hintNode ? 'cell-note--hint-node' : '',
                          ]
                            .filter(Boolean)
                            .join(' ') || undefined
                        }
                        data-node-group={hintNode?.group}
                        data-node-order={hintNode?.order}
                      >
                        <span className="cell-note__digit">
                          {digitVisible ? digit : ''}
                        </span>
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
    <HintScene nodes={hintNodes} links={hintLinks} />
    {paused && (
      <div className="pause-cover" role="status">
        <strong>Puzzle paused</strong>
        <span>Your time is stopped.</span>
      </div>
    )}
  </div>
);
