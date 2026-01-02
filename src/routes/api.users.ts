import { createFileRoute } from '@tanstack/react-router'
import { json } from '@tanstack/react-start'
import { eq } from 'drizzle-orm'
import { getDb } from '../db/db.server'
import { users, userCertifications, notifications, auditLogs, userTeams, teams } from '../db/schema'



export const Route = createFileRoute('/api/users')({
  server: {
    handlers: {
      // GET all users
      GET: async () => {
        try {
          const db = await getDb()
          if (!db) {
            return json({ error: 'Database not available' }, { status: 500 })
          }
          const allUsers = await db.select().from(users)
          return json(allUsers)
        } catch (error) {
          console.error('❌ [API] Failed to fetch users:', error)
          return json([])
        }
      },
      POST: async ({ request }) => {
        let data: any;
        let db: any;

        try {
          data = await request.json();
          console.log('🔍 [API] Received user data:', data);
          db = await getDb();

          if (!db) {
            return json({ error: 'Database not available' }, { status: 500 });
          }

          // Check if user exists
          const existing = await db.select().from(users).where(eq(users.id, data.id)).limit(1);
          if (existing.length > 0) {
            console.log(`✅ [API] User found: ${data.id} (${existing[0].role})`);
            return json(existing[0]);
          }

          // Create user
          console.log(`🚀 [API] Creating new user: ${data.id}`);
          const result = await db.insert(users).values({
            id: data.id,
            name: data.name,
            email: data.email,
            avatarUrl: data.avatarUrl,
            role: data.role || 'User',
          }).returning();

          return json(result[0], { status: 201 });
        } catch (error) {
          console.error('❌ [API] Failed to ensure user:', error);
          const err: any = error;

          // Handle duplicate email case (same email, different ID)
          // Check top-level code or nested cause code (Drizzle wraps errors)
          const code = err.code || err.cause?.code;
          const detail = err.detail || err.cause?.detail || '';

          if (code === '23505' && detail.includes('email')) {
            if (!data || !db) {
              return json({ error: 'System error during migration prep' }, { status: 500 });
            }

            try {
              console.log('🔄 [API] Detected duplicate email with new ID. Starting migration...');

              // 1. Find the existing user with this email
              const existingUser = await db.select().from(users).where(eq(users.email, data.email)).limit(1);

              if (!existingUser.length) {
                // Should not happen given the error, but safe check
                return json({ error: 'Conflict detected but existing user not found' }, { status: 409 });
              }

              const oldUserId = existingUser[0].id;
              console.log(`🔄 [API] Migrating data from ${oldUserId} to ${data.id}`);

              await db.transaction(async (tx: any) => {
                // 2. Rename old user's email to free up the constraint (append timestamp)
                await tx.update(users)
                  .set({ email: `${data.email}_migrated_${Date.now()}` })
                  .where(eq(users.id, oldUserId));

                // 3. Create the new user
                await tx.insert(users).values({
                  id: data.id,
                  name: data.name,
                  email: data.email,
                  avatarUrl: data.avatarUrl,
                  role: existingUser[0].role || data.role || 'User', // Preserve old role if possible
                });

                // 4. Move related data to new user ID
                // User Certifications
                await tx.update(userCertifications)
                  .set({ userId: data.id })
                  .where(eq(userCertifications.userId, oldUserId));

                // Notifications
                await tx.update(notifications)
                  .set({ userId: data.id })
                  .where(eq(notifications.userId, oldUserId));

                // Audit Logs
                await tx.update(auditLogs)
                  .set({ userId: data.id })
                  .where(eq(auditLogs.userId, oldUserId));

                // User Teams
                await tx.update(userTeams)
                  .set({ userId: data.id })
                  .where(eq(userTeams.userId, oldUserId));

                // Teams (Manager)
                await tx.update(teams)
                  .set({ managerId: data.id })
                  .where(eq(teams.managerId, oldUserId));

                // 5. Delete the old user
                await tx.delete(users).where(eq(users.id, oldUserId));
              });

              console.log('✅ [API] Migration successful');

              // Return the new user object as if nothing happened
              const newUser = await db.select().from(users).where(eq(users.id, data.id)).limit(1);
              return json(newUser[0], { status: 201 });

            } catch (migrationError) {
              console.error('❌ [API] Migration failed:', migrationError);
              return json({
                error: 'Failed to migrate user data',
                details: (migrationError as any).message
              }, { status: 500 });
            }
          }

          if (err.code === '23505') {
            return json({ error: 'User with this ID or email already exists' }, { status: 409 });
          }
          return json({ error: err.message || 'Failed to process user' }, { status: 500 });
        }
      },
      PATCH: async ({ request }) => {
        try {
          const data = await request.json()
          const db = await getDb()
          if (!db) {
            return json({ error: 'Database not available' }, { status: 500 })
          }

          if (!data.id || !data.role) {
            return json({ error: 'Missing id or role' }, { status: 400 })
          }

          console.log(`🔧 [API] Updating user ${data.id} role to: ${data.role}`)
          const result = await db.update(users)
            .set({ role: data.role })
            .where(eq(users.id, data.id))
            .returning()

          if (result.length === 0) {
            return json({ error: 'User not found' }, { status: 404 })
          }

          return json(result[0])
        } catch (error) {
          console.error('❌ [API] Failed to update user:', error)
          return json({ error: 'Failed to update user' }, { status: 500 })
        }
      }
    }
  }
})

