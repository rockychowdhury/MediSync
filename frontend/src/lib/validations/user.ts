import { z } from "zod";
import { type UserRole, type UserStatus } from "@/types/user";

export const userCreateSchema = z.object({
  full_name: z.string().min(2, "Name must be at least 2 characters."),
  email: z.string().email("Please enter a valid email address."),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters.")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter.")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter.")
    .regex(/[0-9]/, "Password must contain at least one number.")
    .regex(/[\W_]/, "Password must contain at least one special character."),
  role: z.enum(["admin", "receptionist", "provider"], {
    message: "Please select a valid role.",
  }),
});

export type UserCreateFormData = z.infer<typeof userCreateSchema>;

export const userUpdateSchema = z.object({
  full_name: z.string().min(2, "Name must be at least 2 characters.").optional(),
  email: z.string().email("Please enter a valid email address.").optional(),
  role: z.enum(["admin", "receptionist", "provider"]).optional(),
});

export type UserUpdateFormData = z.infer<typeof userUpdateSchema>;
