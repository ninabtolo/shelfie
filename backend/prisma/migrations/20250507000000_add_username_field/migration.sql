-- AlterTable
ALTER TABLE "User" ADD COLUMN "username" TEXT;

-- Set default usernames for existing users (extract from email)
UPDATE "User" SET "username" = CONCAT('user_', SUBSTRING(MD5(email), 1, 8)) WHERE "username" IS NULL;

-- Make username required after populating data
ALTER TABLE "User" ALTER COLUMN "username" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
