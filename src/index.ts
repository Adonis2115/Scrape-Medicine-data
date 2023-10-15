import { db } from "./db";
import { drug } from "./db/schema";

async function main(){
    const result = await db.insert(drug).values({name: "Paracemaol"})
    console.log(result)
    process.exit(0)
}
main().catch((error)=>{
    console.log(error)
    process.exit(0)
})