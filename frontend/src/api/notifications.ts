/**
 * Notifications API module.
 */

import { apiClient } from "./client";
import { DeviceTokenPayload } from "../types/api";

export async function registerDeviceToken(data: DeviceTokenPayload): Promise<{ status: string }> {
  const response = await apiClient.post<{ status: string }>("/notifications/device-token", data);
  return response.data;
}
