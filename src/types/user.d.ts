export interface UserType {
  id: string;
  username: string;
  email: string;
  role: "admin" | "teacher" | "student";

  createdAt?: string;
  updatedAt?: string;
}
