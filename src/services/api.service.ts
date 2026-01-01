import { config } from '@/config';
import type {
  ChatRequest,
  ChatResponse,
  Session,
  SessionDetails,
  AirQualityQuery,
  AirQualityResponse,
  Message,
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
      throw new Error(error.detail || 'An error occurred');
    }

    return response.json();
  }

  // Chat endpoints
  async sendMessage(data: ChatRequest): Promise<ChatResponse> {
    if (data.file) {
      // Use FormData for file uploads
      const formData = new FormData();
      formData.append('message', data.message);
      if (data.session_id) {
        formData.append('session_id', data.session_id);
      }
      formData.append('file', data.file);

      return this.fetchWithError<ChatResponse>(`${API_BASE}/agent/chat`, {
        method: 'POST',
        body: formData,
      });
    }

    // JSON for text-only messages
    return this.fetchWithError<ChatResponse>(`${API_BASE}/agent/chat`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Session endpoints
  async getSessions(): Promise<Session[]> {
    return this.fetchWithError<Session[]>(`${API_BASE}/sessions`);
  }

  async createSession(): Promise<Session> {
    return this.fetchWithError<Session>(`${API_BASE}/sessions/new`, {
      method: 'POST',
    });
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
