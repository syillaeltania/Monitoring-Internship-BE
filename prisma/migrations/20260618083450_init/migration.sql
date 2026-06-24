-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('HCM_STAFF', 'HCM_LEADER');

-- CreateEnum
CREATE TYPE "InternshipType" AS ENUM ('INSTITUTION', 'PROFESSIONAL');

-- CreateEnum
CREATE TYPE "InternshipStatus" AS ENUM ('PLANNED', 'ACTIVE', 'COMPLETED', 'TERMINATED');

-- CreateEnum
CREATE TYPE "ProcessStatus" AS ENUM ('REQUEST_RECEIVED', 'SCREENING', 'ACCEPTED', 'ACCEPTANCE_LETTER_SENT', 'WAITING_JOIN', 'ACTIVE', 'COMPLETED', 'COMPLETION_CHECKLIST_DONE');

-- CreateEnum
CREATE TYPE "ReplacementStatus" AS ENUM ('COVERED', 'NEEDS_REPLACEMENT', 'URGENT_EMPTY');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "division" TEXT,
    "team" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Intern" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "InternshipType" NOT NULL,
    "institution" TEXT,
    "major" TEXT,
    "division" TEXT NOT NULL,
    "team" TEXT NOT NULL,
    "position" TEXT,
    "leader" TEXT,
    "location" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "durationLabel" TEXT,
    "manualStatus" "InternshipStatus",
    "phone" TEXT,
    "email" TEXT,
    "notes" TEXT,
    "acceptanceLetterSent" BOOLEAN NOT NULL DEFAULT false,
    "sourceSheet" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Intern_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BenefitScheme" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "InternshipType" NOT NULL,
    "baseSalary" INTEGER NOT NULL DEFAULT 0,
    "mealAllowancePerDay" INTEGER NOT NULL DEFAULT 25000,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BenefitScheme_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MonthlyCost" (
    "id" TEXT NOT NULL,
    "internId" TEXT NOT NULL,
    "benefitSchemeId" TEXT,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "baseSalary" INTEGER NOT NULL DEFAULT 0,
    "mealAllowancePerDay" INTEGER NOT NULL DEFAULT 25000,
    "workingDays" INTEGER NOT NULL DEFAULT 0,
    "attendanceDays" INTEGER NOT NULL DEFAULT 0,
    "totalMealAllowance" INTEGER NOT NULL DEFAULT 0,
    "totalMonthlyCost" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "MonthlyCost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InternshipPlan" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "InternshipType" NOT NULL,
    "institution" TEXT,
    "major" TEXT,
    "targetDivision" TEXT NOT NULL,
    "targetTeam" TEXT NOT NULL,
    "leader" TEXT,
    "acceptanceLetterDate" TIMESTAMP(3),
    "plannedStartDate" TIMESTAMP(3) NOT NULL,
    "plannedEndDate" TIMESTAMP(3) NOT NULL,
    "documentStatus" TEXT,
    "onboardingStatus" TEXT,
    "processStatus" "ProcessStatus" NOT NULL DEFAULT 'REQUEST_RECEIVED',
    "phone" TEXT,
    "notes" TEXT,
    "sourceSheet" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InternshipPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompletionChecklist" (
    "id" TEXT NOT NULL,
    "internId" TEXT NOT NULL,
    "leaderEvaluationForm" BOOLEAN NOT NULL DEFAULT false,
    "completionForm" BOOLEAN NOT NULL DEFAULT false,
    "certificate" BOOLEAN NOT NULL DEFAULT false,
    "accessReturned" BOOLEAN NOT NULL DEFAULT false,
    "assetReturned" BOOLEAN NOT NULL DEFAULT false,
    "finalReport" BOOLEAN NOT NULL DEFAULT false,
    "finalStatus" TEXT NOT NULL DEFAULT 'Belum Lengkap',
    "notes" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompletionChecklist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamRequirement" (
    "id" TEXT NOT NULL,
    "division" TEXT NOT NULL,
    "team" TEXT NOT NULL,
    "leader" TEXT,
    "activeInstitutionCount" INTEGER NOT NULL DEFAULT 0,
    "activeProfessionalCount" INTEGER NOT NULL DEFAULT 0,
    "minimumInstitutionNeed" INTEGER NOT NULL DEFAULT 1,
    "endingInternName" TEXT,
    "soonestEndDate" TIMESTAMP(3),
    "replacementStatus" "ReplacementStatus" NOT NULL DEFAULT 'COVERED',
    "replacementCandidate" TEXT,
    "hcmPic" TEXT,
    "notes" TEXT,
    "sourceSheet" TEXT,

    CONSTRAINT "TeamRequirement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrganizationUnit" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "parentId" TEXT,
    "leader" TEXT,
    "orderNo" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "OrganizationUnit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeaderEvaluation" (
    "id" TEXT NOT NULL,
    "internId" TEXT NOT NULL,
    "score" INTEGER,
    "notes" TEXT,
    "evidence" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeaderEvaluation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Intern_type_division_team_idx" ON "Intern"("type", "division", "team");

-- CreateIndex
CREATE INDEX "Intern_startDate_endDate_idx" ON "Intern"("startDate", "endDate");

-- CreateIndex
CREATE UNIQUE INDEX "Intern_name_type_startDate_endDate_key" ON "Intern"("name", "type", "startDate", "endDate");

-- CreateIndex
CREATE INDEX "MonthlyCost_year_month_idx" ON "MonthlyCost"("year", "month");

-- CreateIndex
CREATE UNIQUE INDEX "MonthlyCost_internId_month_year_key" ON "MonthlyCost"("internId", "month", "year");

-- CreateIndex
CREATE UNIQUE INDEX "InternshipPlan_name_type_plannedStartDate_key" ON "InternshipPlan"("name", "type", "plannedStartDate");

-- CreateIndex
CREATE UNIQUE INDEX "CompletionChecklist_internId_key" ON "CompletionChecklist"("internId");

-- CreateIndex
CREATE UNIQUE INDEX "TeamRequirement_division_team_key" ON "TeamRequirement"("division", "team");

-- AddForeignKey
ALTER TABLE "MonthlyCost" ADD CONSTRAINT "MonthlyCost_internId_fkey" FOREIGN KEY ("internId") REFERENCES "Intern"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MonthlyCost" ADD CONSTRAINT "MonthlyCost_benefitSchemeId_fkey" FOREIGN KEY ("benefitSchemeId") REFERENCES "BenefitScheme"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompletionChecklist" ADD CONSTRAINT "CompletionChecklist_internId_fkey" FOREIGN KEY ("internId") REFERENCES "Intern"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizationUnit" ADD CONSTRAINT "OrganizationUnit_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "OrganizationUnit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaderEvaluation" ADD CONSTRAINT "LeaderEvaluation_internId_fkey" FOREIGN KEY ("internId") REFERENCES "Intern"("id") ON DELETE CASCADE ON UPDATE CASCADE;
