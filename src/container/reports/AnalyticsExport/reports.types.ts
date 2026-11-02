/**
 * Local mirror of the report export types exposed by `npm-pkg-hook`.
 *
 * The hooks package ships without bundled `.d.ts` declarations (its build emits
 * runtime JS only), so TypeScript cannot resolve its exported *types* from the
 * frontend. These interfaces mirror the hook's public contract 1:1 and are used
 * purely for typing; the runtime hooks/components are still imported from
 * `npm-pkg-hook` / `pkg-components`.
 */

/** Export output format. */
export type ReportFormat = 'XLSX' | 'CSV'

/** Report job lifecycle status. */
export type ReportJobStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED'
  | 'EXPIRED'

/** A selectable value for a dynamic filter. */
export interface ReportFilterOption {
  value: string
  label: string
}

/** Definition of a dynamic filter available for a report. */
export interface ReportFilterDefinition {
  key: string
  label: string
  type: string
  multiple: boolean
  options?: ReportFilterOption[] | null
}

/** A column produced by a report. */
export interface ReportFieldDefinition {
  key: string
  label: string
  type: string
}

/** A report available in the catalog. */
export interface ReportDefinition {
  id: string
  name: string
  description: string
  category: string
  enabled: boolean
  disabledReason?: string | null
  supportedFormats: ReportFormat[]
  supportsMultipleSelection: boolean
  filters: ReportFilterDefinition[]
  availableFields: ReportFieldDefinition[]
}

/** A catalog category grouping its reports. */
export interface ReportCatalogCategory {
  category: string
  label: string
  reports: ReportDefinition[]
}

/** Per-report filter values keyed by filter key. */
export type ReportFilterValues = Record<string, string | string[]>

/** Input for an export request. */
export interface ReportExportInput {
  reportIds: string[]
  format: ReportFormat
  startDate: string
  endDate: string
  timezone?: string
  filters?: Record<string, ReportFilterValues>
}

/** A persisted report job. */
export interface ReportJob {
  id: string
  reportIds: string[]
  format: ReportFormat
  startDate: string
  endDate: string
  timezone: string
  status: ReportJobStatus
  progress: number
  stage?: string | null
  recordsProcessed?: number | null
  fileName?: string | null
  fileSize?: number | null
  mimeType?: string | null
  errorMessage?: string | null
  attempts: number
  createdAt: string
  startedAt?: string | null
  finishedAt?: string | null
  durationMs?: number | null
  expiresAt?: string | null
}

/** Return shape of the `useReportsExport` coordinator hook. */
export interface UseReportsExportResult {
  activeJob: ReportJob | null
  isSubmitting: boolean
  isProcessing: boolean
  progress: number
  error: string | null
  recentRequests: ReportJob[]
  isLoadingRecent: boolean
  submit: (input: ReportExportInput) => Promise<ReportJob | null>
  downloadReport: (job: ReportJob) => Promise<boolean>
  cancel: (jobId: string) => Promise<void>
  retry: (jobId: string) => Promise<void>
  refetchRecent: () => void
}

/** Return shape of the `useReportCatalog` hook. */
export interface UseReportCatalogResult {
  categories: ReportCatalogCategory[]
  isLoading: boolean
  error?: Error
  refetch: () => void
}
