export interface User {
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  password: string;
}

export interface Funds {
  user_id: number;
  amount: number;
}

export interface Transfer {
  user_id: number;
  receiver_email: string;
  amount: number;
}
