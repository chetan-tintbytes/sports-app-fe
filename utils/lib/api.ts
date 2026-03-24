import {
  LoginRequest,
  SignupRequest,
  LoginResponse,
  User,
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
  AnalysisRunWithPoints,
  AnalysisRun,
  ProcessVideoRequest,
  ReportRow,
  VerticalLeapRun,
  ProcessVerticalLeapRequest,
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

export const api = {
  // ── Auth ──────────────────────────────────────────────────

  async signup(data: SignupRequest): Promise<LoginResponse> {
    const response = await fetch(`${API_URL}/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return handleResponse<LoginResponse>(response);
  },

  async login(data: LoginRequest): Promise<LoginResponse> {
    const response = await fetch(`${API_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return handleResponse<LoginResponse>(response);
  },

  async getProfile(token: string): Promise<User> {
    const response = await fetch(`${API_URL}/profile`, {
      headers: authHeaders(token),
    });
    return handleResponse<User>(response);
  },

  async forgotPassword(data: ForgotPasswordRequest): Promise<{ message: string }> {
    const response = await fetch(`${API_URL}/forgot-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return handleResponse<{ message: string }>(response);
  },

  async resetPassword(data: ResetPasswordRequest): Promise<{ message: string }> {
    const response = await fetch(`${API_URL}/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return handleResponse<{ message: string }>(response);
  },

  // ── Folders ───────────────────────────────────────────────

  async getFolders(token: string): Promise<FolderTree> {
    const response = await fetch(`${API_URL}/folders`, {
      headers: authHeaders(token),
    });
    return handleResponse<FolderTree>(response);
  },

  async getFolderContents(token: string, folderId: number | "root"): Promise<FolderContents> {
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

  async renameFolder(token: string, id: number, name: string): Promise<{ message: string }> {
    const response = await fetch(`${API_URL}/folders/${id}/rename`, {
      method: "PATCH",
      headers: authHeaders(token),
      body: JSON.stringify({ name }),
    });
    return handleResponse<{ message: string }>(response);
  },

  async moveFolder(token: string, id: number, newParentId: number | null): Promise<{ message: string }> {
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

  // ── Videos ────────────────────────────────────────────────

  async presignUpload(token: string, data: PresignRequest): Promise<PresignResponse> {
    const response = await fetch(`${API_URL}/videos/presign`, {
      method: "POST",
      headers: authHeaders(token),
      body: JSON.stringify(data),
    });
    return handleResponse<PresignResponse>(response);
  },

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

  async renameVideo(token: string, id: number, name: string): Promise<{ message: string }> {
    const response = await fetch(`${API_URL}/videos/${id}/rename`, {
      method: "PATCH",
      headers: authHeaders(token),
      body: JSON.stringify({ name }),
    });
    return handleResponse<{ message: string }>(response);
  },

  async moveVideo(token: string, id: number, folderId: number | null): Promise<{ message: string }> {
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

  // ── Analysis ──────────────────────────────────────────────

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

  async getLatestAnalysis(
    token: string,
    videoId: number,
    type: AnalysisType
  ): Promise<AnalysisRunWithPoints> {
    const response = await fetch(
      `${API_URL}/videos/${videoId}/analysis/latest?type=${type}`,
      { headers: authHeaders(token) }
    );
    return handleResponse<AnalysisRunWithPoints>(response);
  },

  async getAllAnalysisRuns(
    token: string,
    videoId: number
  ): Promise<{ runs: AnalysisRun[] }> {
    const response = await fetch(`${API_URL}/videos/${videoId}/analysis`, {
      headers: authHeaders(token),
    });
    return handleResponse<{ runs: AnalysisRun[] }>(response);
  },

  async getAnalysisRun(
    token: string,
    runId: number
  ): Promise<AnalysisRunWithPoints> {
    const response = await fetch(`${API_URL}/analysis/runs/${runId}`, {
      headers: authHeaders(token),
    });
    return handleResponse<AnalysisRunWithPoints>(response);
  },

  async processVerticalLeap(
  token: string,
  videoId: number,
  heightCm: number
): Promise<{ message: string; run: VerticalLeapRun }> {
  const response = await fetch(`${API_URL}/videos/${videoId}/process-vertical-leap`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({ analysis_type: "vertical-leap", height_cm: heightCm }),
  });
  return handleResponse<{ message: string; run: VerticalLeapRun }>(response);
},

async getLatestVerticalLeap(
  token: string,
  videoId: number
): Promise<VerticalLeapRun> {
  const response = await fetch(`${API_URL}/videos/${videoId}/vertical-leap/latest`, {
    headers: authHeaders(token),
  });
  return handleResponse<VerticalLeapRun>(response);
},

async getVerticalLeapRun(
  token: string,
  runId: number
): Promise<VerticalLeapRun> {
  const response = await fetch(`${API_URL}/analysis/vertical-leap/${runId}`, {
    headers: authHeaders(token),
  });
  return handleResponse<VerticalLeapRun>(response);
},

  // ── Reports ───────────────────────────────────────────────

  async getReports(token: string): Promise<{ reports: ReportRow[] }> {
    const response = await fetch(`${API_URL}/reports`, {
      headers: authHeaders(token),
    });
    return handleResponse<{ reports: ReportRow[] }>(response);
  },
};