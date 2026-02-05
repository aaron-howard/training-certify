import { auditLogs } from '../db/schema'

/**
 * Audit action types for tracking user activities
 */
export type AuditAction =
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'LOGIN'
  | 'LOGOUT'
  | 'ROLE_CHANGE'
  | 'PERMISSION_CHANGE'
  | 'VIEW'
  | 'EXPORT'
  | 'ASSIGN'
  | 'UNASSIGN'

/**
 * Resource types that can be audited
 */
export type AuditResourceType =
  | 'user'
  | 'certification'
  | 'user_certification'
  | 'team'
  | 'notification'
  | 'team_requirement'

/**
 * Creates an audit log entry for tracking important actions
 * 
 * @param userId - The ID of the user performing the action
 * @param action - The type of action being performed
 * @param resourceType - The type of resource being affected
 * @param resourceId - The ID of the specific resource
 * @param details - Optional additional details about the action
 */
export async function createAuditLog(
  userId: string,
  action: AuditAction,
  resourceType: AuditResourceType,
  resourceId: string,
  details?: string
): Promise<void> {
  try {
    const { getDb } = await import('../db/db.server')
    const db = await getDb()
    
    if (!db) {
      console.error('[Audit] Database not available, skipping audit log')
      return
    }

    await db.insert(auditLogs).values({
      userId,
      action,
      resourceType,
      resourceId,
      details,
    })

    console.log(`[Audit] ${action} on ${resourceType}:${resourceId} by ${userId}`)
  } catch (error) {
    // Log audit failures but don't throw - auditing should not break the main flow
    console.error('[Audit] Failed to create audit log:', error)
  }
}

/**
 * Creates an audit log with structured details (JSON serialized)
 */
export async function createAuditLogWithDetails(
  userId: string,
  action: AuditAction,
  resourceType: AuditResourceType,
  resourceId: string,
  details: Record<string, unknown>
): Promise<void> {
  return createAuditLog(
    userId,
    action,
    resourceType,
    resourceId,
    JSON.stringify(details)
  )
}

/**
 * Helper to audit role changes
 */
export async function auditRoleChange(
  performedByUserId: string,
  targetUserId: string,
  oldRole: string,
  newRole: string
): Promise<void> {
  return createAuditLog(
    performedByUserId,
    'ROLE_CHANGE',
    'user',
    targetUserId,
    `Role changed from "${oldRole}" to "${newRole}"`
  )
}

/**
 * Helper to audit certification operations
 */
export async function auditCertificationAction(
  userId: string,
  action: 'CREATE' | 'UPDATE' | 'DELETE',
  certificationId: string,
  certificationName: string,
  additionalDetails?: string
): Promise<void> {
  const details = additionalDetails
    ? `${certificationName}: ${additionalDetails}`
    : certificationName
  
  return createAuditLog(
    userId,
    action,
    'user_certification',
    certificationId,
    details
  )
}
