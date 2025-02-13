const express = require("express");
const { dynamoDB, BANK_ACCOUNTS_TABLE, TRANSACTIONS_TABLE } = require("../config/db");
const { v4: uuidv4 } = require("uuid");
const authMiddleware = require("../middleware/authMiddleware");
const axios = require("axios");

const router = express.Router();

// 📌 1. Vérification d'identité via API bancaire (KYC)
router.post("/kyc/verify", authMiddleware, async (req, res) => {
  const { bankApiUrl, userId, documentId } = req.body;

  try {
    const response = await axios.post(bankApiUrl, { userId, documentId });
    res.json({ message: "KYC Vérifié", data: response.data });
  } catch (error) {
    res.status(500).json({ message: "Erreur API bancaire", error: error.response?.data });
  }
});

// 📌 2. Ajout d'un compte bancaire
router.post("/accounts/add", authMiddleware, async (req, res) => {
  const { bankName, accountNumber, iban, currency } = req.body;

  try {
    const newAccount = {
      id: uuidv4(),
      userId: req.user.id,
      bankName,
      accountNumber,
      iban,
      currency,
      createdAt: new Date().toISOString(),
    };

    await dynamoDB.put({
      TableName: BANK_ACCOUNTS_TABLE,
      Item: newAccount,
    }).promise();

    res.status(201).json({ message: "Compte bancaire ajouté avec succès", account: newAccount });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error });
  }
});

// 📌 3. Récupération des comptes bancaires d'un utilisateur
router.get("/accounts", authMiddleware, async (req, res) => {
  try {
    const result = await dynamoDB.scan({
      TableName: BANK_ACCOUNTS_TABLE,
      FilterExpression: "userId = :userId",
      ExpressionAttributeValues: { ":userId": req.user.id },
    }).promise();

    res.json(result.Items);
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error });
  }
});

// 📌 4. Initiation d'un virement bancaire
router.post("/payments/initiate", authMiddleware, async (req, res) => {
  const { recipientIban, amount, currency, bankApiUrl } = req.body;

  try {
    const transaction = {
      id: uuidv4(),
      userId: req.user.id,
      recipientIban,
      amount,
      currency,
      status: "pending",
      createdAt: new Date().toISOString(),
    };

    await dynamoDB.put({
      TableName: TRANSACTIONS_TABLE,
      Item: transaction,
    }).promise();

    // Simulation d'appel API bancaire externe
    await axios.post(bankApiUrl, { recipientIban, amount, currency });

    res.status(201).json({ message: "Virement initié avec succès", transaction });
  } catch (error) {
    res.status(500).json({ message: "Erreur API bancaire", error: error.response?.data });
  }
});

// 📌 5. Vérification du solde via API bancaire
router.post("/accounts/balance", authMiddleware, async (req, res) => {
  const { bankApiUrl, accountNumber } = req.body;

  try {
    const response = await axios.get(`${bankApiUrl}/balance/${accountNumber}`);
    res.json({ balance: response.data.balance });
  } catch (error) {
    res.status(500).json({ message: "Erreur API bancaire", error: error.response?.data });
  }
});

module.exports = router;
