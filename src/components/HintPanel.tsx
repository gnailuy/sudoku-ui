import type { HintPreview, HintStep, HintTarget } from '../api/types';
import type { MessageId } from '../i18n/catalogs';
import {
  descriptorText,
  isValidMessageDescriptor,
} from '../i18n/backendMessages';
import { useLocalization } from '../i18n/localization';

interface HintPanelProps {
  preview: HintPreview;
  stepIndex: number;
  setStepIndex: (index: number) => void;
  apply: () => void;
  close: () => void;
  busy: boolean;
  operation?: 'applying-hint' | 'refreshing-hint';
}

type FormatMessage = ReturnType<typeof useLocalization>['formatMessage'];

const unitMessageIds: Record<'row' | 'column' | 'box', MessageId> = {
  row: 'hint.target.row',
  column: 'hint.target.column',
  box: 'hint.target.box',
};

const targetLabels = (target: HintTarget, formatMessage: FormatMessage) => {
  if (target.row && target.column) {
    const values = {
      row: target.row,
      column: target.column,
      value: target.value ?? 0,
    };
    if (target.kind === 'candidate' && target.value) {
      return {
        visible: formatMessage('hint.target.candidate.visible'),
        locator: formatMessage('hint.target.candidate.locator', values),
        accessible: formatMessage('hint.target.candidate.accessible', values),
      };
    }
    return {
      visible: formatMessage('hint.target.cell.visible'),
      locator: formatMessage('hint.target.cell.locator', values),
      accessible: formatMessage('hint.target.cell.accessible', values),
    };
  }
  const index = target.index ?? 0;
  const kind = formatMessage(
    unitMessageIds[target.kind as 'row' | 'column' | 'box'],
  );
  const values = { kind, index };
  return {
    visible: formatMessage('hint.target.unit.visible', values),
    locator: formatMessage('hint.target.unit.locator', values),
    accessible: formatMessage('hint.target.unit.accessible', values),
  };
};

const isGridIndex = (value: number | undefined) =>
  typeof value === 'number' &&
  Number.isInteger(value) &&
  value >= 1 &&
  value <= 9;

const isValidNarrationTarget = (target: HintTarget | null | undefined) => {
  if (!target || typeof target !== 'object') return false;
  const keys = Object.keys(target).sort().join(',');
  if (target.kind === 'cell') {
    return (
      keys === 'column,kind,row' &&
      isGridIndex(target.row) &&
      isGridIndex(target.column)
    );
  }
  if (target.kind === 'candidate') {
    return (
      keys === 'column,kind,row,value' &&
      isGridIndex(target.row) &&
      isGridIndex(target.column) &&
      isGridIndex(target.value)
    );
  }
  return (
    ['row', 'column', 'box'].includes(target.kind) &&
    keys === 'index,kind' &&
    isGridIndex(target.index)
  );
};

const hasValidNarration = (step: HintStep) => {
  if (!step.narration?.length) return false;
  return step.narration.every((chunk) => {
    if (!chunk || typeof chunk !== 'object') return false;
    const keys = Object.keys(chunk).sort().join(',');
    if (chunk.kind === 'message') {
      return keys === 'kind,message' && isValidMessageDescriptor(chunk.message);
    }
    if (chunk.kind === 'digit') {
      return (
        keys === 'kind,value' &&
        Number.isInteger(chunk.value) &&
        chunk.value >= 1 &&
        chunk.value <= 9
      );
    }
    if (chunk.kind === 'target') {
      return keys === 'kind,target' && isValidNarrationTarget(chunk.target);
    }
    return false;
  });
};

const HintNarration = ({ step }: { step: HintStep }) => {
  const { formatMessage, formatReference } = useLocalization();
  if (!hasValidNarration(step)) {
    return (
      <span className="hint-narration--fallback">
        {descriptorText(step.message, formatReference)}
      </span>
    );
  }
  return (
    <span className="hint-narration--structured">
      {step.narration!.map((chunk, index) => {
        if (chunk.kind === 'message')
          return descriptorText(chunk.message, formatReference);
        if (chunk.kind === 'digit') {
          return (
            <span className="hint-narration__digit" key={index}>
              {chunk.value}
            </span>
          );
        }
        const labels = targetLabels(chunk.target, formatMessage);
        return (
          <span className="hint-narration__target" key={index}>
            <span aria-hidden="true">
              {labels.visible}{' '}
              <span className="hint-narration__locator">{labels.locator}</span>
            </span>
            <span className="hint-narration__accessible">
              {labels.accessible}
            </span>
          </span>
        );
      })}
    </span>
  );
};

export const HintPanel = ({
  preview,
  stepIndex,
  setStepIndex,
  apply,
  close,
  busy,
  operation,
}: HintPanelProps) => {
  const { formatMessage, formatReference } = useLocalization();
  const { hint } = preview;
  const step = hint.steps[stepIndex]!;
  const finalStep = stepIndex === hint.steps.length - 1;
  const legend = [
    step.links.some(({ kind }) => kind === 'strong') &&
      formatMessage('hint.legend.strong'),
    step.links.some(({ kind }) => kind === 'weak') &&
      formatMessage('hint.legend.weak'),
    step.links.some(({ kind }) => kind === 'implication') &&
      formatMessage('hint.legend.implication'),
    step.nodes.some(({ group }) => group) &&
      formatMessage('hint.legend.groups'),
    step.nodes.some(({ order }) => order) && formatMessage('hint.legend.order'),
  ].filter(Boolean) as string[];
  const title = descriptorText(hint.title, formatReference);
  const showStrategy = hint.kind === 'strategy' && finalStep;
  const heading =
    hint.kind === 'strategy' && !showStrategy
      ? formatMessage('hint.label')
      : title;
  const gradeName = hint.strategy
    ? descriptorText(hint.strategy.grade_name, formatReference)
    : undefined;
  const summary = descriptorText(hint.summary, formatReference);
  let operationLabel: string | undefined;
  if (operation) {
    operationLabel = formatMessage(
      operation === 'applying-hint' ? 'hint.applying' : 'hint.refreshing',
    );
  }

  return (
    <section
      className="hint-panel"
      aria-labelledby="hint-title"
      aria-description={
        hint.kind !== 'strategy' || finalStep ? summary : undefined
      }
      aria-busy={operation !== undefined}
    >
      <div className="hint-panel__heading">
        <div>
          {hint.kind !== 'strategy' && (
            <p className="eyebrow">{formatMessage('hint.label')}</p>
          )}
          <h2 id="hint-title" className="hint-strategy-name">
            {heading}
          </h2>
          {showStrategy && hint.strategy && (
            <div
              className="hint-strategy-reveal"
              role="group"
              aria-labelledby="hint-title"
            >
              <p className="hint-strategy-grade">
                {formatMessage('hint.strategy.grade', {
                  grade: gradeName ?? hint.strategy.grade,
                })}
              </p>
            </div>
          )}
        </div>
        <button
          type="button"
          className="hint-close"
          onClick={close}
          disabled={busy}
        >
          {formatMessage('hint.close')}
        </button>
      </div>
      {operationLabel && (
        <div
          className="hint-transaction"
          role="status"
          aria-label={operationLabel}
        >
          <span
            className="loading-mark loading-mark--inline"
            aria-hidden="true"
          />
          <p>{operationLabel}</p>
        </div>
      )}
      <div className="hint-step" aria-live="polite" aria-atomic="true">
        <p className="hint-step__count">
          {formatMessage('hint.step', {
            current: stepIndex + 1,
            total: hint.steps.length,
          })}
        </p>
        <p>
          <HintNarration step={step} />
        </p>
      </div>
      {legend.length > 0 && (
        <ul
          className="hint-legend"
          aria-label={formatMessage('hint.legend.label')}
        >
          {legend.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      )}
      <div className="hint-navigation">
        <button
          type="button"
          onClick={() => setStepIndex(stepIndex - 1)}
          disabled={busy || stepIndex === 0}
        >
          {formatMessage('hint.back')}
        </button>
        {!finalStep ? (
          <button
            type="button"
            className="primary-action"
            onClick={() => setStepIndex(stepIndex + 1)}
            disabled={busy}
          >
            {formatMessage('hint.next')}
          </button>
        ) : (
          <button
            type="button"
            className="primary-action"
            onClick={apply}
            disabled={busy}
            aria-busy={operation === 'applying-hint'}
          >
            {formatMessage(
              operation === 'applying-hint' ? 'hint.applying' : 'hint.apply',
            )}
          </button>
        )}
      </div>
    </section>
  );
};
