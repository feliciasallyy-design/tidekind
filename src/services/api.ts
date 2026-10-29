import {
  User,
  GearReport,
  ActionProject,
  ResourceListing,
  ActivityLog,
  FeedPost,
  AppNotification,
} from '../types';

const TOKEN_KEY = 'tidekind_auth_token';

export function getStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setStoredToken(token: string | null) {
  try {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  } catch {
    // Ignore storage errors in restricted contexts
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(path, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data.error || data.message || `Request failed with status ${response.status}`;
    throw new Error(errorMsg);
  }

  return data as T;
}

export interface SharedDataPayload {
  users: User[];
  reports: GearReport[];
  projects: ActionProject[];
  listings: ResourceListing[];
  activityLogs: ActivityLog[];
  feedPosts: FeedPost[];
  notifications: AppNotification[];
  shorescanRuns: any[];
}

export const api = {
  // Auth
  async register(params: {
    name: string;
    email: string;
    password: string;
    location?: string;
    chapter?: string;
    bio?: string;
  }): Promise<{ token: string; user: User }> {
    const res = await request<{ token: string; user: User }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(params),
    });
    setStoredToken(res.token);
    return res;
  },

  async login(params: { email: string; password: string }): Promise<{ token: string; user: User }> {
    const res = await request<{ token: string; user: User }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(params),
    });
    setStoredToken(res.token);
    return res;
  },

  async getMe(): Promise<{ user: User }> {
    return request<{ user: User }>('/api/auth/me');
  },

  async logout(): Promise<void> {
    try {
      await request('/api/auth/logout', { method: 'POST' });
    } finally {
      setStoredToken(null);
    }
  },

  async forgotPassword(email: string): Promise<{ success: boolean; message: string; debugToken?: string }> {
    return request('/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  async resetPassword(token: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    return request('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, newPassword }),
    });
  },

  async updateProfile(updates: Partial<User>): Promise<{ user: User }> {
    return request<{ user: User }>('/api/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  async switchDemoAccount(email: string): Promise<{ token: string; user: User }> {
    const res = await request<{ token: string; user: User }>('/api/auth/demo-switch', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
    setStoredToken(res.token);
    return res;
  },

  // Shared Data
  async getSharedData(): Promise<SharedDataPayload> {
    return request<SharedDataPayload>('/api/data');
  },

  async createReport(reportData: Partial<GearReport>): Promise<{ report: GearReport }> {
    return request<{ report: GearReport }>('/api/reports', {
      method: 'POST',
      body: JSON.stringify(reportData),
    });
  },

  async updateReportStatus(id: string, status: string, assignedTeam?: string): Promise<{ report: GearReport }> {
    return request<{ report: GearReport }>(`/api/reports/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, assignedTeam }),
    });
  },

  async joinProject(projectId: string): Promise<{ project: ActionProject; isJoined: boolean }> {
    return request<{ project: ActionProject; isJoined: boolean }>(`/api/projects/${projectId}/join`, {
      method: 'POST',
    });
  },

  async leaveProject(projectId: string): Promise<{ project: ActionProject; isJoined: boolean }> {
    return request<{ project: ActionProject; isJoined: boolean }>(`/api/projects/${projectId}/leave`, {
      method: 'POST',
    });
  },

  async createListing(listingData: Partial<ResourceListing>): Promise<{ listing: ResourceListing }> {
    return request<{ listing: ResourceListing }>('/api/listings', {
      method: 'POST',
      body: JSON.stringify(listingData),
    });
  },

  async logActivity(activityData: {
    category: string;
    weightKg: number;
    hours: number;
    location: string;
    verificationMethod?: string;
  }): Promise<{ log: ActivityLog; user: User }> {
    return request<{ log: ActivityLog; user: User }>('/api/activity-logs', {
      method: 'POST',
      body: JSON.stringify(activityData),
    });
  },

  async createFeedPost(data: { content: string; imageUrl?: string; location?: string }): Promise<{ post: FeedPost }> {
    return request<{ post: FeedPost }>('/api/feed', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async likePost(postId: string): Promise<{ post: FeedPost; hasLiked: boolean }> {
    return request<{ post: FeedPost; hasLiked: boolean }>(`/api/feed/${postId}/like`, {
      method: 'POST',
    });
  },

  async commentPost(postId: string, text: string): Promise<{ comment: any; post: FeedPost }> {
    return request<{ comment: any; post: FeedPost }>(`/api/feed/${postId}/comment`, {
      method: 'POST',
      body: JSON.stringify({ text }),
    });
  },

  async submitShoreScan(data: any): Promise<any> {
    return request('/api/shorescan', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};
