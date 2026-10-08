/**
 * Auth API module.
 */

import { apiClient } from "./client";
import { User } from "../types/models";

export async function getMe(): Promise<User> {
  const response = await apiClient.get<User>("/auth/me");
  return response.data;
}
