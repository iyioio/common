import { ISqlClient, SqlMigration, sql, sqlName } from "@iyio/common";

export const defaultMigrationsTable='__SqlMigrations__'

export async function applyDbMigrationAsync(
    client:ISqlClient,
    migrations:SqlMigration[],
    targetMigration?:string,
    migrationTable=defaultMigrationsTable
): Promise<void> {

    if(!migrations?.length){
        return;
    }

    await client.execAsync(sql`
        CREATE TABLE IF NOT EXISTS ${sqlName(migrationTable)} (
            "name" varchar(255) NOT NULL
        );
    `)

    const appliedMigrations=await client.selectColAsync<string>(sql`SELECT "name" FROM ${sqlName(migrationTable)}`);


    // todo - add support for downwards migrations

    const applyEnd:SqlMigration[]=[];
    //up
    for(const migration of migrations){

        if(appliedMigrations.includes(migration.name)){
            if(migration.name===targetMigration){
                break;
            }
            if(migration.upTrigger==='always'){
                applyEnd.push(migration);
            }
            continue;
        }

        await client.execAsync(migration.up);

        await client.execAsync(sql`INSERT INTO ${sqlName(migrationTable)} ("name") VALUES (${migration.name});`);

        if(migration.name===targetMigration){
            break;
        }

    }

    for(const migration of applyEnd){
        await client.execAsync(migration.up);
    }

}

export async function forceClearAllMigrationsAsync(
    client:ISqlClient,
    migrations:SqlMigration[],
    migrationTable=defaultMigrationsTable
): Promise<void> {

    if(!migrations?.length){
        return;
    }

    for(let i=migrations.length-1;i>-1;i--){

        const migration=migrations[i];

        try{
            await client.execAsync(migration.down);
        }catch(ex){
            console.warn('Migration.down failed. Continuing with for clear all.',(ex as any)?.message);
        }
    }

    try{
        await client.execAsync(sql`DROP TABLE IF EXISTS ${sqlName(migrationTable)}`);
    }catch(ex){
        console.warn(`DROP ${migrationTable} failed.`,(ex as any)?.message);
    }

}
