import type {
  SettingsResponse,
  UploadResponse,
  UploadPurpose,
  GenerationCreateRequest,
  GenerationCreateResponse,
  GenerationListResponse,
  GenerationStatusResponse,
  ErrorResponse,
  GenerationDetail,
  ArtifactListResponse,
  ArtifactPreviewResponse,
  ServicesHealthResponse,
  RagRequest,
  RagRetrieveResponse,
  RagAnswerResponse
} from './types.ts';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

export class APIError extends Error {
  response: ErrorResponse['error'];
  status: number;

  constructor(response: ErrorResponse['error'], status: number) {
    super(response.message);
    this.name = 'APIError';
    this.response = response;
    this.status = status;
  }
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, options);

  if (!response.ok) {
    let errorData: ErrorResponse;

    try {
      errorData = await response.json();
    } catch {
      errorData = {
        error: {
          code: 'SERVER_ERROR',
          message: `Произошла ошибка сервера: ${response.status} ${response.statusText}`,
          request_id: response.headers.get('x-request-id') || undefined
        }
      };
    }

    throw new APIError(errorData.error, response.status);
  }

  const headers = options?.headers as Record<string, string> | undefined;

  if (headers?.Accept === 'application/octet-stream') {
    return (await response.blob()) as unknown as T;
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const text = await response.text();

  if (!text) {
    return undefined as T;
  }

  return JSON.parse(text);
}

export const apiService = {
  getSettings: (): Promise<SettingsResponse> => {
    return request<SettingsResponse>('/settings');
  },

  getHealth: (): Promise<ServicesHealthResponse> => {
    return request<ServicesHealthResponse>('/health');
  },

  uploadFile: (file: File, purpose: UploadPurpose): Promise<UploadResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('purpose', purpose);

    return request<UploadResponse>('/uploads', {
      method: 'POST',
      body: formData,
    });
  },

  createGeneration: (data: GenerationCreateRequest): Promise<GenerationCreateResponse> => {
    return request<GenerationCreateResponse>('/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
  },

  getGenerations: (): Promise<GenerationListResponse> => {
    return request<GenerationListResponse>('/generations?limit=20&offset=0');
  },

  getGenerationStatus: (id: string): Promise<GenerationStatusResponse> => {
    return request<GenerationStatusResponse>(`/generations/${encodeURIComponent(id)}/status`);
  },

  getGenerationDetails: (id: string): Promise<GenerationDetail> => {
    return request<GenerationDetail>(`/generations/${encodeURIComponent(id)}`);
  },

  getGenerationArtifacts: (id: string): Promise<ArtifactListResponse> => {
    return request<ArtifactListResponse>(`/generations/${encodeURIComponent(id)}/artifacts`);
  },

  getArtifactPreview: (id: string): Promise<ArtifactPreviewResponse> => {
    return request<ArtifactPreviewResponse>(`/artifacts/${encodeURIComponent(id)}/preview`);
  },

  downloadArtifact: (id: string): Promise<Blob> => {
    return request<Blob>(`/artifacts/${encodeURIComponent(id)}/download`, {
      headers: {
        Accept: 'application/octet-stream',
      },
    });
  },

  retrieveRag: (data: RagRequest): Promise<RagRetrieveResponse> => {
    return request<RagRetrieveResponse>('/rag/retrieve', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
  },

  answerRag: (data: RagRequest): Promise<RagAnswerResponse> => {
    return request<RagAnswerResponse>('/rag/answer', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
  },
};