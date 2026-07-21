import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function migrate() {
  try {
    // Check if InternIssue table exists
    const tables = await prisma.$queryRaw`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'InternIssue'
    `;
    console.log('InternIssue table exists:', tables.length > 0);

    if (tables.length === 0) {
      // Create enum types if they don't exist
      try {
        await prisma.$executeRawUnsafe(`
          DO $$ BEGIN
            CREATE TYPE "IssueType" AS ENUM ('ADMINISTRASI', 'KEHADIRAN', 'PERFORMA', 'PERILAKU', 'RESIGN', 'LAINNYA');
          EXCEPTION
            WHEN duplicate_object THEN null;
          END $$;
        `);
        console.log('IssueType enum created/exists');
      } catch (e) {
        console.log('IssueType enum already exists');
      }

      try {
        await prisma.$executeRawUnsafe(`
          DO $$ BEGIN
            CREATE TYPE "IssueStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED');
          EXCEPTION
            WHEN duplicate_object THEN null;
          END $$;
        `);
        console.log('IssueStatus enum created/exists');
      } catch (e) {
        console.log('IssueStatus enum already exists');
      }

      // Create InternIssue table
      await prisma.$executeRawUnsafe(`
        CREATE TABLE "InternIssue" (
          "id" TEXT NOT NULL,
          "internId" TEXT NOT NULL,
          "type" "IssueType"[] NOT NULL DEFAULT '{}',
          "description" TEXT NOT NULL,
          "reportedDate" TIMESTAMP(3) NOT NULL,
          "followUpAction" TEXT,
          "status" "IssueStatus" NOT NULL DEFAULT 'OPEN',
          "resolvedDate" TIMESTAMP(3),
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL,
          CONSTRAINT "InternIssue_pkey" PRIMARY KEY ("id")
        );
      `);
      console.log('InternIssue table created');

      // Add indexes
      await prisma.$executeRawUnsafe(`CREATE INDEX "InternIssue_internId_idx" ON "InternIssue"("internId");`);
      await prisma.$executeRawUnsafe(`CREATE INDEX "InternIssue_status_idx" ON "InternIssue"("status");`);
      await prisma.$executeRawUnsafe(`CREATE INDEX "InternIssue_reportedDate_idx" ON "InternIssue"("reportedDate");`);
      console.log('Indexes created');

      // Add foreign key
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "InternIssue" ADD CONSTRAINT "InternIssue_internId_fkey" 
        FOREIGN KEY ("internId") REFERENCES "Intern"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      `);
      console.log('Foreign key added');
    } else {
      // Table exists, check if type column is array or single
      const colInfo = await prisma.$queryRaw`
        SELECT data_type, udt_name FROM information_schema.columns 
        WHERE table_name = 'InternIssue' AND column_name = 'type'
      `;
      console.log('Column type info:', colInfo);
      
      if (colInfo.length > 0 && colInfo[0].data_type !== 'ARRAY') {
        console.log('Converting type column from single to array...');
        await prisma.$executeRawUnsafe(`ALTER TABLE "InternIssue" ALTER COLUMN "type" TYPE "IssueType"[] USING ARRAY["type"];`);
        await prisma.$executeRawUnsafe(`ALTER TABLE "InternIssue" ALTER COLUMN "type" SET DEFAULT '{}';`);
        console.log('Type column converted to array');
      } else {
        console.log('Type column is already an array');
      }
    }

    // Also add issues relation to Intern if not already there
    console.log('Migration complete!');
  } catch (error) {
    console.error('Migration error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

migrate();
