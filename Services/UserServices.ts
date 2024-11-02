import axios from "axios";
import db from "../config/dB";
import { Funds, Transfer, User } from "../types";
require("dotenv").config();
const bcrypt = require("bcrypt");
const saltRounds = 10;

const KARMA_BLACKLIST_API = process.env.KARMA;

class UserService {
  private async isBlacklisted(email: string): Promise<boolean> {
    try {
      const response = await axios.get(`${KARMA_BLACKLIST_API}${email}`, {
        headers: {
          Authorization: `Bearer ${process.env.TOKEN}`,
        },
      });
      // 200 response means the user is blacklisted
      return response.status === 200;
    } catch (error) {
      // If the user is not found on the blacklist, we assume a 404 is returned
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return false;
      }
      throw new Error("Error verifying blacklist status");
    }
  }

  //creating user and wallet
  async createUser(user: User): Promise<void> {
    const isBlacklisted = await this.isBlacklisted(user.email);
    // Check if user is on the blacklist
    if (isBlacklisted) {
      throw new Error("User is blacklisted and cannot be onboarded.");
    }

    // Check if user already exists
    const existingUser = await db("users").where({ email: user.email }).first();
    if (existingUser) {
      throw new Error("User with this email already exists.");
    }

    // Hash password
    const passwordHash = await bcrypt.hash(user.password, saltRounds);

    // Create user and wallet
    const [userId] = await db("users")
      .insert({
        username: user.username,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        password: passwordHash,
      })
      .returning("id"); // Adjust "id" to match your database schema

    // Create wallet entry linked to the user
    await db("wallet").insert({ user_id: userId });
  }

  async fundUserAccount(user: Funds) {
    await db("wallet")
      .where({ user_id: user.user_id })
      .increment("balance", user.amount);
  }

  async fundTransfer(user: Transfer) {
    const senderWallet = await db("wallet")
      .where({ user_id: user.user_id })
      .first();
    const recipient = await db("users")
      .where({ email: user.receiver_email })
      .first();

    //check if either og them exist
    if (!senderWallet || !recipient)
      throw new Error("Sender or recipient does not exist.");

    //check if sender has enough funds
    if (senderWallet.balance < user.amount)
      throw new Error("Insufficient funds.");

    await db.transaction(async (trx) => {
      await trx("wallet")
        .where({ user_id: user.user_id })
        .decrement("balance", user.amount);
      await trx("wallets")
        .where({ user_id: recipient.id })
        .increment("balance", user.amount);
    });
  }

  async withdrawFund(user: Funds) {
    const wallet = await db("wallet").where({ user_id: user.user_id }).first();
    if (!wallet || wallet.balance < user.amount)
      throw new Error("Insufficient funds.");

    await db("wallet")
      .where({ user_id: user.user_id })
      .decrement("balance", user.amount);
  }
}
export default new UserService();
