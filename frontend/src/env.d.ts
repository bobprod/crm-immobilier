/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly NEXT_PUBLIC_API_URL?: string;
  // PostgreSQL est maintenant géré via Prisma dans le backend
  // Plus besoin de Supabase
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
