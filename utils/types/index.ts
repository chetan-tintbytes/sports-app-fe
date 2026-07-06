// ── Auth ──────────────────────────────────────────────────────────────────────

export type UserStatus = "active" | "invited" | "inactive";

export interface User {
  id: number;
  email: string;
  name: string;
  profile_image_key: string;
  profile_image_url?: string;
  /** Every account created via /auth/signup is an admin. */
  is_admin: boolean;
  /** null for admin accounts; set by admin when inviting */
  role_id?: number | null;
  role_name?: string;
  organisation_id?: number | null;
  status: UserStatus;
  created_at: string;
  updated_at: string;
}

export interface UpdateProfileRequest {
  name?: string;
  profile_image_key?: string;
}

export interface ProfileImagePresignResponse {
  upload_url: string;
  key: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupRequest {
  email: string;
  password: string;
  name: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface ErrorResponse {
  error: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  password: string;
}

// ── Roles ──────────────────────────────────────────────────────────────────────

export interface Role {
  id: number;
  name: string;
  /** false = predefined (read-only), true = admin-created (editable/deletable) */
  is_custom: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateRoleRequest {
  name: string;
}

export interface UpdateRoleRequest {
  name: string;
}

// ── Invitations ────────────────────────────────────────────────────────────────

export interface Invitation {
  id: number;
  email: string;
  name: string;
  role_id: number;
  role_name?: string;
  organisation_id: number;
  invited_by_id: number;
  /** Included in create response so admin can share manually */
  token?: string;
  expires_at: string;
  accepted_at?: string | null;
  created_at: string;
  updated_at: string;
}

/** How a new member account is provisioned. */
export type ProvisionMode = "invite" | "credentials";

export interface CreateInvitationRequest {
  email: string;
  name: string;
  role_id: number;
  /** "invite" (default) emails a link; "credentials" sets a password now. */
  mode?: ProvisionMode;
  /** Used only when mode === "credentials". If omitted, the server generates one. */
  password?: string;
  /** Profile details captured at creation time (measurements, sports, etc.). */
  profile?: UpdateUserProfileRequest;
  /** Optional group to assign the new member to. */
  group_id?: number | null;
}

/**
 * @deprecated The add-member flow is now invitation-based.
 * Maps to CreateInvitationRequest — member_type has been replaced by role_id.
 */
export interface CreateMemberRequest {
  name: string;
  email: string;
  role_id: number;
}

export interface CreateInvitationResponse {
  /** Which flow produced this response. */
  mode?: ProvisionMode;
  role: Role;
  // ── invite mode ──
  invitation?: Invitation;
  invite_link?: string;
  email_warning?: string;
  // ── credentials mode ──
  /** The newly created (active) member account. */
  user?: User;
  /** Plaintext password to share with the member. Returned once, never stored. */
  password?: string;
}

/** Generic server-side pagination envelope. */
export interface Paginated<T> {
  data: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

/** Response from the admin video download endpoint. */
export interface DownloadUrlResponse {
  download_url: string;
}

/** Response from the admin video view (inline streaming) endpoint. */
export interface ViewUrlResponse {
  view_url: string;
}

export interface AcceptInviteRequest {
  token: string;
  password: string;
}

/** Returned by GET /auth/invite?token= (public, no auth) */
export interface InviteInfo {
  email: string;
  name: string;
  role_name: string;
}

// ── Admin ──────────────────────────────────────────────────────────────────────

export interface AdminUpdateUserRequest {
  name?: string;
  email?: string;
  role_id?: number | null;
  status?: "active" | "inactive";
}

// ── Media ──────────────────────────────────────────────────────────────────────

export interface Folder {
  id: number;
  user_id: number;
  parent_id: number | null;
  name: string;
  s3_prefix: string;
  created_at: string;
  updated_at: string;
}

export interface FolderNode extends Folder {
  children: FolderNode[];
  full_path: string;
}

export interface FolderTree {
  tree: FolderNode[];
  flat: FolderNode[];
}

export interface Video {
  id: number;
  user_id: number;
  folder_id: number | null;
  filename: string;
  original_name: string;
  s3_key: string;
  size: number;
  format: string;
  content_type: string;
  uploaded_at: string;
  updated_at: string;
  /** Populated by GET /videos/:id (org-aware) */
  uploader_name?: string;
  /** Presigned inline URL for preview/thumbnail (populated by folder contents). */
  view_url?: string;
}

export interface FolderContents {
  folders: Folder[];
  videos: Video[];
}

export interface PresignRequest {
  filename: string;
  content_type: string;
  size: number;
  folder_id: number | null;
}

export interface PresignResponse {
  upload_url: string;
  s3_key: string;
  video_id: number;
}

export interface VideoDetail {
  video: Video;
  view_url: string;
}

// ── Analysis — Core ────────────────────────────────────────────────────────────

export type AnalysisType =
  | "fly-run"
  | "fly-run2"
  | "vertical-leap"
  | "horizontal-jump"
  | "horizontal-jump2"
  | "step-length"
  | "lateral-shuffle"
  | "single-leg-hop";

export type AnalysisStatus = "pending" | "processing" | "completed" | "failed";

/**
 * Unified analysis run — one row covers every analysis type.
 * Type-specific metrics live inside `result.result_data`.
 */
export interface AnalysisRun {
  id: number;
  video_id: number;
  user_id: number;
  analysis_type: AnalysisType;
  status: AnalysisStatus;
  error_message?: string;
  result?: AnalysisResultEnvelope;
  created_at: string;
  updated_at: string;
  /** Name of the user who ran the analysis (populated by GET /analysis/runs/:runId) */
  runner_name?: string;
  /** Name of the user who uploaded the video (populated by GET /analysis/runs/:runId) */
  uploader_name?: string;
}

/** The JSONB envelope stored in analysis_results. */
export interface AnalysisResultEnvelope {
  id: number;
  run_id: number;
  /** Parsed shape depends on analysis_type — see typed result interfaces below. */
  result_data:
    | FlyRunResult
    | VerticalLeapResult
    | HorizontalJumpResult
    | StepLengthResult
    | LateralShuffleResult
    | Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

// ── Analysis — Result shapes ───────────────────────────────────────────────────

export interface AnalysisDataPoint {
  id: number;
  run_id: number;
  time_sec: number;
  speed_ms: number;
  speed_kmh: number;
}

export interface FlyRunResult {
  max_speed_ms: number;
  min_speed_ms: number;
  avg_speed_ms: number;
  max_speed_kmh: number;
  min_speed_kmh: number;
  avg_speed_kmh: number;
  /** Present only on GET /analysis/runs/:id for fly-run. */
  data_points?: AnalysisDataPoint[];
}

export interface VerticalLeapResult {
  height_cm: number;
  jump_height_cm: number;
  flight_time_s: number;
}

export interface HorizontalJumpResult {
  jump_distance_cm: number;
  flight_time_s: number;
}

export interface StepLengthResult {
  step_count: number;
  avg_step_length_cm: number;
  avg_stride_length_cm: number;
  avg_cadence_steps_min: number;
}

export interface LateralShuffleResult {
  shuffle_count: number;
  shuffles_per_side_left: number;
  shuffles_per_side_right: number;
  avg_shuffle_width_cm: number;
  left_avg_width_cm: number;
  right_avg_width_cm: number;
  symmetry_pct: number;
  avg_shuffle_speed_cm_s: number;
  avg_transition_time_s: number;
  cadence_shuffles_min: number;
  active_duration_s: number;
}

// ── Analysis — Flattened backward-compat types ────────────────────────────────
// The API client merges result_data fields to the top level of each run so
// existing pages (e.g. vertical-leap page accessing run.jump_height_cm) continue
// to work without modification.

export interface AnalysisRunWithPoints extends AnalysisRun, FlyRunResult {
  /** Convenience flat access; mirrors result.result_data.data_points */
  data_points: AnalysisDataPoint[];
}

export interface VerticalLeapRun extends AnalysisRun, VerticalLeapResult {}
export interface HorizontalJumpRun extends AnalysisRun, HorizontalJumpResult {}
export interface StepLengthRun extends AnalysisRun, StepLengthResult {}
export interface LateralShuffleRun extends AnalysisRun, LateralShuffleResult {}

export interface ProcessVideoRequest {
  analysis_type: AnalysisType;
}

export interface ProcessVerticalLeapRequest {
  height_cm: number;
}

// ── Reports ────────────────────────────────────────────────────────────────────

/**
 * One row from GET /reports.
 * result_data shape depends on analysis_type — cast using the typed result
 * interfaces above (e.g. `row.result_data as FlyRunResult`).
 */
export interface ReportRow {
  run_id: number;
  video_id: number;
  original_name: string;
  analysis_type: AnalysisType;
  status: AnalysisStatus;
  result_data?: Record<string, unknown>;
  /** Name of the user who ran the analysis. */
  user_name: string;
  /** Name of the user who uploaded the video. */
  uploader_name: string;
  created_at: string;
}

// ── Organisation ───────────────────────────────────────────────────────────────

export interface Organisation {
  id: number;
  /** The admin user who owns/created this organisation. Renamed from user_id. */
  admin_user_id: number;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface OrgGroup {
  id: number;
  organisation_id: number;
  name: string;
  description: string;
  member_count: number;
  created_at: string;
  updated_at: string;
}

export interface CreateGroupRequest {
  name: string;
  description: string;
}

export interface UpdateGroupRequest {
  name?: string;
  description?: string;
}

// ── UserProfile (replaces Member) ─────────────────────────────────────────────
// Linked to a platform user account via user_id.
// Contains sports/physical data managed by the admin.

export interface UserProfile {
  id: number;
  /** FK → users.id */
  user_id: number;
  organisation_id: number;
  profile_image_key: string;
  profile_image_url?: string;
  // User-level fields (joined from users + roles by the backend)
  name: string;
  email: string;
  /** True when the user is the org admin (has no member role). */
  is_admin: boolean;
  /** Display name of the role, e.g. "Health Staff" */
  role_name: string;
  /** Snake-case slug of the role, e.g. "health_staff". Matches MemberType values. */
  member_type: MemberType;
  // Sports-profile fields
  date_of_birth: string | null;
  gender: string;
  phone_no: string;
  main_sports: string[];
  other_sports: string[];
  height: number | null;
  weight: number | null;
  arm_span: number | null;
  leg_length: number | null;
  shoe_size: number | null;
  other_metrics: Record<string, unknown>;
  groups: OrgGroup[];
  created_at: string;
  updated_at: string;
}

/** @deprecated Use UserProfile. Kept as alias for page backward compat. */
export type Member = UserProfile;

export interface UpdateUserProfileRequest {
  profile_image_key?: string;
  date_of_birth?: string | null;
  gender?: string;
  phone_no?: string;
  main_sports?: string[];
  other_sports?: string[];
  height?: number | null;
  weight?: number | null;
  arm_span?: number | null;
  leg_length?: number | null;
  shoe_size?: number | null;
  other_metrics?: Record<string, unknown>;
}

/** @deprecated Use UpdateUserProfileRequest. Kept as alias for page backward compat. */
export type UpdateMemberRequest = UpdateUserProfileRequest;

// ── Stats ──────────────────────────────────────────────────────────────────────

export interface OrgStats {
  total_users: number;
  by_role: Record<string, number>;
}

/** @deprecated Use OrgStats. Kept as alias. */
export type MemberStats = OrgStats & {
  total: number;
  by_type: Record<string, number>;
};

// ── Role / member type constants (kept for UI labels/icons) ───────────────────

export type MemberType =
  | "coach"
  | "athlete"
  | "analyst"
  | "health_staff"
  | "student"
  | "patient"
  | "player"
  | "account_admin_manager"
  | "remote_coach";

export const MEMBER_TYPE_LABELS: Record<MemberType, string> = {
  coach: "Coach",
  athlete: "Athlete",
  analyst: "Analyst",
  health_staff: "Health Staff",
  student: "Student",
  patient: "Patient",
  player: "Player",
  account_admin_manager: "Account Admin Manager",
  remote_coach: "Remote-Coach",
};

export const MEMBER_TYPE_ICONS: Record<MemberType, string> = {
  coach: "🏋️",
  athlete: "🏃",
  analyst: "📊",
  health_staff: "🏥",
  student: "🎓",
  patient: "🩺",
  player: "🎮",
  account_admin_manager: "⚙️",
  remote_coach: "📡",
};

export const ALL_MEMBER_TYPES: MemberType[] = [
  "coach",
  "athlete",
  "analyst",
  "health_staff",
  "student",
  "patient",
  "player",
  "account_admin_manager",
  "remote_coach",
];

export const PREDEFINED_SPORTS = [
  "Football",
  "Cricket",
  "Basketball",
  "Swimming",
  "Athletics",
  "Badminton",
  "Tennis",
  "Hockey",
  "Volleyball",
];

export const GENDERS = ["Male", "Female", "Non-binary", "Prefer not to say"];