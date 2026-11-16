CREATE TABLE "User" ("id" TEXT NOT NULL,"email" TEXT NOT NULL,"name" TEXT NOT NULL,"passwordHash" TEXT NOT NULL,"preferences" JSONB NOT NULL,"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,CONSTRAINT "User_pkey" PRIMARY KEY ("id"));
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE TABLE "Session" ("tokenHash" TEXT NOT NULL,"userId" TEXT NOT NULL,"expiresAt" TIMESTAMP(3) NOT NULL,CONSTRAINT "Session_pkey" PRIMARY KEY ("tokenHash"),CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE);
CREATE INDEX "Session_userId_idx" ON "Session"("userId");
CREATE TABLE "PasswordReset" ("tokenHash" TEXT NOT NULL,"userId" TEXT NOT NULL,"expiresAt" TIMESTAMP(3) NOT NULL,CONSTRAINT "PasswordReset_pkey" PRIMARY KEY ("tokenHash"),CONSTRAINT "PasswordReset_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE);
CREATE INDEX "PasswordReset_userId_idx" ON "PasswordReset"("userId");
CREATE TABLE "LearningEvent" ("userId" TEXT NOT NULL,"eventId" TEXT NOT NULL,"occurredAt" TIMESTAMP(3) NOT NULL,"payload" JSONB NOT NULL,"receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,CONSTRAINT "LearningEvent_pkey" PRIMARY KEY ("userId","eventId"),CONSTRAINT "LearningEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE);
CREATE INDEX "LearningEvent_userId_occurredAt_idx" ON "LearningEvent"("userId","occurredAt");
CREATE TABLE "Curriculum" ("version" TEXT NOT NULL,"payload" JSONB NOT NULL,"importedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,CONSTRAINT "Curriculum_pkey" PRIMARY KEY ("version"));
