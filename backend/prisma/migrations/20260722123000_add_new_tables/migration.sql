-- AlterTable
ALTER TABLE "User" ADD COLUMN     "company" TEXT,
ADD COLUMN     "country" TEXT,
ADD COLUMN     "department" TEXT,
ADD COLUMN     "designation" TEXT,
ADD COLUMN     "emailVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "name" TEXT,
ADD COLUMN     "passwordChangedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "planType" TEXT NOT NULL DEFAULT 'Basic',
ADD COLUMN     "prefAlerts" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "prefDeals" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "prefDefaultCountry" TEXT NOT NULL DEFAULT 'India',
ADD COLUMN     "prefDefaultTherapeuticArea" TEXT NOT NULL DEFAULT 'Oncology',
ADD COLUMN     "prefMarketing" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "prefNewTrials" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "prefNewsletter" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "prefTheme" TEXT NOT NULL DEFAULT 'dark';

-- DropTable
DROP TABLE "Medicine";

-- CreateTable
CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL,
    "invoiceNumber" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "status" TEXT NOT NULL DEFAULT 'paid',
    "planName" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PipelineProspector" (
    "id" TEXT NOT NULL,
    "srNo" TEXT,
    "companyName" TEXT,
    "headQuarter" TEXT,
    "nctNumber" TEXT,
    "leadDrug" TEXT,
    "secondaryDrug" TEXT,
    "primaryIndication" TEXT,
    "therapeuticArea" TEXT,
    "phases" TEXT,
    "developmentPhase" TEXT,
    "startingDate" TEXT,
    "completionDate" TEXT,
    "predictionOfLaunching" TEXT,
    "trialStatus" TEXT,
    "terminatedReason" TEXT,
    "moleculeType" TEXT,
    "moleculeClass" TEXT,
    "researchCode" TEXT,
    "mechanismOfAction" TEXT,
    "targetBiomarker" TEXT,
    "orphanDrugStatus" TEXT,
    "fastTrackApproval" TEXT,
    "lineOfTherapy" TEXT,
    "title" TEXT,
    "licensee" TEXT,
    "country" TEXT,
    "licensor" TEXT,
    "licensorCountry" TEXT,
    "upfrontPayment" TEXT,
    "dealSizeMillion" TEXT,
    "paymentMode" TEXT,
    "year" TEXT,
    "deals" TEXT,
    "dealsType" TEXT,
    "link" TEXT,
    "licensingAvailability" TEXT,
    "contactPersonName" TEXT,
    "designation" TEXT,
    "contactNo" TEXT,
    "emailIdLink" TEXT,
    "locations" TEXT,
    "country1" TEXT,
    "clinicalInvestigatorName" TEXT,
    "contactEmail" TEXT,
    "contactTel" TEXT,
    "gender" TEXT,
    "age" TEXT,
    "enrollment" TEXT,
    "fundedBy" TEXT,
    "studyType" TEXT,
    "indicationMarketSize2023" TEXT,
    "epidemiology" TEXT,
    "sponsor" TEXT,
    "collaboration" TEXT,
    "studyResults" TEXT,
    "outcomeMeasures" TEXT,
    "originator" TEXT,
    "developer" TEXT,
    "technology" TEXT,
    "routeOfAdministration" TEXT,
    "strength" TEXT,
    "dosageForm" TEXT,
    "patentInfo" TEXT,
    "lastUpdated" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PipelineProspector_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PatentSalesForecasting" (
    "id" TEXT NOT NULL,
    "applicationNumber" TEXT,
    "patentNumber" TEXT,
    "applicant" TEXT,
    "approvalDate" TEXT,
    "patentExpiryDate" TEXT,
    "brandName" TEXT,
    "activeIngredient" TEXT,
    "moa" TEXT,
    "biomarker" TEXT,
    "lineOfTherapy" TEXT,
    "roa" TEXT,
    "dose" TEXT,
    "indicationApproved" TEXT,
    "therapeuticArea" TEXT,
    "indicationUnderEvaluation" TEXT,
    "rld" TEXT,
    "rs" TEXT,
    "country" TEXT,
    "sales2018" TEXT,
    "sales2019" TEXT,
    "sales2020" TEXT,
    "sales2021" TEXT,
    "sales2022" TEXT,
    "forecastingSales2023" TEXT,
    "forecastingSales2024" TEXT,
    "forecastingSales2025" TEXT,
    "forecastingSales2026" TEXT,
    "forecastingSales2027" TEXT,
    "noOfCompetitors" TEXT,
    "sources" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PatentSalesForecasting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OtpVerification" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "otp" TEXT NOT NULL,
    "passwordHash" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "type" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OtpVerification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_invoiceNumber_key" ON "Invoice"("invoiceNumber");

-- CreateIndex
CREATE INDEX "PipelineProspector_leadDrug_idx" ON "PipelineProspector"("leadDrug");

-- CreateIndex
CREATE INDEX "PipelineProspector_primaryIndication_idx" ON "PipelineProspector"("primaryIndication");

-- CreateIndex
CREATE INDEX "PipelineProspector_mechanismOfAction_idx" ON "PipelineProspector"("mechanismOfAction");

-- CreateIndex
CREATE INDEX "PatentSalesForecasting_activeIngredient_idx" ON "PatentSalesForecasting"("activeIngredient");

-- CreateIndex
CREATE INDEX "PatentSalesForecasting_brandName_idx" ON "PatentSalesForecasting"("brandName");

-- CreateIndex
CREATE INDEX "PatentSalesForecasting_moa_idx" ON "PatentSalesForecasting"("moa");

-- CreateIndex
CREATE INDEX "PatentSalesForecasting_indicationApproved_idx" ON "PatentSalesForecasting"("indicationApproved");

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
