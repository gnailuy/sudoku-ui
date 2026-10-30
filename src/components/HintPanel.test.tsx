// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { HintPreview } from '../api/types';
import { sourceMessages } from '../i18n/catalogs';
import { HintPanel } from './HintPanel';

const descriptor = (id: string, text: string) => ({
  id,
  arguments: [],
  text,
});

const preview: HintPreview = {
  revision: 3,
  hint: {
    plan_id: 'a'.repeat(64),
    kind: 'strategy',
    title: {
      id: 'strategy.hidden-single.name',
      arguments: [],
      text: 'Hidden single',
    },
    strategy: {
      id: 'hidden-single',
      name: {
        id: 'strategy.hidden-single.name',
        arguments: [],
        text: 'Hidden single',
      },
      grade: 'easy',
      grade_name: {
        id: 'difficulty.easy.name',
        arguments: [],
        text: 'Easy',
      },
    },
    summary: {
      id: 'hint.strategy.summary',
      arguments: [
        { name: 'steps', kind: 'count', count: 2 },
        { name: 'strategy', kind: 'strategy', strategy: 'hidden-single' },
      ],
      text: 'Only one value fits.',
    },
    steps: [
      {
        id: 'observe',
        kind: 'observe',
        message: descriptor(
          'hint.strategy.observe',
          'Look at row 1, column 1.',
        ),
        narration: [
          {
            kind: 'message',
            message: descriptor('hint.narration.look-at', 'Look at '),
          },
          { kind: 'target', target: { kind: 'cell', row: 1, column: 1 } },
          {
            kind: 'message',
            message: descriptor(
              'hint.narration.only-candidate',
              '. It has only one candidate: ',
            ),
          },
          { kind: 'digit', value: 1 },
          {
            kind: 'message',
            message: descriptor('hint.narration.period', '.'),
          },
        ],
        marks: [],
        nodes: [
          {
            id: 'r1c1-v1',
            target: { kind: 'candidate', row: 1, column: 1, value: 1 },
            group: 'A',
            order: 1,
          },
          {
            id: 'r1c2-v1',
            target: { kind: 'candidate', row: 1, column: 2, value: 1 },
            group: 'B',
            order: 2,
          },
        ],
        links: [
          { from: 'r1c1-v1', to: 'r1c2-v1', kind: 'strong' },
          { from: 'r1c2-v1', to: 'r1c1-v1', kind: 'weak' },
          { from: 'r1c1-v1', to: 'r1c2-v1', kind: 'implication' },
        ],
      },
      {
        id: 'conclude',
        kind: 'apply',
        message: {
          id: 'hint.strategy.conclude',
          arguments: [
            {
              name: 'strategy',
              kind: 'strategy',
              strategy: 'hidden-single',
            },
          ],
          text: 'Place the value.',
        },
        marks: [],
        nodes: [],
        links: [],
      },
    ],
    conclusion: { kind: 'eliminate-candidates', eliminations: [] },
  },
};

describe('HintPanel', () => {
  it('falls back to the complete message for malformed narration', () => {
    const malformed = JSON.parse(JSON.stringify(preview)) as HintPreview;
    malformed.hint.steps[0]!.narration = [
      { kind: 'message', message: null, value: 1 } as never,
    ];

    render(
      <HintPanel
        preview={malformed}
        stepIndex={0}
        setStepIndex={vi.fn()}
        apply={vi.fn()}
        close={vi.fn()}
        busy={false}
      />,
    );

    expect(
      screen.getByText(sourceMessages['hint.strategy.observe']),
    ).toBeVisible();
  });

  it('renders correction plans without pretending they are strategies', () => {
    const correction = JSON.parse(JSON.stringify(preview)) as HintPreview;
    correction.hint.kind = 'candidate-correction';
    correction.hint.title = {
      id: 'hint.candidate-correction.title',
      arguments: [],
      text: 'Fix this candidate cell',
    };
    delete correction.hint.strategy;

    render(
      <HintPanel
        preview={correction}
        stepIndex={0}
        setStepIndex={vi.fn()}
        apply={vi.fn()}
        close={vi.fn()}
        busy={false}
      />,
    );

    expect(
      screen.getByRole('heading', { name: 'Fix this candidate cell' }),
    ).toBeVisible();
    expect(screen.queryByText(/strategy$/)).not.toBeInTheDocument();
  });

  it('navigates locally and only offers apply on the final step', () => {
    const setStepIndex = vi.fn();
    const apply = vi.fn();
    const { rerender } = render(
      <HintPanel
        preview={preview}
        stepIndex={0}
        setStepIndex={setStepIndex}
        apply={apply}
        close={vi.fn()}
        busy={false}
      />,
    );
    expect(screen.getByText('Hint')).toBeVisible();
    expect(screen.getByRole('heading', { name: 'Hint' })).toBeVisible();
    expect(screen.queryByText('Hidden Single')).not.toBeInTheDocument();
    expect(screen.queryByText('Easy strategy')).not.toBeInTheDocument();
    expect(screen.queryByRole('group')).not.toBeInTheDocument();
    expect(
      screen.queryByText(preview.hint.summary.text),
    ).not.toBeInTheDocument();
    expect(screen.getByText('Step 1 of 2')).toBeVisible();
    expect(screen.getByText('this highlighted cell')).toBeVisible();
    expect(screen.getByText('r1c1')).toBeVisible();
    expect(screen.getByText('row 1, column 1')).toHaveClass(
      'hint-narration__accessible',
    );
    expect(
      screen.queryByText('Look at row 1, column 1.'),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('list', { name: 'Visual hint legend' }),
    ).toHaveTextContent(
      'Solid: must containDashed: cannot bothArrow: implicationA/B: alternating groupsNumbers: chain order',
    );
    expect(
      screen.queryByRole('button', { name: 'Apply hint' }),
    ).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(setStepIndex).toHaveBeenCalledWith(1);

    rerender(
      <HintPanel
        preview={preview}
        stepIndex={1}
        setStepIndex={setStepIndex}
        apply={apply}
        close={vi.fn()}
        busy={false}
      />,
    );
    expect(screen.getByText('Hidden Single')).toBeVisible();
    expect(screen.getByText('Easy strategy')).toBeVisible();
    expect(screen.getByRole('group', { name: 'Hidden Single' })).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'Back' }));
    expect(setStepIndex).toHaveBeenCalledWith(0);
    fireEvent.click(screen.getByRole('button', { name: 'Apply hint' }));
    expect(apply).toHaveBeenCalledOnce();
    const close = vi.fn();
    rerender(
      <HintPanel
        preview={preview}
        stepIndex={1}
        setStepIndex={setStepIndex}
        apply={apply}
        close={close}
        busy={false}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(close).toHaveBeenCalledOnce();
  });
});
