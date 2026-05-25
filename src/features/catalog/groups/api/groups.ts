import { api } from '@/shared/lib/axios';
import type { ApiResponse } from '@/shared/types';
import type { ApiGroup } from '@/shared/types/api';
import type { GroupName } from '@/config/constants';

interface GroupListResponse {
  groups: ApiGroup[];
}
interface GroupSingleResponse {
  group: ApiGroup;
}

export async function fetchGroups(): Promise<ApiGroup[]> {
  const { data } = await api.get<ApiResponse<GroupListResponse>>('/group-size/group-all');
  return data.data?.groups ?? [];
}

export async function fetchGroup(id: string): Promise<ApiGroup> {
  const { data } = await api.get<ApiResponse<GroupSingleResponse>>(`/group-size/group/${id}`);
  return data.data.group;
}

export async function createGroup(payload: { name: GroupName }): Promise<ApiGroup> {
  const { data } = await api.post<ApiResponse<GroupSingleResponse>>(
    '/group-size/group',
    payload
  );
  return data.data.group;
}

export async function updateGroup(
  id: string,
  payload: { name: GroupName }
): Promise<ApiGroup> {
  const { data } = await api.patch<ApiResponse<GroupSingleResponse>>(
    `/group-size/update-group/${id}`,
    payload
  );
  return data.data.group;
}
