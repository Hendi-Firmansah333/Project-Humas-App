-- CreateTable
CREATE TABLE "RealtimeVersion" (
    "scope" TEXT NOT NULL,
    "versionTs" BIGINT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RealtimeVersion_pkey" PRIMARY KEY ("scope")
);
