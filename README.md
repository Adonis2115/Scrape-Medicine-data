# This project demonstartes or can work as boilerplate for setting up Drizzle Orm with nodejs and typescript.

## Below are the technologies used

- Nodejs
- Typescript
- Postgres
- Drizzle-Orm
- PNPM

## Steps to use.

1. Clone Project
2. pnpm i
3. Replace connection string of postgress with your working in .env file (take note os SSL disabled or not)
4. pnpm migrate
5. pnpm dev
6. For Production pnpm start

## To Do

1. Lower memory footprint on fetching drugs (Lowering Opening of more Browser instances).
2. processed true flag for drugs not having url for single or combined.
3. Fetch correct type of drug for combined generic medicines.
4. Any method to update drugs data without refetching everything. Fetch change only new and updated data.
