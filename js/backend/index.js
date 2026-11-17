import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../../config.js';
import { demo } from './demo.js';

export const api = SUPABASE_URL && SUPABASE_ANON_KEY
  ? (await import('./supabase.js')).supabase
  : demo;
