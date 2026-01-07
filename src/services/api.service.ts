import { config } from '@/config';
import type {
  ChatRequest,
  ChatResponse,
  Session,
  SessionDetails,
  AirQualityQuery,
  AirQualityResponse,
  Message,
  CreateSessionResponse,
} from '@/types';

const API_BASE = `${config.api.baseUrl}/api/${config.api.version}`;

class ApiService {
  private async fetchWithError<T>(
    url: string,
    options?: RequestInit
  ): Promise<T> {
    const isFormData = options?.body instanceof FormData;
    const response = await fetch(url, {
      ...options,
      headers: {
        ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
        ...options?.headers,
      },
      // Add mode for CORS handling
      mode: 'cors',
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        detail: response.statusText,
      }));

      // Handle different error formats
      let errorMessage = 'An error occurred';
      if (typeof error.detail === 'string') {
        errorMessage = error.detail;
      } else if (Array.isArray(error.detail)) {
        errorMessage = error.detail
          .map(
            (e: { msg?: string; message?: string }) =>
              e.msg || e.message || JSON.stringify(e)
          )
          .join(', ');
      } else if (error.detail && typeof error.detail === 'object') {
        errorMessage =
          error.detail.message ||
          error.detail.msg ||
          JSON.stringify(error.detail);
      }

      throw new Error(errorMessage);
    }

    const result = await response.json();

    return result;
  }

  // Chat endpoints
  async sendMessage(
    data: ChatRequest,
    options?: { signal?: AbortSignal }
  ): Promise<ChatResponse> {
    // Always use FormData as required by the API
    const formData = new FormData();
    formData.append('message', data.message);
    if (data.session_id) {
      formData.append('session_id', data.session_id);
    } // No else clause - require session_id to be provided
    if (data.file) {
      formData.append('file', data.file);
    }
    if (data.latitude !== undefined) {
      formData.append('latitude', data.latitude.toString());
    }
    if (data.longitude !== undefined) {
      formData.append('longitude', data.longitude.toString());
    }
    // Always append role, defaulting to 'general' if not provided
    formData.append('role', data.role || 'general');

    return this.fetchWithError<ChatResponse>(`${API_BASE}/agent/chat`, {
      method: 'POST',
      body: formData,
      signal: options?.signal,
    });
  }

  // Session endpoints
  async getSessions(): Promise<Session[]> {
    return this.fetchWithError<Session[]>(`${API_BASE}/sessions`);
  }

  async createSession(): Promise<CreateSessionResponse> {
    return this.fetchWithError<CreateSessionResponse>(
      `${API_BASE}/sessions/new`,
      {
        method: 'POST',
      }
    );
  }

  async getSessionDetails(sessionId: string): Promise<SessionDetails> {
    return this.fetchWithError<SessionDetails>(
      `${API_BASE}/sessions/${sessionId}`
    );
  }

  async deleteSession(sessionId: string): Promise<void> {
    await this.fetchWithError(`${API_BASE}/sessions/${sessionId}`, {
      method: 'DELETE',
    });
  }

  async getSessionMessages(sessionId: string): Promise<Message[]> {
    return this.fetchWithError<Message[]>(
      `${API_BASE}/sessions/${sessionId}/messages`
    );
  }

  // Air quality query
  async queryAirQuality(data: AirQualityQuery): Promise<AirQualityResponse> {
    return this.fetchWithError(`${API_BASE}/air-quality/query`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Health check
  async healthCheck(): Promise<{ status: string }> {
    return this.fetchWithError(`${API_BASE}/health`);
  }
}

export const apiService = new ApiService();
