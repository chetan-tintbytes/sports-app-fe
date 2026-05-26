export interface User {
  id: number;
  email: string;
  name: string;
  profile_image_key: string;
  profile_image_url?: string;
  created_at: string;
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

// ── Media ──────────────────────────────────────────────────

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

// ── Analysis ───────────────────────────────────────────────

export type AnalysisType =
  | "fly-run"
  | "vertical-leap"
  | "fly-run2"
  | "horizontal-jump"
  | "horizontal-jump2"
  | "step-length"
  | "lateral-shuffle";

export type AnalysisStatus = "pending" | "processing" | "completed" | "failed";

export interface AnalysisRun {
  id: number;
  video_id: number;
  user_id: number;
  analysis_type: AnalysisType;
  status: AnalysisStatus;
  error_message?: string;
  max_speed_ms: number;
  min_speed_ms: number;
  avg_speed_ms: number;
  max_speed_kmh: number;
  min_speed_kmh: number;
  avg_speed_kmh: number;
  created_at: string;
  updated_at: string;
}

export interface AnalysisDataPoint {
  id: number;
  run_id: number;
  time_sec: number;
  speed_ms: number;
  speed_kmh: number;
}

export interface AnalysisRunWithPoints extends AnalysisRun {
  data_points: AnalysisDataPoint[];
}

export interface ProcessVideoRequest {
  analysis_type: AnalysisType;
}

// ── Reports ────────────────────────────────────────────────

export interface ReportRow {
  run_id: number;
  video_id: number;
  original_name: string;
  report_type:
    | "fly-run"
    | "vertical-leap"
    | "horizontal-jump"
    | "horizontal-jump2"
    | "step-length"
    | "lateral-shuffle";
  height_cm?: number;
  jump_height_cm?: number;
  flight_time_s?: number;
  jump_distance_cm?: number;
  step_count?: number;
  avg_step_length_cm?: number;
  avg_stride_length_cm?: number;
  avg_cadence_steps_min?: number;
  shuffle_count?: number;
  shuffles_per_side_left?: number;
  shuffles_per_side_right?: number;
  avg_shuffle_width_cm?: number;
  left_avg_width_cm?: number;
  right_avg_width_cm?: number;
  symmetry_pct?: number;
  avg_shuffle_speed_cm_s?: number;
  avg_transition_time_s?: number;
  cadence_shuffles_min?: number;
  active_duration_s?: number;
  created_at: string;
}

// ── Vertical Leap ──────────────────────────────────────────

export interface VerticalLeapRun {
  id: number;
  video_id: number;
  user_id: number;
  status: AnalysisStatus;
  error_message?: string;
  height_cm: number;
  jump_height_cm: number;
  flight_time_s: number;
  created_at: string;
  updated_at: string;
}

export interface ProcessVerticalLeapRequest {
  height_cm: number;
}

// ── Horizontal Jump ────────────────────────────────────────

export interface HorizontalJumpRun {
  id: number;
  video_id: number;
  user_id: number;
  status: AnalysisStatus;
  error_message?: string;
  jump_distance_cm: number;
  flight_time_s: number;
  created_at: string;
  updated_at: string;
}

// ── Step Length ────────────────────────────────────────────

export interface StepLengthRun {
  id: number;
  video_id: number;
  user_id: number;
  status: AnalysisStatus;
  error_message?: string;
  step_count: number;
  avg_step_length_cm: number;
  avg_stride_length_cm: number;
  avg_cadence_steps_min: number;
  created_at: string;
  updated_at: string;
}

// ── Lateral Shuffle ────────────────────────────────────────

export interface LateralShuffleRun {
  id: number;
  video_id: number;
  user_id: number;
  status: AnalysisStatus;
  error_message?: string;
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
  created_at: string;
  updated_at: string;
}

// ── Team Management ────────────────────────────────────────

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

export interface Organisation {
  id: number;
  user_id: number;
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

export interface Member {
  id: number;
  organisation_id: number;
  member_type: MemberType;
  profile_image_key: string;
  profile_image_url?: string;
  name: string;
  email: string;
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
  other_metrics: Record<string, string>;
  groups: OrgGroup[];
  created_at: string;
  updated_at: string;
}

export interface MemberStats {
  total: number;
  by_type: Record<string, number>;
}

export interface CreateMemberRequest {
  member_type: MemberType;
  name: string;
  email?: string;
  date_of_birth?: string;
  gender?: string;
  phone_no?: string;
  main_sports?: string[];
  other_sports?: string[];
  height?: number;
  weight?: number;
  arm_span?: number;
  leg_length?: number;
  shoe_size?: number;
  other_metrics?: Record<string, string>;
  group_ids?: number[];
}

export interface UpdateMemberRequest {
  member_type?: MemberType;
  profile_image_key?: string;
  name?: string;
  email?: string;
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
  other_metrics?: Record<string, string>;
}

export interface CreateGroupRequest {
  name: string;
  description: string;
}

export interface UpdateGroupRequest {
  name?: string;
  description?: string;
}