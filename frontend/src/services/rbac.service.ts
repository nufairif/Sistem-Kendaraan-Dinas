import { apiRequest } from '../lib/apiClient'
import type {
  AppUser,
  AppUserInput,
  RoleDefinition,
  RoleInput,
} from '../types/bmd'

export async function listUsers(): Promise<AppUser[]> {
  return apiRequest<AppUser[]>('/users')
}

export async function createUser(input: AppUserInput): Promise<AppUser> {
  return apiRequest<AppUser>('/users', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export async function updateUser(
  id: number,
  input: AppUserInput
): Promise<AppUser> {
  return apiRequest<AppUser>(`/users/${id}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  })
}

export async function deleteUser(id: number): Promise<void> {
  await apiRequest<{ id: number }>(`/users/${id}`, {
    method: 'DELETE',
  })
}

export async function listRoles(): Promise<RoleDefinition[]> {
  return apiRequest<RoleDefinition[]>('/roles')
}

export async function createRole(input: RoleInput): Promise<RoleDefinition> {
  return apiRequest<RoleDefinition>('/roles', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export async function updateRole(
  id: number,
  input: RoleInput
): Promise<RoleDefinition> {
  return apiRequest<RoleDefinition>(`/roles/${id}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  })
}

export async function deleteRole(id: number): Promise<void> {
  await apiRequest<{ id: number }>(`/roles/${id}`, {
    method: 'DELETE',
  })
}

