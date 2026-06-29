export type GenerationStatus =
  | "queued"
  | "running"
  | "completed"
  | "failed"
  | "cancelled"
  | "cancelling"
  | "timeout";

export type GenerationStage =
  | "created"
  | "validation"
  | "context_search"
  | "tz_outline"
  | "tz_sections"
  | "tz_final"
  | "tth_categories"
  | "tth_sections"
  | "tth_final"
  | "image_prompt"
  | "image_generation"
  | "artifact_indexing"
  | "completed";

export type ArtifactFormat =
  | "markdown"
  | "json"
  | "csv"
  | "png"
  | "txt"
  | "log"
  | "unknown";

export type ArtifactKind =
  | "input"
  | "tz_outline"
  | "tz_section"
  | "tz_final"
  | "tth_categories"
  | "tth_section"
  | "tth_final"
  | "image_prompt"
  | "image_spec"
  | "image_result"
  | "audit"
  | "run_state"
  | "log"
  | "other";

export type LogLevel = "debug" | "info" | "warning" | "error";
export type ServiceStatus = "ok" | "degraded" | "failed" | "unknown";
export type AuditSeverity = "info" | "warning" | "error" | "critical";
export type RagTask = "text" | "code" | "tz" | "tth";

export interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: unknown;
    request_id?: string;
    generation_id?: string | null;
    field_errors?: FieldError[];
  };
}

export interface FieldError {
  field: string;
  code: string;
  message: string;
  value?: unknown;
}

export interface GenerationCreateRequest {
  project_description?: string | null;
  project_description_file_id?: string | null;
  config_profile?: string | null;
  llm_profile?: string | null;
  image_enabled: boolean;
  image_profile?: string | null;
  image_input_file_id?: string | null;
  generation_options?: GenerationOptions;
  client_metadata?: ClientGenerationMetadata;
}

export interface GenerationOptions {
  max_sections?: number;
  max_audit_iterations?: number;
  context_top_k?: number;
  use_reranker?: boolean;
  stop_before_image?: boolean;
}

export interface ClientGenerationMetadata {
  title?: string;
  tags?: string[];
}

export interface GenerationCreateResponse {
  generation_id: string;
  run_id: string;
  status: GenerationStatus;
  created_at: string;
  status_url: string;
}

export interface GenerationListResponse {
  items: GenerationListItem[];
  total: number;
  limit: number;
  offset: number;
}

export interface GenerationListItem {
  generation_id: string;
  run_id: string;
  title?: string | null;
  status: GenerationStatus;
  current_stage?: GenerationStage | null;
  created_at: string;
  updated_at: string;
  duration_seconds?: number | null;
  artifacts_count: number;
  errors_count: number;
  warnings_count: number;
  image_success?: boolean | null;
}

export interface GenerationDetail {
  generation_id: string;
  run_id: string;
  status: GenerationStatus;
  title?: string | null;
  project_description_preview?: string | null;
  created_at: string;
  started_at?: string | null;
  finished_at?: string | null;
  duration_seconds?: number | null;
  current_stage?: GenerationStage | null;
  errors: string[];
  warnings: string[];
  audit_summary?: AuditSummary | null;
  options: GenerationResolvedOptions;
}

export interface GenerationResolvedOptions {
  config_profile?: string | null;
  llm_profile?: string | null;
  image_enabled: boolean;
  image_profile?: string | null;
  generation_options?: GenerationOptions;
}

export interface GenerationStatusResponse {
  generation_id: string;
  status: GenerationStatus;
  current_stage?: GenerationStage | null;
  current_step?: string | null;
  progress: GenerationProgress;
  started_at?: string | null;
  updated_at: string;
  last_event_id?: string | null;
  errors: string[];
  warnings: string[];
}

export interface GenerationProgress {
  percent?: number | null;
  completed_steps?: number | null;
  total_steps?: number | null;
}

export interface StageStatus {
  stage: GenerationStage;
  status: "pending" | "running" | "completed" | "failed" | "skipped";
  started_at?: string | null;
  finished_at?: string | null;
  duration_seconds?: number | null;
  error?: string | null;
}

export interface AgentRunListResponse {
  items: AgentRunSummary[];
}

export interface AgentRunSummary {
  agent: string;
  artifact_type: string;
  artifact_id: string;
  status: "pending" | "running" | "completed" | "failed" | "skipped";
  attempts: number;
  approved?: boolean | null;
  duration_seconds?: number | null;
  started_at?: string | null;
  finished_at?: string | null;
}

export interface AuditSummary {
  total: number;
  approved: number;
  requires_revision: number;
  critical_issues: number;
}

export interface AuditIssue {
  message: string;
  severity: AuditSeverity;
  location?: string | null;
  recommendation?: string | null;
}

export interface AuditResult {
  approved: boolean;
  requires_revision: boolean;
  critical_issues: AuditIssue[];
  warnings: AuditIssue[];
  blocking_open_questions: string[];
  unsupported_values?: unknown[];
  coverage_gaps?: unknown[];
  revision_instructions: string[];
  summary: string;
}

export interface ArtifactListResponse {
  items: ArtifactMeta[];
}

export interface ArtifactMeta {
  artifact_id: string;
  generation_id: string;
  kind: ArtifactKind;
  format: ArtifactFormat;
  title: string;
  relative_path?: string | null;
  mime_type: string;
  size_bytes: number;
  created_at?: string | null;
  preview_available: boolean;
  download_available: boolean;
}

export type ArtifactPreviewResponse =
  | TextArtifactPreview
  | CsvArtifactPreview
  | ImageArtifactPreview
  | BinaryArtifactPreview;

export interface TextArtifactPreview {
  artifact_id: string;
  format: "markdown" | "json" | "txt" | "log";
  truncated: boolean;
  content: string;
  encoding: "utf-8";
}

export interface CsvArtifactPreview {
  artifact_id: string;
  format: "csv";
  truncated: boolean;
  columns: string[];
  rows: string[][];
}

export interface ImageArtifactPreview {
  artifact_id: string;
  format: "png";
  image_url: string;
  width?: number | null;
  height?: number | null;
}

export interface BinaryArtifactPreview {
  artifact_id: string;
  format: "unknown";
  preview_available: false;
  download_url: string;
}

export type UploadPurpose = "project_description" | "image_input" | "rag_source";

export interface UploadResponse {
  file_id: string;
  purpose: UploadPurpose;
  original_name: string;
  mime_type: string;
  size_bytes: number;
  sha256: string;
  created_at: string;
}

export interface UploadMeta extends UploadResponse {
  used_by_generation_id?: string | null;
  expires_at?: string | null;
}

export interface RagRequest {
  query: string;
  top_k?: number | null;
  filters?: RagFilters;
}

export interface RagFilters {
  task?: RagTask;
  tasks?: RagTask[];
  [key: string]: unknown;
}

export interface RagRetrieveResponse {
  query: string;
  chunks: RagChunk[];
  warnings: string[];
}

export interface RagChunk {
  id: string;
  text: string;
  metadata: Record<string, unknown>;
  score?: number | null;
}

export interface RagAnswerResponse {
  query: string;
  answer: string;
  sources: RagChunk[];
  warnings: string[];
}

export interface ServicesHealthResponse {
  status: ServiceStatus;
  checked_at: string;
  services: ServiceHealthItem[];
}

export interface ServiceHealthItem {
  name:
    | "api"
    | "llm"
    | "embedder"
    | "reranker"
    | "qdrant"
    | "postgres"
    | "disk"
    | string;
  status: ServiceStatus;
  latency_ms?: number | null;
  detail?: string | null;
}

export interface SettingsResponse {
  api: { version: string; environment: string };
  features: Record<string, boolean>;
  limits: Record<string, number>;
  defaults: Record<string, unknown>;
  llm_profiles?: Array<string | { id?: string; name?: string; label?: string }>;
  profiles?: Array<string | { id?: string; name?: string; label?: string }>;
}