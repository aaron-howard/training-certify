import { createFileRoute } from '@tanstack/react-router'
import { json } from '@tanstack/react-start'
import { getDb } from '../db/db.server'
import { certifications } from '../db/schema'

// Sample certification data
const sampleCertifications = [
    // Microsoft
    { id: 'az-900', name: 'Microsoft Azure Fundamentals (AZ-900)', vendorId: 'microsoft', vendorName: 'Microsoft', category: 'Cloud', difficulty: 'Beginner' },
    { id: 'az-104', name: 'Microsoft Azure Administrator (AZ-104)', vendorId: 'microsoft', vendorName: 'Microsoft', category: 'Cloud', difficulty: 'Intermediate' },
    { id: 'az-305', name: 'Microsoft Azure Solutions Architect Expert (AZ-305)', vendorId: 'microsoft', vendorName: 'Microsoft', category: 'Cloud', difficulty: 'Expert' },
    { id: 'az-400', name: 'Microsoft Azure DevOps Engineer Expert (AZ-400)', vendorId: 'microsoft', vendorName: 'Microsoft', category: 'Cloud', difficulty: 'Expert' },
    { id: 'sc-900', name: 'Microsoft Security, Compliance, and Identity Fundamentals (SC-900)', vendorId: 'microsoft', vendorName: 'Microsoft', category: 'Security', difficulty: 'Beginner' },

    // ServiceNow
    { id: 'csa', name: 'ServiceNow Certified System Administrator', vendorId: 'servicenow', vendorName: 'ServiceNow', category: 'Cloud', difficulty: 'Intermediate' },
    { id: 'cad', name: 'ServiceNow Certified Application Developer', vendorId: 'servicenow', vendorName: 'ServiceNow', category: 'Cloud', difficulty: 'Advanced' },
    { id: 'cis-itsm', name: 'ServiceNow CIS - IT Service Management', vendorId: 'servicenow', vendorName: 'ServiceNow', category: 'Cloud', difficulty: 'Advanced' },

    // AWS
    { id: 'aws-ccp', name: 'AWS Certified Cloud Practitioner', vendorId: 'aws', vendorName: 'Amazon Web Services', category: 'Cloud', difficulty: 'Beginner' },
    { id: 'aws-saa', name: 'AWS Solutions Architect Associate', vendorId: 'aws', vendorName: 'Amazon Web Services', category: 'Cloud', difficulty: 'Intermediate' },
    { id: 'aws-sap', name: 'AWS Solutions Architect Professional', vendorId: 'aws', vendorName: 'Amazon Web Services', category: 'Cloud', difficulty: 'Expert' },

    // Google Cloud
    { id: 'gcp-ace', name: 'Google Cloud Associate Cloud Engineer', vendorId: 'google', vendorName: 'Google Cloud', category: 'Cloud', difficulty: 'Intermediate' },
    { id: 'gcp-pca', name: 'Google Cloud Professional Cloud Architect', vendorId: 'google', vendorName: 'Google Cloud', category: 'Cloud', difficulty: 'Expert' },

    // Security
    { id: 'cissp', name: 'Certified Information Systems Security Professional (CISSP)', vendorId: 'isc2', vendorName: 'ISC²', category: 'Security', difficulty: 'Expert' },
    { id: 'security-plus', name: 'CompTIA Security+', vendorId: 'comptia', vendorName: 'CompTIA', category: 'Security', difficulty: 'Intermediate' },
]

export const Route = createFileRoute('/api/seed')({
    server: {
        handlers: {
            POST: async () => {
                try {
                    const db = await getDb()
                    if (!db) {
                        return json({ error: 'Database not available' }, { status: 500 })
                    }

                    let added = 0
                    let skipped = 0

                    for (const cert of sampleCertifications) {
                        try {
                            await db.insert(certifications).values({
                                id: cert.id,
                                name: cert.name,
                                vendorId: cert.vendorId,
                                vendorName: cert.vendorName,
                                category: cert.category,
                                difficulty: cert.difficulty,
                            }).onConflictDoNothing()
                            added++
                        } catch (err: any) {
                            // Already exists or other error
                            if (err.code === '23505') {
                                skipped++
                            } else {
                                console.error(`Failed to seed ${cert.id}:`, err.message)
                            }
                        }
                    }

                    console.log(`✅ [Seed] Added ${added} certifications, skipped ${skipped}`)
                    return json({
                        success: true,
                        added,
                        skipped,
                        total: sampleCertifications.length
                    })
                } catch (error) {
                    console.error('[API Seed] Error:', error)
                    return json({ error: 'Failed to seed catalog' }, { status: 500 })
                }
            }
        }
    }
})
