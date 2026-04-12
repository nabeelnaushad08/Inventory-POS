// This file is kept for backward-compatibility only.
// The canonical types now live in /types/database.ts and /types/index.ts.
// All new code should import from '@/types' instead.

export type { Database, Json } from '@/types/database'
export type {
  Tables,
  TablesInsert,
  TablesUpdate,
  Enums,
} from '@/types/index'
