/**
 * Re-exports the integrated report export module. The implementation lives in
 * `@/container/reports/AnalyticsExport` and is kept here so existing import
 * sites (the `/analytics/export` page and the analytics metrics step) continue
 * to work unchanged.
 */
export { ReportDownloadsPanel } from '@/container/reports/AnalyticsExport'
