/**
 * Balances API module.
 */

import { apiClient } from "./client";
import { GroupBalanceResponse } from "../types/models";

export async function getGroupBalances(groupId: string): Promise<GroupBalanceResponse> {
  const response = await apiClient.get<GroupBalanceResponse>(`/groups/${groupId}/balances`);
  return response.data;
}
