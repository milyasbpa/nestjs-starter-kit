-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'USER');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "refreshTokenHash" TEXT,
ADD COLUMN     "role" "Role" NOT NULL DEFAULT 'USER';
