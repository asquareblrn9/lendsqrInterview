import UserServices from "./Services/UserServices";
import db from "./config/dB";
const bcrypt = require("bcrypt");
import axios from "axios";

// Mock the database and external functions
jest.mock("./config/dB");
jest.mock("axios");

describe("UserService - createUser", () => {
  const mockUser = {
    username: "testuser",
    email: "testuser@example.com",
    first_name: "Test",
    last_name: "User",
    password: "password123",
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should create a user and a wallet when not blacklisted", async () => {
    // Mock isBlacklisted to return false
    (axios.get as jest.Mock).mockResolvedValue({ status: 404 });

    // Mock bcrypt hash function
    jest.spyOn(bcrypt, "hash").mockResolvedValue("hashedPassword");

    // Mock db insert to return an ID
    (db as jest.MockedFunction<any>).mockImplementation(() => ({
      insert: jest.fn().mockResolvedValue([1]),
    }));

    await expect(UserServices.createUser(mockUser)).resolves.not.toThrow();

    expect(db).toHaveBeenCalledWith("users");
    expect(db).toHaveBeenCalledWith("wallet");
  });

  it("should throw an error when the user is blacklisted", async () => {
    // Mock isBlacklisted to return true
    (axios.get as jest.Mock).mockResolvedValue({ status: 200 });

    await expect(UserServices.createUser(mockUser)).rejects.toThrow(
      "User is blacklisted and cannot be onboarded."
    );
  });
});
