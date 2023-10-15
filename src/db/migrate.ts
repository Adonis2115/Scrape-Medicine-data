import { Pool } from "pg";
import {drizzle} from "drizzle-orm/node-postgres"
import {migrate} from "drizzle-orm/node-postgres/migrator"
import 'dotenv/config'

const pool = new Pool({
    connectionString:process.env.CONNECTIONSTRING
})

const db = drizzle(pool)

async function main(){
    console.log("Migration Started...")
    await migrate(db,{migrationsFolder:"drizzle"})
    console.log("Migration Finished.")
    process.exit(0)
}
main().catch((error)=>{
    console.log(error)
    process.exit(0)
})