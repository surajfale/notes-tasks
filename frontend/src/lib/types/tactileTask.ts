/**
 * Local data shape for the tactile task/quick-note components
 * (lib/components/tactile/*). Deliberately independent of the app's real
 * `Task` type (types/task.ts) — this component set is a self-contained
 * interaction-design piece (local $state, no store/repository wiring),
 * not a re-skin of the production task list.
 */
export interface TactileTask {
  id: string;
  title: string;
  note: string;
  completed: boolean;
}
