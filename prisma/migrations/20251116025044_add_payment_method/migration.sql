-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('DINHEIRO', 'PIX', 'CREDITO');

-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "paymentMethod" "PaymentMethod" NOT NULL DEFAULT 'PIX';
