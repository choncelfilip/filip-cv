// Discriminated unions for loading states (typescript-pro skill)
export type FrameLoadingState =
  | { readonly status: 'idle' }
  | { readonly status: 'loading'; readonly progress: number }
  | { readonly status: 'loaded'; readonly frames: HTMLImageElement[]; readonly count: number }
  | { readonly status: 'error'; readonly message: string };

// Chat message types
export type ChatMessageRole = 'user' | 'ai' | 'system' | 'error';

export interface ChatMessage {
  readonly id: string;
  readonly role: ChatMessageRole;
  readonly content: string;
  readonly timestamp: number;
}

// Content types
export interface HeroContent {
  readonly name: string;
  readonly title: string;
}

export interface TerminalCommand {
  readonly cmd: string;
  readonly output: readonly string[];
}

export interface TerminalContent {
  readonly commands: readonly TerminalCommand[];
}

// API types
export interface FrameCountResponse {
  readonly count: number;
}

export interface ChatWebhookRequest {
  readonly message: string;
  readonly sessionId: string;
}

export interface ChatWebhookResponse {
  readonly reply?: string;
  readonly output?: string;
  readonly text?: string;
  readonly message?: string;
}
