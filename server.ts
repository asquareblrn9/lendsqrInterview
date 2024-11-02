require("dotenv").config();
import express, { Request, Response } from "express";
const app = express();

import UserServices from "./Services/UserServices";
import getErrorMessage from "./utils";

app.use(express.json());

const port = process.env.PORT;

//creating user
app.post("/createuser", async (req: Request, res: Response) => {
  // Extract user details from the request body
  const { username, email, first_name, last_name, password } = req.body;

  try {
    // Pass user details to the UserService to create a user
    await UserServices.createUser({
      username,
      email,
      first_name,
      last_name,
      password,
    });
    res.status(201).send({ message: "User created successfully" });
  } catch (error) {
    console.log(error);
    const errorMessage = getErrorMessage(error);
    res.status(400).send({ error: errorMessage });
  }
});

//funding of user's account
app.put("/fundAccount", async (req: Request, res: Response) => {
  const { user_id, amount } = req.body;
  try {
    await UserServices.fundUserAccount({
      user_id,
      amount,
    });
    res.status(201).send({ message: `Account funded with #${amount}` });
  } catch (error) {
    console.log(error);
    const errorMessage = getErrorMessage(error);
    res.status(400).send({ error: errorMessage });
  }
});

app.post("/fundTransfer", async (req: Request, res: Response) => {
  const { user_id, receiver_email, amount } = req.body;
  try {
    await UserServices.fundTransfer({
      user_id,
      receiver_email,
      amount,
    });
    res
      .status(201)
      .send({ message: `You transfered #${amount} to ${receiver_email}` });
  } catch (error) {
    console.log(error);
    const errorMessage = getErrorMessage(error);
    res.status(400).send({ error: errorMessage });
  }
});

app.post("/withdraw", async (req: Request, res: Response) => {
  const { user_id, amount } = req.body;
  try {
    await UserServices.withdrawFund({ user_id, amount });
    res.status(200).send({ message: `#${amount} withdrawn successfully` });
  } catch (error) {
    console.log(error);
    const errorMessage = getErrorMessage(error);
    res.status(400).send({ error: errorMessage });
  }
});

app.listen(port, () => {
  console.log(`app connected on ${port}`);
});
