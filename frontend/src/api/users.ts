/**
 * Users API module.
 */

import { apiClient } from "./client";
import { User } from "../types/models";
import { UpdateUserPayload } from "../types/api";

export async function getUserProfile(): Promise<User> {
  const response = await apiClient.get<User>("/users/me");
  return response.data;
}

export async function updateUserProfile(data: UpdateUserPayload): Promise<User> {
  const response = await apiClient.patch<User>("/users/me", data);
  return response.data;
}
