import { OnEventRequest } from "@iyio/aws";
import { deleteDb, migrateDb } from "../db-migrator-lib.js";

const SqlDbMigratorFn=async (event: OnEventRequest)=>{
    switch (event.RequestType) {
        case "Create":
        case "Update":
            return await migrateDb(event);

        case "Delete":
            return await deleteDb(event);
    }
}

export const handler=SqlDbMigratorFn;


