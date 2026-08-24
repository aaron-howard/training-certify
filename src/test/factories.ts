/**
 * Test data factories for creating mock data
 */

export const factories = {
  user: (overrides = {}) => ({
    id: 'user_test123',
    name: 'Test User',
    email: 'test@example.com',
    role: 'User',
    avatarUrl: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }),

  admin: (overrides = {}) => ({
    id: 'user_admin123',
    name: 'Admin User',
    email: 'admin@example.com',
    role: 'Admin',
    avatarUrl: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }),

  manager: (overrides = {}) => ({
    id: 'user_manager123',
    name: 'Manager User',
    email: 'manager@example.com',
    role: 'Manager',
    avatarUrl: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }),

  team: (overrides = {}) => ({
    id: 'team_test123',
    name: 'Test Team',
    description: 'A test team',
    managerId: 'user_manager123',
    createdAt: new Date(),
    ...overrides,
  }),

  certification: (overrides = {}) => ({
    id: 'cert_test123',
    userId: 'user_test123',
    certificationId: 'AWS-SAA',
    certificationNumber: 'TEST-123',
    issueDate: new Date('2024-01-01'),
    expirationDate: new Date('2027-01-01'),
    status: 'active',
    documentUrl: null,
    verifiedAt: null,
    assignedById: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }),

  authSession: (overrides = {}) => ({
    userId: 'user_test123',
    role: 'User',
    ...overrides,
  }),

  auditLog: (overrides = {}) => ({
    id: 'audit_test123',
    userId: 'user_test123',
    action: 'Test action',
    resourceType: 'user',
    resourceId: 'user_test123',
    details: null,
    timestamp: new Date(),
    ...overrides,
  }),
}
