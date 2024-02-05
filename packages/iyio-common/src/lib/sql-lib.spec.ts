import { splitSqlStatements } from "./sql-lib"


describe('sql-lib',()=>{

    it('should split sql',()=>{

        expect(splitSqlStatements(
            'select * from tbl1; select * from tbl2;'
        )).toEqual([
            'select * from tbl1',
            'select * from tbl2',
        ])

        expect(splitSqlStatements(
            'select * from tbl1; select * from tbl2'
        )).toEqual([
            'select * from tbl1',
            'select * from tbl2',
        ])

        expect(splitSqlStatements(
            ';select * from tbl1;;; select * from tbl2;;;'
        )).toEqual([
            'select * from tbl1',
            'select * from tbl2',
        ])

        expect(splitSqlStatements(
            'select * from tbl1;-- comment\n select * from tbl2'
        )).toEqual([
            'select * from tbl1',
            'select * from tbl2',
        ])

        expect(splitSqlStatements(
            'select * from tbl1;-- comment select * from tbl2'
        )).toEqual([
            'select * from tbl1',
        ])

        expect(splitSqlStatements(
            'select ";" from tbl1; select * from tbl2'
        )).toEqual([
            'select ";" from tbl1',
            'select * from tbl2',
        ])

        expect(splitSqlStatements(
            'select \';\' from tbl1; select * from tbl2'
        )).toEqual([
            'select \';\' from tbl1',
            'select * from tbl2',
        ])

        expect(splitSqlStatements(
            'select "--" from tbl1; select * from tbl2'
        )).toEqual([
            'select "--" from tbl1',
            'select * from tbl2',
        ])

        expect(splitSqlStatements(
            'select \'--\' from tbl1; select * from tbl2'
        )).toEqual([
            'select \'--\' from tbl1',
            'select * from tbl2',
        ])

        expect(splitSqlStatements(
            '-- empty'
        )).toEqual([
        ])

        expect(splitSqlStatements(
            '-- comment first\r\n\rselect \'--\' from tbl1; select * from tbl2'
        )).toEqual([
            'select \'--\' from tbl1',
            'select * from tbl2',
        ])

        expect(splitSqlStatements(
            'select \'--\'\'\' from tbl1; select * from tbl2'
        )).toEqual([
            'select \'--\'\'\' from tbl1',
            'select * from tbl2',
        ])



        expect(splitSqlStatements(
`-- CreateTable
CREATE TABLE "VectorIndex" (
    "id" SERIAL NOT NULL,
    "userId" VARCHAR(255),
    "accountId" VARCHAR(255),
    "group1" VARCHAR(255),
    "group2" VARCHAR(255),
    "group3" VARCHAR(255),
    "group4" VARCHAR(255),
    "group5" VARCHAR(255),
    "type1" VARCHAR(255),
    "type2" VARCHAR(255),
    "type3" VARCHAR(255),
    "type4" VARCHAR(255),
    "type5" VARCHAR(255),
    "int1" INTEGER,
    "int2" INTEGER,
    "int3" INTEGER,
    "int4" INTEGER,
    "int5" INTEGER,
    "int6" INTEGER,
    "int7" INTEGER,
    "int8" INTEGER,
    "int9" INTEGER,
    "int10" INTEGER,
    "sourceDescription" TEXT,
    "sourceUrl" TEXT,
    "sourceType" VARCHAR(255),
    "sourceId" VARCHAR(255),
    "sourceLineNumber" INTEGER,
    "sourceColNumber" INTEGER,
    "text" TEXT NOT NULL,

    CONSTRAINT "VectorIndex_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "VectorIndex_sourceId_idx" ON "VectorIndex"("sourceId");

-- CreateIndex
CREATE INDEX "VectorIndex_sourceType_idx" ON "VectorIndex"("sourceType");

-- CreateIndex
CREATE INDEX "VectorIndex_userId_idx" ON "VectorIndex"("userId");

-- CreateIndex
CREATE INDEX "VectorIndex_accountId_idx" ON "VectorIndex"("accountId");

-- CreateIndex
CREATE INDEX "VectorIndex_group1_idx" ON "VectorIndex"("group1");

-- CreateIndex
CREATE INDEX "VectorIndex_group2_idx" ON "VectorIndex"("group2");

-- CreateIndex
CREATE INDEX "VectorIndex_group3_idx" ON "VectorIndex"("group3");

-- CreateIndex
CREATE INDEX "VectorIndex_group4_idx" ON "VectorIndex"("group4");

-- CreateIndex
CREATE INDEX "VectorIndex_group5_idx" ON "VectorIndex"("group5");

-- CreateIndex
CREATE INDEX "VectorIndex_type1_idx" ON "VectorIndex"("type1");

-- CreateIndex
CREATE INDEX "VectorIndex_type2_idx" ON "VectorIndex"("type2");

-- CreateIndex
CREATE INDEX "VectorIndex_type3_idx" ON "VectorIndex"("type3");

-- CreateIndex
CREATE INDEX "VectorIndex_type4_idx" ON "VectorIndex"("type4");

-- CreateIndex
CREATE INDEX "VectorIndex_type5_idx" ON "VectorIndex"("type5");

-- CreateIndex
CREATE INDEX "VectorIndex_int1_idx" ON "VectorIndex"("int1");

-- CreateIndex
CREATE INDEX "VectorIndex_int2_idx" ON "VectorIndex"("int2");

-- CreateIndex
CREATE INDEX "VectorIndex_int3_idx" ON "VectorIndex"("int3");

-- CreateIndex
CREATE INDEX "VectorIndex_int4_idx" ON "VectorIndex"("int4");

-- CreateIndex
CREATE INDEX "VectorIndex_int5_idx" ON "VectorIndex"("int5");

-- CreateIndex
CREATE INDEX "VectorIndex_int6_idx" ON "VectorIndex"("int6");

-- CreateIndex
CREATE INDEX "VectorIndex_int7_idx" ON "VectorIndex"("int7");

-- CreateIndex
CREATE INDEX "VectorIndex_int8_idx" ON "VectorIndex"("int8");

-- CreateIndex
CREATE INDEX "VectorIndex_int9_idx" ON "VectorIndex"("int9");

-- CreateIndex
CREATE INDEX "VectorIndex_int10_idx" ON "VectorIndex"("int10");`
        )).toEqual([
`CREATE TABLE "VectorIndex" (
    "id" SERIAL NOT NULL,
    "userId" VARCHAR(255),
    "accountId" VARCHAR(255),
    "group1" VARCHAR(255),
    "group2" VARCHAR(255),
    "group3" VARCHAR(255),
    "group4" VARCHAR(255),
    "group5" VARCHAR(255),
    "type1" VARCHAR(255),
    "type2" VARCHAR(255),
    "type3" VARCHAR(255),
    "type4" VARCHAR(255),
    "type5" VARCHAR(255),
    "int1" INTEGER,
    "int2" INTEGER,
    "int3" INTEGER,
    "int4" INTEGER,
    "int5" INTEGER,
    "int6" INTEGER,
    "int7" INTEGER,
    "int8" INTEGER,
    "int9" INTEGER,
    "int10" INTEGER,
    "sourceDescription" TEXT,
    "sourceUrl" TEXT,
    "sourceType" VARCHAR(255),
    "sourceId" VARCHAR(255),
    "sourceLineNumber" INTEGER,
    "sourceColNumber" INTEGER,
    "text" TEXT NOT NULL,

    CONSTRAINT "VectorIndex_pkey" PRIMARY KEY ("id")
)`,
            'CREATE INDEX "VectorIndex_sourceId_idx" ON "VectorIndex"("sourceId")',
            'CREATE INDEX "VectorIndex_sourceType_idx" ON "VectorIndex"("sourceType")',
            'CREATE INDEX "VectorIndex_userId_idx" ON "VectorIndex"("userId")',
            'CREATE INDEX "VectorIndex_accountId_idx" ON "VectorIndex"("accountId")',
            'CREATE INDEX "VectorIndex_group1_idx" ON "VectorIndex"("group1")',
            'CREATE INDEX "VectorIndex_group2_idx" ON "VectorIndex"("group2")',
            'CREATE INDEX "VectorIndex_group3_idx" ON "VectorIndex"("group3")',
            'CREATE INDEX "VectorIndex_group4_idx" ON "VectorIndex"("group4")',
            'CREATE INDEX "VectorIndex_group5_idx" ON "VectorIndex"("group5")',
            'CREATE INDEX "VectorIndex_type1_idx" ON "VectorIndex"("type1")',
            'CREATE INDEX "VectorIndex_type2_idx" ON "VectorIndex"("type2")',
            'CREATE INDEX "VectorIndex_type3_idx" ON "VectorIndex"("type3")',
            'CREATE INDEX "VectorIndex_type4_idx" ON "VectorIndex"("type4")',
            'CREATE INDEX "VectorIndex_type5_idx" ON "VectorIndex"("type5")',
            'CREATE INDEX "VectorIndex_int1_idx" ON "VectorIndex"("int1")',
            'CREATE INDEX "VectorIndex_int2_idx" ON "VectorIndex"("int2")',
            'CREATE INDEX "VectorIndex_int3_idx" ON "VectorIndex"("int3")',
            'CREATE INDEX "VectorIndex_int4_idx" ON "VectorIndex"("int4")',
            'CREATE INDEX "VectorIndex_int5_idx" ON "VectorIndex"("int5")',
            'CREATE INDEX "VectorIndex_int6_idx" ON "VectorIndex"("int6")',
            'CREATE INDEX "VectorIndex_int7_idx" ON "VectorIndex"("int7")',
            'CREATE INDEX "VectorIndex_int8_idx" ON "VectorIndex"("int8")',
            'CREATE INDEX "VectorIndex_int9_idx" ON "VectorIndex"("int9")',
            'CREATE INDEX "VectorIndex_int10_idx" ON "VectorIndex"("int10")',
        ])

    })

})
