export interface User {
  id: number;
  email: string;
  name: string;
  created_at: string;
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

export type AnalysisType = "fly-run" | "vertical-leap";
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
  report_type: "fly-run" | "vertical-leap";
  // vertical-leap only — present when report_type === "vertical-leap"
  height_cm?: number;
  jump_height_cm?: number;
  flight_time_s?: number;
  created_at: string;
}

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