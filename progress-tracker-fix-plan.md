# Progress Tracker Fix Plan

## Current diagnosis

The defect is contained in `src/main.ts`:

- Checkbox changes save the selected IDs, but do not recalculate or render the progress display.
- The `Resetuj napredak` button has no event listener.
- `src/storage.ts` already provides `CompletedItemsStore.clear()`, so no broader persistence change is expected.

The existing automated suite currently passes: six storage tests pass together with TypeScript type checking.

## Implementation plan

1. In `src/main.ts`, connect the existing progress elements and the reset button to `InterviewPreparationPage`.
2. Add one derived-progress render path that reads the current checkbox state and updates:
   - completed-step count;
   - completion percentage;
   - progress-bar value; and
   - the status message.
3. Run that render path after saved checkbox state is restored, after each checkbox change, and after reset.
4. Implement reset by unchecking all eight existing checkboxes, calling `CompletedItemsStore.clear()`, and rendering the initial state.
5. Extend tests only for the new progress/reset-relevant logic, without adding libraries or changing the storage contract.
6. Run `npm test`, then manually verify:
   - checking multiple steps in sequence;
   - unchecking a step;
   - reset; and
   - reset followed by a page refresh.

## Open requirement

`project-specification.md`, which the README references as the source of the exact status-message contract, is not available in this workspace. Before implementation, the expected status messages need to be supplied or a minimal mapping needs to be approved.
