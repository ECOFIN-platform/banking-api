const AWS = require("aws-sdk");
require("dotenv").config();

// Configuration AWS
AWS.config.update({
  region: process.env.AWS_REGION,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

const dynamoDB = new AWS.DynamoDB.DocumentClient();
const BANK_ACCOUNTS_TABLE = process.env.BANK_ACCOUNTS_TABLE;
const TRANSACTIONS_TABLE = process.env.TRANSACTIONS_TABLE;

module.exports = { dynamoDB, BANK_ACCOUNTS_TABLE, TRANSACTIONS_TABLE };
