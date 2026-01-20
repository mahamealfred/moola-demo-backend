CREATE TABLE `RefreshTokens` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `token` VARCHAR(255) NOT NULL,
  `userId` BIGINT UNSIGNED NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `username` VARCHAR(255) NOT NULL,
  `agentCategory` VARCHAR(100) NOT NULL,
  `userAuth` VARCHAR(255) NOT NULL,
  `expiresAt` DATETIME NOT NULL,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_refreshtokens_token` (`token`),
  KEY `idx_refreshtokens_expiresat` (`expiresAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE transactions_status (
    ID INT(11) NOT NULL AUTO_INCREMENT,
    transactionId VARCHAR(10) DEFAULT NULL,
    customerId VARCHAR(50) DEFAULT NULL,
    token VARCHAR(255) DEFAULT NULL,
    thirdpart_status VARCHAR(20) DEFAULT NULL,
    service_name VARCHAR(25) DEFAULT NULL,
    status VARCHAR(20) DEFAULT NULL,
    description TEXT DEFAULT NULL,
    amount DECIMAL(10,2) DEFAULT NULL,
    agent_name VARCHAR(20) DEFAULT NULL,
    transaction_reference VARCHAR(50) DEFAULT NULL,
    date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (ID)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

ALTER TABLE transactions_status
ADD COLUMN customerId VARCHAR(50) NULL AFTER transactionId,
ADD COLUMN token VARCHAR(255) NULL AFTER customerId;

ALTER TABLE transactions_status
ADD COLUMN agent_id VARCHAR(50) NULL AFTER agent_name;

ALTER TABLE transactions_status
ADD COLUMN customer_charge DECIMAL(10,2) DEFAULT NULL AFTER amount;

