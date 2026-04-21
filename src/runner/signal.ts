import { EventEmitter } from "events";

export type SignalEvent = "abort" | "pause" | "resume";

export interface SignalState {
  aborted: boolean;
  paused: boolean;
}

export interface SignalController {
  emitter: EventEmitter;
  state: SignalState;
  abort: () => void;
  pause: () => void;
  resume: () => void;
  onAbort: (fn: () => void) => void;
  onPause: (fn: () => void) => void;
  onResume: (fn: () => void) => void;
  waitIfPaused: () => Promise<void>;
}

export function createSignalController(): SignalController {
  const emitter = new EventEmitter();
  const state: SignalState = { aborted: false, paused: false };

  const abort = () => {
    if (!state.aborted) {
      state.aborted = true;
      emitter.emit("abort");
    }
  };

  const pause = () => {
    if (!state.paused && !state.aborted) {
      state.paused = true;
      emitter.emit("pause");
    }
  };

  const resume = () => {
    if (state.paused) {
      state.paused = false;
      emitter.emit("resume");
    }
  };

  const onAbort = (fn: () => void) => emitter.on("abort", fn);
  const onPause = (fn: () => void) => emitter.on("pause", fn);
  const onResume = (fn: () => void) => emitter.on("resume", fn);

  const waitIfPaused = (): Promise<void> => {
    if (!state.paused) return Promise.resolve();
    return new Promise((resolve) => {
      emitter.once("resume", resolve);
    });
  };

  return { emitter, state, abort, pause, resume, onAbort, onPause, onResume, waitIfPaused };
}

export function isAborted(ctrl: SignalController): boolean {
  return ctrl.state.aborted;
}
