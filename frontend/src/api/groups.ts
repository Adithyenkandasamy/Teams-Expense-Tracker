/**
 * Groups API module.
 */

import { apiClient } from "./client";
import { Group, GroupMember } from "../types/models";
import { CreateGroupPayload, JoinGroupPayload } from "../types/api";

export async function getGroups(): Promise<Group[]> {
  const response = await apiClient.get<Group[]>("/groups");
  return response.data;
}

export async function getGroupDetail(groupId: string): Promise<Group> {
  const response = await apiClient.get<Group>(`/groups/${groupId}`);
  return response.data;
}

export async function createGroup(data: CreateGroupPayload): Promise<Group> {
  const response = await apiClient.post<Group>("/groups", data);
  return response.data;
}

export async function joinGroup(data: JoinGroupPayload): Promise<GroupMember> {
  const response = await apiClient.post<GroupMember>("/groups/join", data);
  return response.data;
}

export async function getGroupMembers(groupId: string): Promise<GroupMember[]> {
  const response = await apiClient.get<GroupMember[]>(`/groups/${groupId}/members`);
  return response.data;
}
