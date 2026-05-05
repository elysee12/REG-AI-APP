/*
  Warnings:

  - You are about to alter the column `aiClass` on the `incident` table. The data in that column could be lost. The data in that column will be cast from `Enum(EnumId(0))` to `VarChar(191)`.
  - You are about to alter the column `status` on the `incident` table. The data in that column could be lost. The data in that column will be cast from `Enum(EnumId(3))` to `VarChar(191)`.

*/
-- AlterTable
ALTER TABLE `device` ADD COLUMN `cameraConnected` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `esp32Connected` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `gpsSatellites` INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE `incident` ADD COLUMN `aiSummary` TEXT NULL,
    ADD COLUMN `alertType` VARCHAR(191) NULL,
    ADD COLUMN `gpsLatitude` DOUBLE NULL,
    ADD COLUMN `gpsLongitude` DOUBLE NULL,
    ADD COLUMN `pirSensor` VARCHAR(191) NULL,
    ADD COLUMN `servoPosition` INTEGER NULL,
    MODIFY `aiClass` VARCHAR(191) NULL DEFAULT 'SUSPICIOUS',
    MODIFY `status` VARCHAR(191) NOT NULL DEFAULT 'ACTIVE';

-- CreateTable
CREATE TABLE `technician` (
    `id` VARCHAR(191) NOT NULL,
    `staffId` VARCHAR(191) NOT NULL,
    `fullName` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NOT NULL,
    `profileImage` VARCHAR(191) NULL,
    `faceToken` JSON NULL,
    `branchId` INTEGER NOT NULL,
    `role` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'ACTIVE',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `technician_staffId_key`(`staffId`),
    UNIQUE INDEX `technician_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `technician` ADD CONSTRAINT `technician_branchId_fkey` FOREIGN KEY (`branchId`) REFERENCES `branch`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
