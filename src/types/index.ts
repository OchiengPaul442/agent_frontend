export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: string;
  tools_used?: string[];
  isStreaming?: boolean; // For typewriter effect
  isError?: boolean; // For error messages
  file?: {
    name: string;
    size: number;
    type: string;
    fileId?: string; // Reference to stored File object
  };
  thinking_steps?: string[]; // AI reasoning steps for Chain-of-Thought
  reasoning_content?: string; // Full reasoning content as string
  thinking_duration?: number; // Duration of thinking process in milliseconds
}

export interface Session {
  session_id: string;
  created_at: string;
  updated_at: string;
  message_count: number;
  title?: string;
}

export interface CreateSessionResponse {
  session_id: string;
  created_at: string;
  message: string;
}

export interface SessionDetails extends Session {
  messages: Message[];
}

export type ResponseRole =
  | 'general'
  | 'executive'
  | 'technical'
  | 'simple'
  | 'policy';

export interface ChatRequest {
  message: string;
  session_id?: string;
  history?: Message[];
  save_to_db?: boolean;
  file?: File;
  latitude?: number;
  longitude?: number;
  role?: ResponseRole;
}

export interface ChatResponse {
  response: string;
  session_id: string;
  tools_used: string[];
  document_processed?: boolean;
  document_filename?: string;
  tokens_used: number;
  cached: boolean;
  thinking_steps?: string[]; // AI reasoning steps for Chain-of-Thought
  reasoning_content?: string; // Full reasoning content as string
}

export interface AirQualityQuery {
  city?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  include_forecast?: boolean;
  forecast_days?: number;
  timezone?: string;
}

export interface AirQualityResponse {
  waqi?: {
    status: string;
    data: {
      aqi: number;
      city: { name: string };
      time: { s: string };
      iaqi: Record<string, { v: number }>;
    };
  };
  airqo?: {
    success: boolean;
    measurements: Array<{
      pm2_5?: { value: number };
      site_id: string;
      aqi_category: string;
    }>;
  };
  openmeteo?: {
    current?: {
      latitude: number;
      longitude: number;
      timezone: string;
      pm10: number;
      pm2_5: number;
      european_aqi: number;
      us_aqi: number;
      european_aqi_category: string;
      us_aqi_category: string;
    };
    forecast?: {
      hourly: {
        time: string[];
        pm2_5?: number[];
        pm10?: number[];
        european_aqi?: number[];
        us_aqi?: number[];
      };
    };
  };
}

export interface ApiError {
  detail: string;
  status?: number;
}
