// Typed protocol for the control ↔ display postMessage bus.
//
// Why TS for this file: the wire format is the contract between two windows
// that share no runtime state. A typo in an action string would otherwise be
// a silent no-op. The discriminated unions below let `tsc` catch mismatched
// payloads at compile time. JS feature modules call `send()` and benefit from
// the same checking thanks to `allowJs` at the import boundary.

export const TARGETS = {
  IMAGE: "image",
  VIDEO: "video",
  TEXT: "text",
  CREDITS: "credits",
  ALPHABET: "alphabet",
  I: "i",
  EMO: "emo",
} as const;

export type Target = (typeof TARGETS)[keyof typeof TARGETS];

// ---------------------------------------------------------------------------
// Control messages — control → display drives all feature behavior.
// Discriminator is { target, action }. Where the same action exists on
// multiple targets but takes the same payload, the target slot widens.
// ---------------------------------------------------------------------------

type GenericVisibilityMsg = {
  type: "control";
  target: Target;
  action: "show" | "hide" | "fadeIn" | "fadeOut";
};

type SetValueMsg =
  | { type: "control"; target: "text"; action: "setValue"; value: string }
  | { type: "control"; target: "credits"; action: "setValue"; value: string };

type SetColorMsg = {
  type: "control";
  target: "text";
  action: "setColor";
  value: string;
};

// setSource: pick exactly one of mediaId or url. Both branches are kept so
// the caller is forced to choose at the type level.
type SetSourceMsg =
  | { type: "control"; target: "image" | "video"; action: "setSource"; mediaId: string }
  | { type: "control"; target: "image" | "video"; action: "setSource"; url: string };

type VideoControlMsg =
  | { type: "control"; target: "video"; action: "play" | "pause" | "restart" }
  | { type: "control"; target: "video"; action: "setOnEnd"; value: "fade" | "loop" };

type CreditsMsg = {
  type: "control";
  target: "credits";
  action: "roll";
};

type AlphabetMsg =
  | { type: "control"; target: "alphabet"; action: "next" }
  | { type: "control"; target: "alphabet"; action: "setStart"; value: string };

type AnimateMsg = {
  type: "control";
  target: Target;
  action: "animate";
  value: string;
  byLetter?: boolean;
  // `before` is sent by the control side but never consumed by the display
  // animator. Kept optional so existing call sites stay valid; remove once
  // the dead field is cleaned up. See plans/off-topic-improvements.md.
  before?: string;
  after?: "hide";
};

type ToggleClassMsg = {
  type: "control";
  target: Target;
  action: "toggle-class";
  value: string;
};

// EmoRoCo: folded into the target-based shape. Wire actions drop the `emo-`
// prefix (renamed in step 6 of the migration plan).
type EmoMsg =
  | { type: "control"; target: "emo"; action: "add"; id: number; value: string }
  | { type: "control"; target: "emo"; action: "change"; id: number; value: string }
  | { type: "control"; target: "emo"; action: "focus"; id: number }
  | { type: "control"; target: "emo"; action: "remove"; id: number };

export type ControlMessage =
  | GenericVisibilityMsg
  | SetValueMsg
  | SetColorMsg
  | SetSourceMsg
  | VideoControlMsg
  | CreditsMsg
  | AlphabetMsg
  | AnimateMsg
  | ToggleClassMsg
  | EmoMsg;

// ---------------------------------------------------------------------------
// Non-control traffic: handshake, visibility reports, errors, and replies.
// ---------------------------------------------------------------------------

export type HelloMsg = { type: "hello"; callback?: true };

export type VisibilityMsg = {
  type: "query-visible";
  target: Target;
  value: "visible" | "hidden";
  callback: true;
};

// Errors: unified shape (was previously two variants; the feature-level
// `{ value: msg }` form was renamed to `msg` for consistency).
export type ErrorMsg = {
  type: "error";
  target: Target | "window";
  msg: string;
  url?: string;
  line?: number;
  trace?: string;
  callback?: true;
};

// Replies carry the same (target, action) as the request, plus callback:true.
// Video also emits two reply-only actions (`playing`, `paused`) that don't
// correspond to inbound requests.
export type ReplyMsg =
  | (ControlMessage & { callback: true })
  | { type: "control"; target: "video"; action: "playing" | "paused"; callback: true };

export type AnyMessage = ControlMessage | HelloMsg | VisibilityMsg | ErrorMsg | ReplyMsg;

// ---------------------------------------------------------------------------
// Send helpers. Pick payload from (target, action) so callers can't pass the
// wrong shape. JS callers get the same check at the import boundary.
// ---------------------------------------------------------------------------

type PayloadFor<T extends Target, A extends string> = Omit<
  Extract<ControlMessage, { target: T; action: A }>,
  "type" | "target" | "action"
>;

// Global typings for the window.control / window.display namespaces. The
// arrays + sendMessage are created by globals.js + messaging.ts; everything
// else is feature-specific and stays untyped (loose index signature).
type MessageHandler = (m: AnyMessage) => void;

export interface ControlNamespace {
  sendMessage: (m: AnyMessage) => void;
  onReadys: Array<() => void>;
  messageHandlers: MessageHandler[];
  callbackHandlers: MessageHandler[];
  clickHandlers: Array<() => void>;
  stateHandlers: Array<() => void>;
  display: Window | null;
  showError: (msg: string, url: string, line: string, trace: string) => void;
  [key: string]: unknown;
}

export interface DisplayNamespace {
  sendMessage: (m: AnyMessage) => void;
  onReadys: Array<() => void>;
  messageHandlers: MessageHandler[];
  callbackHandlers: MessageHandler[];
  controller: Window | null;
  sendError: (msg: string, url: string, line: string | number, trace: string) => void;
  sendVisibility: (target: Target) => void;
  registerTarget: <T extends Target>(
    target: T,
    handler: (m: Extract<ControlMessage, { target: T }>) => void
  ) => void;
  [key: string]: unknown;
}

declare global {
  interface Window {
    control: ControlNamespace;
    display: DisplayNamespace;
  }
}

export function send<T extends Target, A extends ControlMessage["action"]>(
  target: T,
  action: A,
  ...rest: keyof PayloadFor<T, A> extends never
    ? [payload?: Record<string, never>]
    : [payload: PayloadFor<T, A>]
): void {
  const payload = rest[0] ?? {};
  window.control.sendMessage({ type: "control", target, action, ...payload } as ControlMessage);
}

// Display-side reply: echo (target, action) back with callback:true plus any
// extras. Used for both ack-style replies and the video-only playing/paused.
export function reply(message: ControlMessage, extras?: Record<string, unknown>): void {
  window.display.sendMessage({ ...message, ...extras, callback: true } as ReplyMsg);
}

// Exhaustiveness helper. Use as the default in switch(message.action) blocks
// so `tsc` errors when a new action is added but a case isn't.
export function assertNever(value: never): never {
  throw new Error(`Unexpected message variant: ${JSON.stringify(value)}`);
}
