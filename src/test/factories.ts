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
    certificationName: 'AWS Solutions Architect Associate',
    vendorName: 'Amazon Web Services',
    certificationNumber: 'TEST-123',
    issueDate: '2024-01-01',
    expirationDate: '2027-01-01',
    status: 'active',
    daysUntilExpiration: 1095,
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
}

export const mockClerkAuth = (userId: string | null = 'user_test123') => {
  const { auth } = require('@clerk/tanstack-react-start/server')
  auth.mockResolvedValue({ userId })
}

export const mockDatabase = (mockData: any = {}) => {
  return {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    returning: vi.fn().mockResolvedValue([mockData]),
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
  }
}
