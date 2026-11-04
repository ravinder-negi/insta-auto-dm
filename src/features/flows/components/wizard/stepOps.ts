import type { DmFlowIntentMap } from "@/types";
import type { FlowStepInput } from "@/features/flows/actions";

/** Where a branch that pointed at `target` (1-based step number) should point
 *  once the step at 1-based position `removed` is gone: later steps shift
 *  down by one, and a branch into the removed step ends the flow instead of
 *  silently landing on its neighbour. */
function remapTarget(target: number, removed: number): number | null {
  if (target === removed) return null;
  return target > removed ? target - 1 : target;
}

function remapIntentMap(intentMap: DmFlowIntentMap, removed: number): DmFlowIntentMap {
  const next: DmFlowIntentMap = {};
  for (const key of ["yes", "no", "default"] as const) {
    const target = intentMap[key];
    if (target == null) continue;
    const mapped = remapTarget(target, removed);
    if (mapped != null) next[key] = mapped;
  }
  return next;
}

/** Removes the step at `index` (0-based) and re-points every branch target
 *  (intent_map and option targets) so they still refer to the same steps. */
export function removeStepAt(steps: FlowStepInput[], index: number): FlowStepInput[] {
  const removed = index + 1;
  return steps
    .filter((_, i) => i !== index)
    .map((step, i) => ({
      ...step,
      step_order: i + 1,
      intent_map: remapIntentMap(step.intent_map ?? {}, removed),
      options: (step.options ?? []).map((option) => ({
        ...option,
        target_step_order:
          option.target_step_order == null ? null : remapTarget(option.target_step_order, removed),
      })),
    }));
}

/** A branch target is only meaningful if it names an existing step. */
export function isValidStepTarget(target: unknown, stepCount: number): target is number {
  return typeof target === "number" && Number.isInteger(target) && target >= 1 && target <= stepCount;
}
