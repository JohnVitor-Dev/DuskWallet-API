/*
  Warnings:

  - Added the required column `category` to the `Transaction` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "TransactionCategory" AS ENUM ('MORADIA', 'CONTAS', 'MERCADO', 'COMIDA_FORA', 'TRANSPORTE', 'SAUDE', 'EDUCACAO', 'LAZER', 'COMPRAS', 'DIVIDAS', 'INVESTIMENTOS', 'SALARIO', 'OUTRAS_RECEITAS', 'OUTROS');

-- AlterTable
ALTER TABLE "Transaction" DROP COLUMN "category",
ADD COLUMN     "category" "TransactionCategory" NOT NULL;
