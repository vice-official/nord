import type {
  ArtifactMeta,
  GenerationDetail,
  GenerationListItem,
  GenerationStatus,
  GenerationStage
} from '../api/types.ts';

interface MockGeneration extends GenerationListItem {
  description: string;
  statusCalls: number;
}

export const mockGenerations: MockGeneration[] = [];

export const getMockGeneration = (generationId: string) => {
  return mockGenerations.find((generation) => generation.generation_id === generationId);
};

export const createMockGeneration = (description: string) => {
  const now = new Date().toISOString();
  const generationId = `mock-${Date.now()}`;

  const generation: MockGeneration = {
    generation_id: generationId,
    run_id: `run-${generationId}`,
    title: description.slice(0, 80) || 'Новая генерация',
    status: 'queued',
    current_stage: 'created',
    created_at: now,
    updated_at: now,
    duration_seconds: null,
    artifacts_count: 0,
    errors_count: 0,
    warnings_count: 0,
    image_success: null,
    description,
    statusCalls: 0
  };

  mockGenerations.unshift(generation);

  return generation;
};

export const updateMockGenerationStatus = (generationId: string) => {
  const generation = getMockGeneration(generationId);

  if (!generation) {
    return null;
  }

  generation.statusCalls += 1;

  const stages: GenerationStage[] = [
    'created',
    'validation',
    'context_search',
    'tz_outline',
    'tz_sections',
    'tz_final',
    'tth_final',
    'artifact_indexing',
    'completed'
  ];

  const statuses: GenerationStatus[] = [
    'queued',
    'running',
    'running',
    'running',
    'running',
    'running',
    'running',
    'running',
    'completed'
  ];

  const index = Math.min(generation.statusCalls - 1, statuses.length - 1);

  generation.status = statuses[index];
  generation.current_stage = stages[index];
  generation.updated_at = new Date().toISOString();

  if (generation.status === 'completed') {
    generation.duration_seconds = 12;
    generation.artifacts_count = 3;
  }

  return generation;
};

export const getMockGenerationDetail = (generationId: string): GenerationDetail | null => {
  const generation = getMockGeneration(generationId);

  if (!generation) {
    return null;
  }

  return {
    generation_id: generation.generation_id,
    run_id: generation.run_id,
    status: generation.status,
    title: generation.title,
    project_description_preview: generation.description,
    created_at: generation.created_at,
    started_at: generation.created_at,
    finished_at: generation.status === 'completed' ? generation.updated_at : null,
    duration_seconds: generation.duration_seconds,
    current_stage: generation.current_stage,
    errors: [],
    warnings: generation.status === 'completed' ? ['Mock-режим: данные сгенерированы без backend'] : [],
    audit_summary: generation.status === 'completed'
      ? {
        total: 4,
        approved: 3,
        requires_revision: 1,
        critical_issues: 0
      }
      : null,
    options: {
      config_profile: 'default',
      llm_profile: 'qwen_36_27b_q4_xl',
      image_enabled: false,
      image_profile: null,
      generation_options: {
        max_sections: 8,
        max_audit_iterations: 2,
        context_top_k: 5,
        use_reranker: false,
        stop_before_image: true
      }
    }
  };
};

export const getMockArtifacts = (generationId: string): ArtifactMeta[] => {
  const generation = getMockGeneration(generationId);

  if (!generation || generation.status !== 'completed') {
    return [];
  }

  const now = new Date().toISOString();

  return [
    {
      artifact_id: `${generationId}-tz`,
      generation_id: generationId,
      kind: 'tz_final',
      format: 'markdown',
      title: 'Техническое задание.md',
      relative_path: 'artifacts/tz_final.md',
      mime_type: 'text/markdown',
      size_bytes: 4096,
      created_at: now,
      preview_available: true,
      download_available: true
    },
    {
      artifact_id: `${generationId}-tth`,
      generation_id: generationId,
      kind: 'tth_final',
      format: 'markdown',
      title: 'Технические требования.md',
      relative_path: 'artifacts/tth_final.md',
      mime_type: 'text/markdown',
      size_bytes: 3072,
      created_at: now,
      preview_available: true,
      download_available: true
    },
    {
      artifact_id: `${generationId}-log`,
      generation_id: generationId,
      kind: 'log',
      format: 'log',
      title: 'generation.log',
      relative_path: 'artifacts/generation.log',
      mime_type: 'text/plain',
      size_bytes: 1024,
      created_at: now,
      preview_available: true,
      download_available: true
    }
  ];
};

export const getMockArtifactContent = (artifactId: string) => {
  if (artifactId.endsWith('-tz')) {
    return `# Техническое задание

## 1. Назначение системы

Система предназначена для генерации технического задания на основе текстового описания проекта.

## 2. Основной сценарий

1. Пользователь вводит описание проекта.
2. Система запускает генерацию.
3. Пользователь отслеживает статус выполнения.
4. После завершения пользователь получает список артефактов.
5. Пользователь открывает предпросмотр или скачивает файл.

## 3. Функциональные требования

- создание генерации;
- загрузка файлов;
- отображение статуса;
- просмотр результата;
- скачивание артефактов.

## 4. Нефункциональные требования

- интерфейс должен быть адаптивным;
- ошибки backend должны отображаться пользователю;
- повторное открытие генерации по URL должно работать корректно.`;
  }

  if (artifactId.endsWith('-tth')) {
    return `# Технические требования

## Frontend

- React;
- TypeScript;
- Zustand;
- React Router;
- Markdown preview.

## API

- POST /generations;
- GET /generations;
- GET /generations/{id};
- GET /generations/{id}/status;
- GET /generations/{id}/artifacts;
- GET /artifacts/{id}/preview;
- GET /artifacts/{id}/download.

## Проверка без backend

Для локального тестирования используется MSW.`;
  }

  return `generation started
validation completed
context search completed
tz generation completed
artifacts indexed
generation completed`;
};

export const ensureMockGeneration = (generationId: string) => {
  const existingGeneration = getMockGeneration(generationId);

  if (existingGeneration) {
    return existingGeneration;
  }

  const now = new Date().toISOString();

  const generation = {
    generation_id: generationId,
    run_id: `run-${generationId}`,
    title: 'Mock-генерация',
    status: 'completed' as const,
    current_stage: 'completed' as const,
    created_at: now,
    updated_at: now,
    duration_seconds: 12,
    artifacts_count: 3,
    errors_count: 0,
    warnings_count: 1,
    image_success: null,
    description: 'Mock-генерация восстановлена после перезагрузки страницы',
    statusCalls: 9
  };

  mockGenerations.unshift(generation);

  return generation;
};