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
  image?: {
    name: string;
    size: number;
    type: string;
    imageId?: string; // Reference to stored File object
    preview?: string; // Data URL for preview
  };
  cost_info?: CostInfo;
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
  image?: File;
  latitude?: number;
  longitude?: number;
  role?: ResponseRole;
}

export interface CostInfo {
  session_id: string;
  tokens_used: number;
  total_tokens: number;
  max_tokens: number;
  usage_percentage: number;
  total_cost_usd: number;
  warning?: string;
  recommendation?: string;
}

export interface ModelCapabilities {
  provider: string;
  model: string;
  supports_vision: boolean;
  supports_reasoning: boolean;
  max_image_size_mb: number;
  allowed_image_formats: string[];
  cost_optimization_enabled: boolean;
  cache_hit_rate_pct: number;
}

export interface ChatResponse {
  response: string;
  session_id: string;
  tools_used: string[];
  document_processed?: boolean;
  document_filename?: string;
  image_processed?: boolean;
  vision_capable?: boolean;
  tokens_used: number;
  cached: boolean;
  message_count?: number;
  cost_info?: CostInfo;
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
