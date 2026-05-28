import { api } from '@/shared/lib/axios';
import type { ApiResponse } from '@/shared/types';
import type { ApiGroup } from '@/shared/types/api';

interface GroupListResponse {
  groupSizes: ApiGroup[];
}
interface GroupSingleResponse {
  groupSize: ApiGroup;
}

export async function fetchGroups(): Promise<ApiGroup[]> {
  const { data } = await api.get<ApiResponse<GroupListResponse>>('/group-size/group-all');
  return data.data?.groupSizes ?? [];
}

export async function fetchGroup(id: string): Promise<ApiGroup> {
  const { data } = await api.get<ApiResponse<GroupSingleResponse>>(`/group-size/group/${id}`);
  return data.data.groupSize;
}

export async function createGroup(payload: { name: string }): Promise<ApiGroup> {
  const { data } = await api.post<ApiResponse<GroupSingleResponse>>(
    '/group-size/group',
    payload
  );
  return data.data.groupSize;
}

export async function updateGroup(
  id: string,
  payload: { name: string }
): Promise<ApiGroup> {
  const { data } = await api.patch<ApiResponse<GroupSingleResponse>>(
    `/group-size/update-group/${id}`,
    payload
  );
  return data.data.groupSize;
}
