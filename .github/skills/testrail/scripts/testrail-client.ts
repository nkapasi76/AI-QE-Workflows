import axios, { AxiosInstance, AxiosResponse } from 'axios';

/**
 * TestRail API Client
 *
 * A TypeScript client for interacting with TestRail's API.
 * Designed for sessionm.testrail.com but configurable for any instance.
 *
 * @example
 * ```typescript
 * const client = new TestRailClient({
 *   baseUrl: 'https://sessionm.testrail.com',
 *   username: process.env.TESTRAIL_USER!,
 *   apiKey: process.env.TESTRAIL_API_KEY!,
 * });
 *
 * const testCase = await client.getCase(12345);
 * console.log(testCase.title);
 * ```
 */

// ============================================================================
// Types
// ============================================================================

export interface TestRailConfig {
  baseUrl: string;
  username: string;
  apiKey: string;
  retryOnRateLimit?: boolean;
  maxRetries?: number;
}

export interface TestRailProject {
  id: number;
  name: string;
  announcement?: string;
  completed_on?: number;
  is_completed: boolean;
  show_announcement: boolean;
  suite_mode: 1 | 2 | 3; // 1=single, 2=single+baselines, 3=multiple
  url: string;
}

export interface TestRailSuite {
  id: number;
  name: string;
  description?: string;
  project_id: number;
  is_baseline?: boolean;
  is_completed?: boolean;
  is_master?: boolean;
  completed_on?: number;
  url: string;
}

export interface TestRailSection {
  id: number;
  name: string;
  description?: string;
  suite_id: number;
  parent_id?: number;
  depth: number;
  display_order: number;
}

export interface TestRailStep {
  content: string;
  expected: string;
  actual?: string;
  status_id?: number;
  shared_step_id?: number;
}

export interface TestRailCase {
  id: number;
  title: string;
  section_id: number;
  suite_id: number;
  template_id: number;
  type_id: number;
  priority_id: number;
  milestone_id?: number;
  refs?: string;
  created_by: number;
  created_on: number;
  updated_by: number;
  updated_on: number;
  estimate?: string;
  estimate_forecast?: string;
  is_deleted?: number;
  display_order?: number;
  // Custom fields
  custom_automation_type?: number;
  custom_preconds?: string;
  custom_steps?: string;
  custom_expected?: string;
  custom_steps_separated?: TestRailStep[];
  custom_mission?: string;
  custom_goals?: string;
  labels?: Array<{ id: number; title: string }>;
}

export interface TestRailRun {
  id: number;
  name: string;
  description?: string;
  suite_id: number;
  project_id: number;
  plan_id?: number;
  milestone_id?: number;
  assignedto_id?: number;
  config?: string;
  config_ids?: number[];
  include_all: boolean;
  is_completed: boolean;
  completed_on?: number;
  created_by: number;
  created_on: number;
  updated_on?: number;
  refs?: string;
  passed_count: number;
  failed_count: number;
  blocked_count: number;
  retest_count: number;
  untested_count: number;
  url: string;
}

export interface TestRailResult {
  id: number;
  test_id: number;
  status_id: number;
  created_by: number;
  created_on: number;
  assignedto_id?: number;
  comment?: string;
  version?: string;
  elapsed?: string;
  defects?: string;
  custom_step_results?: TestRailStep[];
}

export interface AddResultPayload {
  status_id: number;
  comment?: string;
  version?: string;
  elapsed?: string;
  defects?: string;
  assignedto_id?: number;
  custom_step_results?: TestRailStep[];
}

export interface PaginatedResponse<T> {
  offset: number;
  limit: number;
  size: number;
  _links: {
    next?: string;
    prev?: string;
  };
}

export interface CasesResponse extends PaginatedResponse<TestRailCase> {
  cases: TestRailCase[];
}

export interface RunsResponse extends PaginatedResponse<TestRailRun> {
  runs: TestRailRun[];
}

export interface SuitesResponse extends PaginatedResponse<TestRailSuite> {
  suites: TestRailSuite[];
}

export interface SectionsResponse extends PaginatedResponse<TestRailSection> {
  sections: TestRailSection[];
}

export interface ResultsResponse extends PaginatedResponse<TestRailResult> {
  results: TestRailResult[];
}

export interface ProjectsResponse extends PaginatedResponse<TestRailProject> {
  projects: TestRailProject[];
}

// ============================================================================
// Client
// ============================================================================

export class TestRailClient {
  private client: AxiosInstance;
  private maxRetries: number;
  private retryOnRateLimit: boolean;

  constructor(config: TestRailConfig) {
    this.maxRetries = config.maxRetries ?? 3;
    this.retryOnRateLimit = config.retryOnRateLimit ?? true;

    const auth = Buffer.from(`${config.username}:${config.apiKey}`).toString('base64');

    this.client = axios.create({
      baseURL: `${config.baseUrl}/index.php?`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${auth}`,
      },
    });
  }

  private async request<T>(
    method: 'GET' | 'POST',
    endpoint: string,
    data?: unknown,
    attempt = 1,
  ): Promise<T> {
    try {
      const response: AxiosResponse<T> = await this.client.request({
        method,
        url: endpoint,
        data,
      });
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 429 && this.retryOnRateLimit && attempt <= this.maxRetries) {
        const retryAfter = error.response.headers['retry-after'] || 5;
        console.warn(
          `Rate limited. Retrying in ${retryAfter}s (attempt ${attempt}/${this.maxRetries})`,
        );
        await this.sleep(retryAfter * 1000);
        return this.request(method, endpoint, data, attempt + 1);
      }
      throw error;
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // -------------------------------------------------------------------------
  // Projects
  // -------------------------------------------------------------------------

  async getProjects(isCompleted?: boolean): Promise<TestRailProject[]> {
    let endpoint = '/api/v2/get_projects';
    if (isCompleted !== undefined) {
      endpoint += `&is_completed=${isCompleted ? 1 : 0}`;
    }
    const response = await this.request<ProjectsResponse>('GET', endpoint);
    return response.projects;
  }

  async getProject(projectId: number): Promise<TestRailProject> {
    return this.request<TestRailProject>('GET', `/api/v2/get_project/${projectId}`);
  }

  // -------------------------------------------------------------------------
  // Suites
  // -------------------------------------------------------------------------

  async getSuites(projectId: number): Promise<TestRailSuite[]> {
    const response = await this.request<SuitesResponse>('GET', `/api/v2/get_suites/${projectId}`);
    return response.suites;
  }

  async getSuite(suiteId: number): Promise<TestRailSuite> {
    return this.request<TestRailSuite>('GET', `/api/v2/get_suite/${suiteId}`);
  }

  // -------------------------------------------------------------------------
  // Sections
  // -------------------------------------------------------------------------

  async getSections(projectId: number, suiteId?: number): Promise<TestRailSection[]> {
    let endpoint = `/api/v2/get_sections/${projectId}`;
    if (suiteId) {
      endpoint += `&suite_id=${suiteId}`;
    }
    const response = await this.request<SectionsResponse>('GET', endpoint);
    return response.sections;
  }

  async getSection(sectionId: number): Promise<TestRailSection> {
    return this.request<TestRailSection>('GET', `/api/v2/get_section/${sectionId}`);
  }

  // -------------------------------------------------------------------------
  // Cases
  // -------------------------------------------------------------------------

  async getCases(
    projectId: number,
    options?: {
      suiteId?: number;
      sectionId?: number;
      filter?: string;
      limit?: number;
      offset?: number;
      priorityIds?: number[];
      typeIds?: number[];
    },
  ): Promise<TestRailCase[]> {
    let endpoint = `/api/v2/get_cases/${projectId}`;
    const params: string[] = [];

    if (options?.suiteId) params.push(`suite_id=${options.suiteId}`);
    if (options?.sectionId) params.push(`section_id=${options.sectionId}`);
    if (options?.filter) params.push(`filter=${encodeURIComponent(options.filter)}`);
    if (options?.limit) params.push(`limit=${options.limit}`);
    if (options?.offset) params.push(`offset=${options.offset}`);
    if (options?.priorityIds?.length) params.push(`priority_id=${options.priorityIds.join(',')}`);
    if (options?.typeIds?.length) params.push(`type_id=${options.typeIds.join(',')}`);

    if (params.length) {
      endpoint += '&' + params.join('&');
    }

    const response = await this.request<CasesResponse>('GET', endpoint);
    return response.cases;
  }

  async getAllCases(projectId: number, suiteId?: number): Promise<TestRailCase[]> {
    const allCases: TestRailCase[] = [];
    let offset = 0;
    const limit = 250;

    while (true) {
      const cases = await this.getCases(projectId, { suiteId, limit, offset });
      allCases.push(...cases);

      if (cases.length < limit) break;
      offset += limit;
    }

    return allCases;
  }

  async getCase(caseId: number): Promise<TestRailCase> {
    return this.request<TestRailCase>('GET', `/api/v2/get_case/${caseId}`);
  }

  // -------------------------------------------------------------------------
  // Runs
  // -------------------------------------------------------------------------

  async getRuns(
    projectId: number,
    options?: {
      isCompleted?: boolean;
      suiteId?: number;
      milestoneId?: number;
      limit?: number;
      offset?: number;
    },
  ): Promise<TestRailRun[]> {
    let endpoint = `/api/v2/get_runs/${projectId}`;
    const params: string[] = [];

    if (options?.isCompleted !== undefined)
      params.push(`is_completed=${options.isCompleted ? 1 : 0}`);
    if (options?.suiteId) params.push(`suite_id=${options.suiteId}`);
    if (options?.milestoneId) params.push(`milestone_id=${options.milestoneId}`);
    if (options?.limit) params.push(`limit=${options.limit}`);
    if (options?.offset) params.push(`offset=${options.offset}`);

    if (params.length) {
      endpoint += '&' + params.join('&');
    }

    const response = await this.request<RunsResponse>('GET', endpoint);
    return response.runs;
  }

  async getRun(runId: number): Promise<TestRailRun> {
    return this.request<TestRailRun>('GET', `/api/v2/get_run/${runId}`);
  }

  // -------------------------------------------------------------------------
  // Results
  // -------------------------------------------------------------------------

  async getResultsForCase(runId: number, caseId: number): Promise<TestRailResult[]> {
    const response = await this.request<ResultsResponse>(
      'GET',
      `/api/v2/get_results_for_case/${runId}/${caseId}`,
    );
    return response.results;
  }

  async addResultForCase(
    runId: number,
    caseId: number,
    result: AddResultPayload,
  ): Promise<TestRailResult> {
    return this.request<TestRailResult>(
      'POST',
      `/api/v2/add_result_for_case/${runId}/${caseId}`,
      result,
    );
  }

  async addResultsForCases(
    runId: number,
    results: Array<AddResultPayload & { case_id: number }>,
  ): Promise<TestRailResult[]> {
    return this.request<TestRailResult[]>('POST', `/api/v2/add_results_for_cases/${runId}`, {
      results,
    });
  }
}

// ============================================================================
// Factory function for easy instantiation
// ============================================================================

export function createTestRailClient(config?: Partial<TestRailConfig>): TestRailClient {
  const baseUrl = config?.baseUrl ?? process.env.TESTRAIL_URL ?? 'https://sessionm.testrail.com';
  const username = config?.username ?? process.env.TESTRAIL_USER;
  const apiKey = config?.apiKey ?? process.env.TESTRAIL_API_KEY;

  if (!username) {
    throw new Error(
      'TestRail username required. Set TESTRAIL_USER environment variable or pass in config.',
    );
  }
  if (!apiKey) {
    throw new Error(
      'TestRail API key required. Set TESTRAIL_API_KEY environment variable or pass in config.',
    );
  }

  return new TestRailClient({
    baseUrl,
    username,
    apiKey,
    retryOnRateLimit: config?.retryOnRateLimit ?? true,
    maxRetries: config?.maxRetries ?? 3,
  });
}

export default TestRailClient;
