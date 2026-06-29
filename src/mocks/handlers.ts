import { http, HttpResponse } from 'msw';
import type { GenerationCreateRequest } from '../api/types.ts';
import {
  createMockGeneration,
  ensureMockGeneration,
  getMockArtifactContent,
  getMockArtifacts,
  getMockGeneration,
  getMockGenerationDetail,
  mockGenerations,
  updateMockGenerationStatus
} from './data.ts';

export const handlers = [
  http.get('*/settings', () => {
    return HttpResponse.json({
      api: {
        version: 'mock',
        environment: 'development'
      },
      features: {
        image_generation: false,
        rag: true,
        artifacts: true
      },
      limits: {
        max_file_size_mb: 20
      },
      defaults: {
        llm_profile: 'qwen_36_27b_q4_xl'
      },
      llm_profiles: [
        {
          id: 'qwen_36_27b_q4_xl',
          label: 'Vice (qwen_36_27b_q4_xl)'
        },
        {
          id: 'mock_fast',
          label: 'Mock Fast'
        }
      ]
    });
  }),

  http.get('*/health', () => {
    return HttpResponse.json({
      status: 'ok',
      checked_at: new Date().toISOString(),
      services: [
        {
          name: 'api',
          status: 'ok',
          latency_ms: 12,
          detail: 'mock'
        },
        {
          name: 'llm',
          status: 'ok',
          latency_ms: 45,
          detail: 'mock'
        }
      ]
    });
  }),

  http.post('*/uploads', async ({ request }) => {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const purpose = formData.get('purpose') || 'project_description';

    if (!file) {
      return HttpResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Файл не передан',
            field_errors: [
              {
                field: 'file',
                code: 'required',
                message: 'Выберите файл'
              }
            ]
          }
        },
        { status: 400 }
      );
    }

    return HttpResponse.json({
      file_id: `file-${Date.now()}`,
      purpose,
      original_name: file.name,
      mime_type: file.type || 'text/plain',
      size_bytes: file.size,
      sha256: 'mock-sha256',
      created_at: new Date().toISOString()
    });
  }),

  http.post('*/generations', async ({ request }) => {
    const body = await request.json() as GenerationCreateRequest;
    const description = body.project_description || 'Описание проекта из файла';

    if (!description && !body.project_description_file_id) {
      return HttpResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Нужно передать описание проекта или файл',
            field_errors: [
              {
                field: 'project_description',
                code: 'required',
                message: 'Введите описание проекта или прикрепите файл'
              }
            ]
          }
        },
        { status: 400 }
      );
    }

    const generation = createMockGeneration(description);

    return HttpResponse.json({
      generation_id: generation.generation_id,
      run_id: generation.run_id,
      status: generation.status,
      created_at: generation.created_at,
      status_url: `/generations/${generation.generation_id}/status`
    });
  }),

  http.get('*/generations', ({ request }) => {
    const url = new URL(request.url);
    const limit = Number(url.searchParams.get('limit') || 20);
    const offset = Number(url.searchParams.get('offset') || 0);
    const items = mockGenerations.slice(offset, offset + limit);

    return HttpResponse.json({
      items,
      total: mockGenerations.length,
      limit,
      offset
    });
  }),

  http.get('*/generations/:id/status', ({ params }) => {
    const id = String(params.id);

    ensureMockGeneration(id);

    const generation = updateMockGenerationStatus(id);

    if (!generation) {
      return HttpResponse.json(
        {
          error: {
            code: 'NOT_FOUND',
            message: 'Генерация не найдена'
          }
        },
        { status: 404 }
      );
    }

    const totalSteps = 9;
    const completedSteps = Math.min(generation.statusCalls, totalSteps);
    const percent = Math.min(Math.round((completedSteps / totalSteps) * 100), 100);

    return HttpResponse.json({
      generation_id: generation.generation_id,
      status: generation.status,
      current_stage: generation.current_stage,
      current_step: generation.current_stage,
      progress: {
        percent,
        completed_steps: completedSteps,
        total_steps: totalSteps
      },
      started_at: generation.created_at,
      updated_at: generation.updated_at,
      last_event_id: `event-${generation.statusCalls}`,
      errors: [],
      warnings: generation.status === 'completed' ? ['Mock-режим активен'] : []
    });
  }),

  http.get('*/generations/:id/artifacts', ({ params }) => {
    const id = String(params.id);

    ensureMockGeneration(id);

    return HttpResponse.json({
      items: getMockArtifacts(id)
    });
  }),

  http.get('*/generations/:id', ({ params }) => {
    const id = String(params.id);

    ensureMockGeneration(id);

    const detail = getMockGenerationDetail(id);

    if (!detail) {
      return HttpResponse.json(
        {
          error: {
            code: 'NOT_FOUND',
            message: 'Генерация не найдена'
          }
        },
        { status: 404 }
      );
    }

    return HttpResponse.json(detail);
  }),

  http.get('*/artifacts/:id/preview', ({ params }) => {
    const id = String(params.id);
    const content = getMockArtifactContent(id);
    const format = id.endsWith('-log') ? 'log' : 'markdown';

    return HttpResponse.json({
      artifact_id: id,
      format,
      truncated: false,
      content,
      encoding: 'utf-8'
    });
  }),

  http.get('*/artifacts/:id/download', ({ params }) => {
    const id = String(params.id);
    const content = getMockArtifactContent(id);

    return new HttpResponse(content, {
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${id}.md"`
      }
    });
  }),

  http.post('*/rag/retrieve', async ({ request }) => {
    const body = await request.json() as { query: string };

    return HttpResponse.json({
      query: body.query,
      chunks: [
        {
          id: 'mock-chunk-1',
          text: 'Mock-фрагмент базы знаний',
          metadata: {
            source: 'mock'
          },
          score: 0.91
        }
      ],
      warnings: []
    });
  }),

  http.post('*/rag/answer', async ({ request }) => {
    const body = await request.json() as { query: string };

    return HttpResponse.json({
      query: body.query,
      answer: 'Mock-ответ RAG без backend',
      sources: [
        {
          id: 'mock-chunk-1',
          text: 'Mock-фрагмент базы знаний',
          metadata: {
            source: 'mock'
          },
          score: 0.91
        }
      ],
      warnings: []
    });
  }),
];