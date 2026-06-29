import {
  LoginRequest,
  SignupRequest,
  LoginResponse,
  User,
  UpdateProfileRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  FolderTree,
  FolderContents,
  Folder,
  PresignRequest,
  PresignResponse,
  VideoDetail,
  Video,
  AnalysisType,
  AnalysisRun,
  AnalysisRunWithPoints,
  ProcessVideoRequest,
  ReportRow,
  FlyRunResult,
  VerticalLeapRun,
  VerticalLeapResult,
  HorizontalJumpRun,
  HorizontalJumpResult,
  StepLengthRun,
  StepLengthResult,
  LateralShuffleRun,
  LateralShuffleResult,
  Organisation,
  OrgGroup,
  UserProfile,
  Member,
  OrgStats,
  MemberStats,
  UpdateUserProfileRequest,
  UpdateMemberRequest,
  ProfileImagePresignResponse,
  CreateGroupRequest,
  UpdateGroupRequest,
  Role,
  Invitation,
  CreateInvitationRequest,
  CreateInvitationResponse,
  AdminUpdateUserRequest,
  AcceptInviteRequest,
  InviteInfo,
  CreateRoleRequest,
  UpdateRoleRequest,
  CreateMemberRequest,
} from "../types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "ApiError";
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ error: "An error occurred" }));
    throw new ApiError(response.status, error.error || "An error occurred");
  }
  return response.json();
}

function authHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

// ── Transform helpers ─────────────────────────────────────────────────────────
// The backend returns unified AnalysisRun with typed result inside result.result_data.
// These helpers spread result_data to the top level of the run so existing pages
// continue to access fields like run.jump_height_cm, run.max_speed_ms, run.data_points
// without any changes.

function flattenRun<T>(run: AnalysisRun): AnalysisRun & T {
  const resultData = (run.result?.result_data ?? {}) as T;
  return { ...run, ...resultData };
}

function flattenFlyRun(run: AnalysisRun): AnalysisRunWithPoints {
  const resultData = (run.result?.result_data ?? {}) as FlyRunResult;
  return {
    ...run,
    max_speed_ms:  resultData.max_speed_ms  ?? 0,
    min_speed_ms:  resultData.min_speed_ms  ?? 0,
    avg_speed_ms:  resultData.avg_speed_ms  ?? 0,
    max_speed_kmh: resultData.max_speed_kmh ?? 0,
    min_speed_kmh: resultData.min_speed_kmh ?? 0,
    avg_speed_kmh: resultData.avg_speed_kmh ?? 0,
    data_points:   resultData.data_points   ?? [],
  };
}

export const api = {
  // ── Auth ──────────────────────────────────────────────────────────────────

  async signup(data: SignupRequest): Promise<LoginResponse> {
    const response = await fetch(`${API_URL}/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return handleResponse<LoginResponse>(response);
  },

  async login(data: LoginRequest): Promise<LoginResponse> {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return handleResponse<LoginResponse>(response);
  },

  async forgotPassword(data: ForgotPasswordRequest): Promise<{ message: string }> {
    const response = await fetch(`${API_URL}/auth/forgot-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return handleResponse<{ message: string }>(response);
  },

  async resetPassword(data: ResetPasswordRequest): Promise<{ message: string }> {
    const response = await fetch(`${API_URL}/auth/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return handleResponse<{ message: string }>(response);
  },

  /** Validates an invite token (public — no auth needed). */
  async validateInvite(token: string): Promise<InviteInfo> {
    const response = await fetch(
      `${API_URL}/auth/invite?token=${encodeURIComponent(token)}`
    );
    return handleResponse<InviteInfo>(response);
  },

  /** Accepts an invitation and activates the account. */
  async acceptInvite(data: AcceptInviteRequest): Promise<LoginResponse> {
    const response = await fetch(`${API_URL}/auth/accept-invite`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return handleResponse<LoginResponse>(response);
  },

  // ── Profile ───────────────────────────────────────────────────────────────

  async getProfile(token: string): Promise<User> {
    const response = await fetch(`${API_URL}/profile`, {
      headers: authHeaders(token),
    });
    return handleResponse<User>(response);
  },

  async updateProfile(token: string, data: UpdateProfileRequest): Promise<User> {
    const response = await fetch(`${API_URL}/profile`, {
      method: "PATCH",
      headers: authHeaders(token),
      body: JSON.stringify(data),
    });
    return handleResponse<User>(response);
  },

  async presignUserProfileImage(
    token: string,
    data: { content_type: string; filename: string }
  ): Promise<ProfileImagePresignResponse> {
    const response = await fetch(`${API_URL}/profile/image/presign`, {
      method: "POST",
      headers: authHeaders(token),
      body: JSON.stringify(data),
    });
    return handleResponse<ProfileImagePresignResponse>(response);
  },

  // ── S3 direct upload ──────────────────────────────────────────────────────

  async uploadToS3(
    presignedUrl: string,
    file: File,
    onProgress?: (pct: number) => void
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("PUT", presignedUrl, true);
      xhr.setRequestHeader("Content-Type", file.type);
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable && onProgress) {
          onProgress(Math.round((e.loaded / e.total) * 100));
        }
      };
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) resolve();
        else reject(new Error(`S3 upload failed: ${xhr.status}`));
      };
      xhr.onerror = () => reject(new Error("S3 upload network error"));
      xhr.send(file);
    });
  },

  // ── Folders ───────────────────────────────────────────────────────────────

  async getFolders(token: string): Promise<FolderTree> {
    const response = await fetch(`${API_URL}/folders`, {
      headers: authHeaders(token),
    });
    return handleResponse<FolderTree>(response);
  },

  async getFolderContents(
    token: string,
    folderId: number | "root"
  ): Promise<FolderContents> {
    const response = await fetch(`${API_URL}/folders/${folderId}/contents`, {
      headers: authHeaders(token),
    });
    return handleResponse<FolderContents>(response);
  },

  async createFolder(
    token: string,
    data: { name: string; parent_id: number | null }
  ): Promise<Folder> {
    const response = await fetch(`${API_URL}/folders`, {
      method: "POST",
      headers: authHeaders(token),
      body: JSON.stringify(data),
    });
    return handleResponse<Folder>(response);
  },

  async renameFolder(
    token: string,
    id: number,
    name: string
  ): Promise<{ message: string }> {
    const response = await fetch(`${API_URL}/folders/${id}/rename`, {
      method: "PATCH",
      headers: authHeaders(token),
      body: JSON.stringify({ name }),
    });
    return handleResponse<{ message: string }>(response);
  },

  async moveFolder(
    token: string,
    id: number,
    newParentId: number | null
  ): Promise<{ message: string }> {
    const response = await fetch(`${API_URL}/folders/${id}/move`, {
      method: "PATCH",
      headers: authHeaders(token),
      body: JSON.stringify({ new_parent_id: newParentId }),
    });
    return handleResponse<{ message: string }>(response);
  },

  async deleteFolder(token: string, id: number): Promise<{ message: string }> {
    const response = await fetch(`${API_URL}/folders/${id}`, {
      method: "DELETE",
      headers: authHeaders(token),
    });
    return handleResponse<{ message: string }>(response);
  },

  // ── Videos ────────────────────────────────────────────────────────────────

  async presignUpload(
    token: string,
    data: PresignRequest
  ): Promise<PresignResponse> {
    const response = await fetch(`${API_URL}/videos/presign`, {
      method: "POST",
      headers: authHeaders(token),
      body: JSON.stringify(data),
    });
    return handleResponse<PresignResponse>(response);
  },

  async getAllVideos(token: string): Promise<{ videos: Video[] }> {
    const response = await fetch(`${API_URL}/videos`, {
      headers: authHeaders(token),
    });
    return handleResponse<{ videos: Video[] }>(response);
  },

  async getVideo(token: string, id: number): Promise<VideoDetail> {
    const response = await fetch(`${API_URL}/videos/${id}`, {
      headers: authHeaders(token),
    });
    return handleResponse<VideoDetail>(response);
  },

  async renameVideo(
    token: string,
    id: number,
    name: string
  ): Promise<{ message: string }> {
    const response = await fetch(`${API_URL}/videos/${id}/rename`, {
      method: "PATCH",
      headers: authHeaders(token),
      body: JSON.stringify({ name }),
    });
    return handleResponse<{ message: string }>(response);
  },

  async moveVideo(
    token: string,
    id: number,
    folderId: number | null
  ): Promise<{ message: string }> {
    const response = await fetch(`${API_URL}/videos/${id}/move`, {
      method: "PATCH",
      headers: authHeaders(token),
      body: JSON.stringify({ folder_id: folderId }),
    });
    return handleResponse<{ message: string }>(response);
  },

  async deleteVideo(token: string, id: number): Promise<{ message: string }> {
    const response = await fetch(`${API_URL}/videos/${id}`, {
      method: "DELETE",
      headers: authHeaders(token),
    });
    return handleResponse<{ message: string }>(response);
  },

  // ── Analysis — trigger ────────────────────────────────────────────────────
  // fly-run, horizontal-jump, step-length, and lateral-shuffle all go through
  // POST /videos/:id/process. vertical-leap has its own endpoint (needs height_cm).

  async processVideo(
    token: string,
    videoId: number,
    data: ProcessVideoRequest
  ): Promise<{ message: string; run: AnalysisRun }> {
    const response = await fetch(`${API_URL}/videos/${videoId}/process`, {
      method: "POST",
      headers: authHeaders(token),
      body: JSON.stringify(data),
    });
    return handleResponse<{ message: string; run: AnalysisRun }>(response);
  },

  async processVerticalLeap(
    token: string,
    videoId: number,
    heightCm: number
  ): Promise<{ message: string; run: VerticalLeapRun }> {
    const response = await fetch(
      `${API_URL}/videos/${videoId}/process-vertical-leap`,
      {
        method: "POST",
        headers: authHeaders(token),
        body: JSON.stringify({ analysis_type: "vertical-leap", height_cm: heightCm }),
      }
    );
    const data = await handleResponse<{ message: string; run: AnalysisRun }>(response);
    return { ...data, run: flattenRun<VerticalLeapResult>(data.run) };
  },

  /** @deprecated Use processVideo({ analysis_type: "horizontal-jump" }). */
  async processHorizontalJump(
    token: string,
    videoId: number
  ): Promise<{ message: string; run: HorizontalJumpRun }> {
    const data = await this.processVideo(token, videoId, {
      analysis_type: "horizontal-jump",
    });
    return { ...data, run: flattenRun<HorizontalJumpResult>(data.run) };
  },

  /** @deprecated Use processVideo({ analysis_type: "step-length" }). */
  async processStepLength(
    token: string,
    videoId: number
  ): Promise<{ message: string; run: StepLengthRun }> {
    const data = await this.processVideo(token, videoId, {
      analysis_type: "step-length",
    });
    return { ...data, run: flattenRun<StepLengthResult>(data.run) };
  },

  /** @deprecated Use processVideo({ analysis_type: "lateral-shuffle" }). */
  async processLateralShuffle(
    token: string,
    videoId: number
  ): Promise<{ message: string; run: LateralShuffleRun }> {
    const data = await this.processVideo(token, videoId, {
      analysis_type: "lateral-shuffle",
    });
    return { ...data, run: flattenRun<LateralShuffleResult>(data.run) };
  },

  // ── Analysis — fetch ──────────────────────────────────────────────────────

  /**
   * Returns the latest completed run for a video + type.
   * Unified endpoint: GET /videos/:id/analysis/latest?type=...
   */
  async getLatestAnalysis(
    token: string,
    videoId: number,
    type: AnalysisType
  ): Promise<AnalysisRunWithPoints> {
    const response = await fetch(
      `${API_URL}/videos/${videoId}/analysis/latest?type=${type}`,
      { headers: authHeaders(token) }
    );
    const run = await handleResponse<AnalysisRun>(response);
    return flattenFlyRun(run);
  },

  async getAllAnalysisRuns(
    token: string,
    videoId: number
  ): Promise<AnalysisRun[]> {
    const response = await fetch(`${API_URL}/videos/${videoId}/analysis`, {
      headers: authHeaders(token),
    });
    const runs = await handleResponse<AnalysisRun[]>(response);
    return runs ?? [];
  },

  /**
   * Returns a specific run with result_data flattened to the top level.
   * For fly-run, result_data also includes data_points.
   */
  async getAnalysisRun(
    token: string,
    runId: number
  ): Promise<AnalysisRunWithPoints> {
    const response = await fetch(`${API_URL}/analysis/runs/${runId}`, {
      headers: authHeaders(token),
    });
    const run = await handleResponse<AnalysisRun>(response);
    return flattenFlyRun(run);
  },

  // Legacy type-specific GET latest — backend still serves these via alias routes.
  // All return flattened flat fields for backward compat with existing pages.

  async getLatestVerticalLeap(
    token: string,
    videoId: number
  ): Promise<VerticalLeapRun> {
    const response = await fetch(
      `${API_URL}/videos/${videoId}/vertical-leap/latest`,
      { headers: authHeaders(token) }
    );
    const run = await handleResponse<AnalysisRun>(response);
    return flattenRun<VerticalLeapResult>(run);
  },

  async getLatestHorizontalJump(
    token: string,
    videoId: number
  ): Promise<HorizontalJumpRun> {
    const response = await fetch(
      `${API_URL}/videos/${videoId}/horizontal-jump/latest`,
      { headers: authHeaders(token) }
    );
    const run = await handleResponse<AnalysisRun>(response);
    return flattenRun<HorizontalJumpResult>(run);
  },

  async getLatestStepLength(
    token: string,
    videoId: number
  ): Promise<StepLengthRun> {
    const response = await fetch(
      `${API_URL}/videos/${videoId}/step-length/latest`,
      { headers: authHeaders(token) }
    );
    const run = await handleResponse<AnalysisRun>(response);
    return flattenRun<StepLengthResult>(run);
  },

  async getLatestLateralShuffle(
    token: string,
    videoId: number
  ): Promise<LateralShuffleRun> {
    const response = await fetch(
      `${API_URL}/videos/${videoId}/lateral-shuffle/latest`,
      { headers: authHeaders(token) }
    );
    const run = await handleResponse<AnalysisRun>(response);
    return flattenRun<LateralShuffleResult>(run);
  },

  /** @deprecated Use getAnalysisRun(). All run types now share GET /analysis/runs/:id. */
  async getVerticalLeapRun(token: string, runId: number): Promise<VerticalLeapRun> {
    const run = await this.getAnalysisRun(token, runId);
    return flattenRun<VerticalLeapResult>(run);
  },

  /** @deprecated Use getAnalysisRun(). */
  async getHorizontalJumpRun(token: string, runId: number): Promise<HorizontalJumpRun> {
    const run = await this.getAnalysisRun(token, runId);
    return flattenRun<HorizontalJumpResult>(run);
  },

  /** @deprecated Use getAnalysisRun(). */
  async getStepLengthRun(token: string, runId: number): Promise<StepLengthRun> {
    const run = await this.getAnalysisRun(token, runId);
    return flattenRun<StepLengthResult>(run);
  },

  /** @deprecated Use getAnalysisRun(). */
  async getLateralShuffleRun(token: string, runId: number): Promise<LateralShuffleRun> {
    const run = await this.getAnalysisRun(token, runId);
    return flattenRun<LateralShuffleResult>(run);
  },

  // ── Reports ───────────────────────────────────────────────────────────────

  /** Returns ReportRow[] directly (not wrapped). */
  async getReports(token: string): Promise<ReportRow[]> {
    const response = await fetch(`${API_URL}/reports`, {
      headers: authHeaders(token),
    });
    const data = await handleResponse<ReportRow[]>(response);
    return data ?? [];
  },

  // ── Team — Organisation ───────────────────────────────────────────────────

  /** All authenticated users can GET their org. */
  async getOrganisation(token: string): Promise<Organisation> {
    const response = await fetch(`${API_URL}/teams/organisation`, {
      headers: authHeaders(token),
    });
    return handleResponse<Organisation>(response);
  },

  /** Admin only — updates organisation name. */
  async updateOrganisation(token: string, name: string): Promise<Organisation> {
    const response = await fetch(`${API_URL}/admin/organisation`, {
      method: "PATCH",
      headers: authHeaders(token),
      body: JSON.stringify({ name }),
    });
    return handleResponse<Organisation>(response);
  },

  // ── Team — Groups ─────────────────────────────────────────────────────────

  /** All authenticated users can list groups. */
  async getGroups(token: string): Promise<OrgGroup[]> {
    const response = await fetch(`${API_URL}/teams/groups`, {
      headers: authHeaders(token),
    });
    return handleResponse<OrgGroup[]>(response);
  },

  /** Admin only. */
  async createGroup(
    token: string,
    data: CreateGroupRequest
  ): Promise<OrgGroup> {
    const response = await fetch(`${API_URL}/admin/groups`, {
      method: "POST",
      headers: authHeaders(token),
      body: JSON.stringify(data),
    });
    return handleResponse<OrgGroup>(response);
  },

  /** Admin only. */
  async updateGroup(
    token: string,
    id: number,
    data: UpdateGroupRequest
  ): Promise<OrgGroup> {
    const response = await fetch(`${API_URL}/admin/groups/${id}`, {
      method: "PATCH",
      headers: authHeaders(token),
      body: JSON.stringify(data),
    });
    return handleResponse<OrgGroup>(response);
  },

  /** Admin only. */
  async deleteGroup(token: string, id: number): Promise<{ message: string }> {
    const response = await fetch(`${API_URL}/admin/groups/${id}`, {
      method: "DELETE",
      headers: authHeaders(token),
    });
    return handleResponse<{ message: string }>(response);
  },

  // ── Team — User Profiles (replaces Members) ───────────────────────────────

  /**
   * Get all user profiles in the org.
   * Optional filters: role (role name), group_id.
   */
  async getOrgProfiles(
    token: string,
    filters?: { role?: string; group_id?: number }
  ): Promise<UserProfile[]> {
    const params = new URLSearchParams();
    if (filters?.role) params.set("role", filters.role);
    if (filters?.group_id) params.set("group_id", String(filters.group_id));
    const qs = params.toString();
    const response = await fetch(
      `${API_URL}/teams/profiles${qs ? `?${qs}` : ""}`,
      { headers: authHeaders(token) }
    );
    const data = await handleResponse<UserProfile[]>(response);
    return data ?? [];
  },

  /** @deprecated Use getOrgProfiles(). Kept for backward compat with org pages. */
  async getMembers(
    token: string,
    filters?: { type?: string; group_id?: number }
  ): Promise<Member[]> {
    return this.getOrgProfiles(token, {
      role: filters?.type,
      group_id: filters?.group_id,
    });
  },

  /** Get a single user's sports profile. */
  async getUserProfile(token: string, userId: number): Promise<UserProfile> {
    const response = await fetch(`${API_URL}/teams/profiles/${userId}`, {
      headers: authHeaders(token),
    });
    return handleResponse<UserProfile>(response);
  },

  /** @deprecated Use getUserProfile(). */
  async getMember(token: string, id: number): Promise<Member> {
    return this.getUserProfile(token, id);
  },

  /**
   * Update sports profile data (physical metrics, sports, etc.).
   * Admins can update any user; members can only update their own.
   * To change name/role/status, use adminUpdateUser().
   */
  async updateUserProfile(
    token: string,
    userId: number,
    data: UpdateUserProfileRequest
  ): Promise<UserProfile> {
    const response = await fetch(`${API_URL}/teams/profiles/${userId}`, {
      method: "PATCH",
      headers: authHeaders(token),
      body: JSON.stringify(data),
    });
    return handleResponse<UserProfile>(response);
  },

  /** @deprecated Use updateUserProfile(). */
  async updateMember(
    token: string,
    id: number,
    data: UpdateMemberRequest
  ): Promise<Member> {
    return this.updateUserProfile(token, id, data);
  },

  /** Presign URL for uploading a user's sports-profile photo. */
  async presignProfileImage(
    token: string,
    userId: number,
    data: { content_type: string; filename: string }
  ): Promise<ProfileImagePresignResponse> {
    const response = await fetch(
      `${API_URL}/teams/profiles/${userId}/image/presign`,
      {
        method: "POST",
        headers: authHeaders(token),
        body: JSON.stringify(data),
      }
    );
    return handleResponse<ProfileImagePresignResponse>(response);
  },

  /** @deprecated Use presignProfileImage(). */
  async presignMemberProfileImage(
    token: string,
    memberId: number,
    data: { content_type: string; filename: string }
  ): Promise<ProfileImagePresignResponse> {
    return this.presignProfileImage(token, memberId, data);
  },

  // ── Team — Group assignments ──────────────────────────────────────────────

  async addUserToGroup(
    token: string,
    userId: number,
    groupId: number
  ): Promise<{ message: string }> {
    const response = await fetch(
      `${API_URL}/teams/users/${userId}/groups/${groupId}`,
      { method: "POST", headers: authHeaders(token) }
    );
    return handleResponse<{ message: string }>(response);
  },

  /** @deprecated Use addUserToGroup(). */
  async addMemberToGroup(
    token: string,
    memberId: number,
    groupId: number
  ): Promise<{ message: string }> {
    return this.addUserToGroup(token, memberId, groupId);
  },

  async removeUserFromGroup(
    token: string,
    userId: number,
    groupId: number
  ): Promise<{ message: string }> {
    const response = await fetch(
      `${API_URL}/teams/users/${userId}/groups/${groupId}`,
      { method: "DELETE", headers: authHeaders(token) }
    );
    return handleResponse<{ message: string }>(response);
  },

  /** @deprecated Use removeUserFromGroup(). */
  async removeMemberFromGroup(
    token: string,
    memberId: number,
    groupId: number
  ): Promise<{ message: string }> {
    return this.removeUserFromGroup(token, memberId, groupId);
  },

  // ── Team — Stats & Reference ──────────────────────────────────────────────

  async getOrgStats(token: string): Promise<OrgStats> {
    const response = await fetch(`${API_URL}/teams/stats`, {
      headers: authHeaders(token),
    });
    return handleResponse<OrgStats>(response);
  },

  /** @deprecated Use getOrgStats(). */
  async getMemberStats(token: string): Promise<MemberStats> {
    const stats = await this.getOrgStats(token);
    // by_role keys are display names like "Health Staff"; normalize to slugs like "health_staff"
    // so existing pages that do stats?.by_type?.["health_staff"] keep working.
    const byType: Record<string, number> = {};
    for (const [roleName, count] of Object.entries(stats.by_role)) {
      const slug = roleName.toLowerCase().replace(/\s+/g, "_");
      byType[slug] = (byType[slug] ?? 0) + count;
    }
    return {
      ...stats,
      total: stats.total_users,
      by_type: byType,
    } as MemberStats;
  },

  async getSports(token: string): Promise<{ sports: string[] }> {
    const response = await fetch(`${API_URL}/teams/sports`, {
      headers: authHeaders(token),
    });
    return handleResponse<{ sports: string[] }>(response);
  },

  // ── Admin — Users ─────────────────────────────────────────────────────────

  async getOrgUsers(token: string): Promise<User[]> {
    const response = await fetch(`${API_URL}/admin/users`, {
      headers: authHeaders(token),
    });
    const data = await handleResponse<User[]>(response);
    return data ?? [];
  },

  async getOrgUser(token: string, userId: number): Promise<User> {
    const response = await fetch(`${API_URL}/admin/users/${userId}`, {
      headers: authHeaders(token),
    });
    return handleResponse<User>(response);
  },

  async adminUpdateUser(
    token: string,
    userId: number,
    data: AdminUpdateUserRequest
  ): Promise<User> {
    const response = await fetch(`${API_URL}/admin/users/${userId}`, {
      method: "PATCH",
      headers: authHeaders(token),
      body: JSON.stringify(data),
    });
    return handleResponse<User>(response);
  },

  async deleteOrgUser(token: string, userId: number): Promise<{ message: string }> {
    const response = await fetch(`${API_URL}/admin/users/${userId}`, {
      method: "DELETE",
      headers: authHeaders(token),
    });
    return handleResponse<{ message: string }>(response);
  },

  // ── Admin — Roles ─────────────────────────────────────────────────────────

  async getRoles(token: string): Promise<Role[]> {
    const response = await fetch(`${API_URL}/admin/roles`, {
      headers: authHeaders(token),
    });
    const data = await handleResponse<Role[]>(response);
    return data ?? [];
  },

  async createRole(token: string, data: CreateRoleRequest): Promise<Role> {
    const response = await fetch(`${API_URL}/admin/roles`, {
      method: "POST",
      headers: authHeaders(token),
      body: JSON.stringify(data),
    });
    return handleResponse<Role>(response);
  },

  async updateRole(
    token: string,
    id: number,
    data: UpdateRoleRequest
  ): Promise<Role> {
    const response = await fetch(`${API_URL}/admin/roles/${id}`, {
      method: "PATCH",
      headers: authHeaders(token),
      body: JSON.stringify(data),
    });
    return handleResponse<Role>(response);
  },

  async deleteRole(token: string, id: number): Promise<{ message: string }> {
    const response = await fetch(`${API_URL}/admin/roles/${id}`, {
      method: "DELETE",
      headers: authHeaders(token),
    });
    return handleResponse<{ message: string }>(response);
  },

  // ── Admin — Invitations ───────────────────────────────────────────────────

  async getInvitations(token: string): Promise<Invitation[]> {
    const response = await fetch(`${API_URL}/admin/invitations`, {
      headers: authHeaders(token),
    });
    const data = await handleResponse<Invitation[]>(response);
    return data ?? [];
  },

  async createInvitation(
    token: string,
    data: CreateInvitationRequest
  ): Promise<CreateInvitationResponse> {
    const response = await fetch(`${API_URL}/admin/invitations`, {
      method: "POST",
      headers: authHeaders(token),
      body: JSON.stringify(data),
    });
    return handleResponse<CreateInvitationResponse>(response);
  },

  async revokeInvitation(
    token: string,
    id: number
  ): Promise<{ message: string }> {
    const response = await fetch(`${API_URL}/admin/invitations/${id}`, {
      method: "DELETE",
      headers: authHeaders(token),
    });
    return handleResponse<{ message: string }>(response);
  },

  // ── Deprecated bridges (add-member → invite flow) ─────────────────────────

  /**
   * @deprecated Use createInvitation().
   * Adding a member now sends an email invitation — the member sets their own
   * password when they accept. Physical profile data (sports, measurements)
   * can be updated via updateUserProfile() after they join.
   */
  async createMember(
    token: string,
    data: CreateMemberRequest
  ): Promise<CreateInvitationResponse> {
    return this.createInvitation(token, {
      name: data.name,
      email: data.email,
      role_id: data.role_id,
    });
  },

  /**
   * @deprecated Use deleteOrgUser().
   * Note: pass member.user_id (the user account ID), NOT member.id (the
   * profile row ID) — they are different columns.
   */
  async deleteMember(
    token: string,
    userId: number
  ): Promise<{ message: string }> {
    return this.deleteOrgUser(token, userId);
  },
};