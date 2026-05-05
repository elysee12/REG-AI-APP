-- AlterTable
ALTER TABLE `branch` ADD COLUMN `village` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `device` ADD COLUMN `village` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `security_contact` ADD COLUMN `village` VARCHAR(191) NULL;
