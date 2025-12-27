import { defineConfig } from 'prisma/config'

export default defineConfig({
    schema: './schema.prisma',
    database: {
        url: 'postgresql://postgres:postgres@localhost:5432/crm_immobilier?schema=public',
    },
})
