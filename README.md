# Agents-UI

UI for [langgraph_distributed_agent](https://github.com/SelfRefLab/langgraph_distributed_agent)


https://github.com/user-attachments/assets/6ef83c79-cb42-4cab-8359-27dfb74cdc65



## Getting Started

1. Create a `.env` file in the project root:
``` bash
DATABASE_URL="file:./dev.db"
REDIS_URL="redis://:password@localhost:6379/0"
```
Make sure that REDIS_URL matches the environment variable used in [langgraph_distributed_agent](https://github.com/SelfRefLab/langgraph_distributed_agent)

If you are using MySQL, update `schema.prisma` by changing:
`provider = "sqlite"`
to:
`provider = "mysql"`

2. Install dependencies:
``` bash
pnpm install
```
3. Generate Prisma client:
``` bash
npx prisma generate
```
4. Push the database schema:
``` bash
npx prisma db push
```
5. Start the development server:
``` bash
pnpm dev
```
