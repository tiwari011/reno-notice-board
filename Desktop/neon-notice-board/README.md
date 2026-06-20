# Neon Notice Board

Project setup for the Reno internship assignment.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Add your database connection string to `.env` as `DATABASE_URL`.
3. Generate Prisma client and push the schema:
   ```bash
   npx prisma generate
   npx prisma db push
   ```

## Included Scaffold

- Next.js Pages Router project structure
- Prisma schema and config
- Environment file example
- Path alias config

