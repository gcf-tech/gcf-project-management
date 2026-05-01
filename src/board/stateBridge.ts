import type { AppState } from './types.js';

// @ts-ignore – vanilla JS module; shape is defined in types.ts
import { STATE as _STATE } from '../core/state.js';

export const STATE = _STATE as AppState;
