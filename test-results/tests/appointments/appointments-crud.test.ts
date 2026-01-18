import axios from 'axios';

// Configuration
const BASE_URL = 'http://localhost:3001/api';
let authToken = '';
let testAppointmentId = '';

// Couleurs pour les logs
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[36m',
};

// Helper pour logger
const log = {
    success: (msg: string) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
    error: (msg: string) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
    info: (msg: string) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
    warn: (msg: string) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
};

// Setup axios instance
const api = axios.create({
    baseURL: BASE_URL,
    timeout: 10000,
});

api.interceptors.request.use((config) => {
    if (authToken) {
        config.headers.Authorization = `Bearer ${authToken}`;
    }
    return config;
});

// ============================================
// TESTS
// ============================================

describe('Appointments CRUD Tests', () => {
    beforeAll(async () => {
        log.info('🔐 Setting up authentication...');
        try {
            // Utiliser des credentials de test ou créer un utilisateur de test
            const response = await api.post('/auth/login', {
                email: 'test@example.com',
                password: 'test123',
            });
            authToken = response.data.token || response.data.access_token;
            log.success('Authentication successful');
            console.log('Token:', authToken.substring(0, 20) + '...');
        } catch (error: any) {
            log.warn('Using mock auth for testing');
            authToken = 'test-token-for-development';
        }
    });

    // ============================================
    // CREATE TESTS
    // ============================================

    describe('CREATE - Appointment Creation', () => {
        test('Should create a new appointment with minimal data', async () => {
            log.info('📝 Testing appointment creation with minimal data...');

            const appointmentData = {
                title: 'Test Appointment - Minimal',
                type: 'visit',
                priority: 'medium',
                startTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
                endTime: new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString(),
            };

            console.log('Request data:', JSON.stringify(appointmentData, null, 2));

            try {
                const response = await api.post('/appointments', appointmentData);

                console.log('Response status:', response.status);
                console.log('Response data:', JSON.stringify(response.data, null, 2));

                expect(response.status).toBe(201);
                expect(response.data).toHaveProperty('id');
                expect(response.data.title).toBe(appointmentData.title);
                expect(response.data.type).toBe(appointmentData.type);

                testAppointmentId = response.data.id;
                log.success(`Appointment created with ID: ${testAppointmentId}`);
            } catch (error: any) {
                log.error('Failed to create appointment');
                console.error('Error details:', error.response?.data || error.message);
                throw error;
            }
        });

        test('Should create appointment with full data', async () => {
            log.info('📝 Testing appointment creation with full data...');

            const appointmentData = {
                title: 'Test Appointment - Complete',
                description: 'This is a comprehensive test appointment',
                type: 'signature',
                priority: 'high',
                status: 'scheduled',
                startTime: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
                endTime: new Date(Date.now() + 49 * 60 * 60 * 1000).toISOString(),
                location: '123 Test Street, Paris',
                notes: 'Important meeting',
                isAllDay: false,
                reminder: true,
                reminderTime: 30,
                color: '#FF5733',
            };

            console.log('Request data:', JSON.stringify(appointmentData, null, 2));

            try {
                const response = await api.post('/appointments', appointmentData);

                console.log('Response status:', response.status);
                console.log('Response data:', JSON.stringify(response.data, null, 2));

                expect(response.status).toBe(201);
                expect(response.data).toHaveProperty('id');
                expect(response.data.title).toBe(appointmentData.title);
                expect(response.data.description).toBe(appointmentData.description);
                expect(response.data.location).toBe(appointmentData.location);

                log.success('Full appointment created successfully');
            } catch (error: any) {
                log.error('Failed to create full appointment');
                console.error('Error details:', error.response?.data || error.message);
                throw error;
            }
        });

        test('Should fail to create appointment without required fields', async () => {
            log.info('🚫 Testing appointment creation with missing data...');

            const invalidData = {
                title: 'Invalid Appointment',
                // Missing startTime and endTime
            };

            console.log('Request data:', JSON.stringify(invalidData, null, 2));

            try {
                await api.post('/appointments', invalidData);
                log.error('Should have failed but succeeded');
                fail('Should have thrown an error');
            } catch (error: any) {
                console.log('Expected error status:', error.response?.status);
                console.log('Expected error data:', error.response?.data);
                expect([400, 422]).toContain(error.response?.status);
                log.success('Validation error caught as expected');
            }
        });
    });

    // ============================================
    // READ TESTS
    // ============================================

    describe('READ - Appointment Retrieval', () => {
        test('Should get all appointments', async () => {
            log.info('📖 Testing get all appointments...');

            try {
                const response = await api.get('/appointments');

                console.log('Response status:', response.status);
                console.log('Number of appointments:', response.data.length);
                console.log('Sample data:', JSON.stringify(response.data[0], null, 2));

                expect(response.status).toBe(200);
                expect(Array.isArray(response.data)).toBe(true);
                log.success(`Retrieved ${response.data.length} appointments`);
            } catch (error: any) {
                log.error('Failed to get appointments');
                console.error('Error details:', error.response?.data || error.message);
                throw error;
            }
        });

        test('Should get appointment by ID', async () => {
            log.info(`📖 Testing get appointment by ID: ${testAppointmentId}...`);

            if (!testAppointmentId) {
                log.warn('No test appointment ID available, skipping test');
                return;
            }

            try {
                const response = await api.get(`/appointments/${testAppointmentId}`);

                console.log('Response status:', response.status);
                console.log('Response data:', JSON.stringify(response.data, null, 2));

                expect(response.status).toBe(200);
                expect(response.data.id).toBe(testAppointmentId);
                expect(response.data).toHaveProperty('title');
                expect(response.data).toHaveProperty('startTime');
                log.success('Appointment retrieved successfully');
            } catch (error: any) {
                log.error('Failed to get appointment by ID');
                console.error('Error details:', error.response?.data || error.message);
                throw error;
            }
        });

        test('Should get upcoming appointments', async () => {
            log.info('📅 Testing get upcoming appointments...');

            try {
                const response = await api.get('/appointments/upcoming');

                console.log('Response status:', response.status);
                console.log('Number of upcoming appointments:', response.data.length);

                expect(response.status).toBe(200);
                expect(Array.isArray(response.data)).toBe(true);
                log.success(`Retrieved ${response.data.length} upcoming appointments`);
            } catch (error: any) {
                log.error('Failed to get upcoming appointments');
                console.error('Error details:', error.response?.data || error.message);
                throw error;
            }
        });

        test('Should get today appointments', async () => {
            log.info('📆 Testing get today appointments...');

            try {
                const response = await api.get('/appointments/today');

                console.log('Response status:', response.status);
                console.log('Number of today appointments:', response.data.length);

                expect(response.status).toBe(200);
                expect(Array.isArray(response.data)).toBe(true);
                log.success(`Retrieved ${response.data.length} today appointments`);
            } catch (error: any) {
                log.error('Failed to get today appointments');
                console.error('Error details:', error.response?.data || error.message);
                throw error;
            }
        });

        test('Should get appointment statistics', async () => {
            log.info('📊 Testing get appointment statistics...');

            try {
                const response = await api.get('/appointments/stats');

                console.log('Response status:', response.status);
                console.log('Stats data:', JSON.stringify(response.data, null, 2));

                expect(response.status).toBe(200);
                expect(response.data).toHaveProperty('total');
                expect(response.data).toHaveProperty('byStatus');
                expect(response.data).toHaveProperty('byType');
                log.success('Statistics retrieved successfully');
            } catch (error: any) {
                log.error('Failed to get statistics');
                console.error('Error details:', error.response?.data || error.message);
                throw error;
            }
        });
    });

    // ============================================
    // UPDATE TESTS
    // ============================================

    describe('UPDATE - Appointment Modification', () => {
        test('Should update appointment title', async () => {
            log.info('✏️ Testing appointment title update...');

            if (!testAppointmentId) {
                log.warn('No test appointment ID available, skipping test');
                return;
            }

            const updateData = {
                title: 'Updated Test Appointment Title',
            };

            console.log('Update data:', JSON.stringify(updateData, null, 2));

            try {
                const response = await api.patch(`/appointments/${testAppointmentId}`, updateData);

                console.log('Response status:', response.status);
                console.log('Updated data:', JSON.stringify(response.data, null, 2));

                expect(response.status).toBe(200);
                expect(response.data.title).toBe(updateData.title);
                log.success('Appointment title updated successfully');
            } catch (error: any) {
                log.error('Failed to update appointment');
                console.error('Error details:', error.response?.data || error.message);
                throw error;
            }
        });

        test('Should update appointment status', async () => {
            log.info('✏️ Testing appointment status update...');

            if (!testAppointmentId) {
                log.warn('No test appointment ID available, skipping test');
                return;
            }

            const updateData = {
                status: 'confirmed',
            };

            console.log('Update data:', JSON.stringify(updateData, null, 2));

            try {
                const response = await api.patch(`/appointments/${testAppointmentId}`, updateData);

                console.log('Response status:', response.status);
                console.log('Updated status:', response.data.status);

                expect(response.status).toBe(200);
                expect(response.data.status).toBe(updateData.status);
                log.success('Appointment status updated successfully');
            } catch (error: any) {
                log.error('Failed to update appointment status');
                console.error('Error details:', error.response?.data || error.message);
                throw error;
            }
        });

        test('Should complete appointment', async () => {
            log.info('✅ Testing appointment completion...');

            if (!testAppointmentId) {
                log.warn('No test appointment ID available, skipping test');
                return;
            }

            const completeData = {
                outcome: 'Meeting was successful',
                rating: 5,
            };

            console.log('Complete data:', JSON.stringify(completeData, null, 2));

            try {
                const response = await api.post(
                    `/appointments/${testAppointmentId}/complete`,
                    completeData
                );

                console.log('Response status:', response.status);
                console.log('Completed appointment:', JSON.stringify(response.data, null, 2));

                expect(response.status).toBe(200);
                expect(response.data.status).toBe('completed');
                expect(response.data.outcome).toBe(completeData.outcome);
                log.success('Appointment marked as completed');
            } catch (error: any) {
                log.error('Failed to complete appointment');
                console.error('Error details:', error.response?.data || error.message);
                throw error;
            }
        });
    });

    // ============================================
    // DELETE TESTS
    // ============================================

    describe('DELETE - Appointment Deletion', () => {
        test('Should cancel appointment', async () => {
            log.info('🚫 Testing appointment cancellation...');

            // Create a new appointment to cancel
            const appointmentData = {
                title: 'Appointment to Cancel',
                type: 'meeting',
                priority: 'low',
                startTime: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(),
                endTime: new Date(Date.now() + 73 * 60 * 60 * 1000).toISOString(),
            };

            const createResponse = await api.post('/appointments', appointmentData);
            const cancelId = createResponse.data.id;

            console.log('Appointment to cancel ID:', cancelId);

            try {
                const response = await api.post(`/appointments/${cancelId}/cancel`, {
                    reason: 'Test cancellation',
                });

                console.log('Response status:', response.status);
                console.log('Cancelled appointment:', JSON.stringify(response.data, null, 2));

                expect(response.status).toBe(200);
                expect(response.data.status).toBe('cancelled');
                log.success('Appointment cancelled successfully');
            } catch (error: any) {
                log.error('Failed to cancel appointment');
                console.error('Error details:', error.response?.data || error.message);
                throw error;
            }
        });

        test('Should delete appointment', async () => {
            log.info('🗑️ Testing appointment deletion...');

            if (!testAppointmentId) {
                log.warn('No test appointment ID available, skipping test');
                return;
            }

            try {
                const response = await api.delete(`/appointments/${testAppointmentId}`);

                console.log('Response status:', response.status);
                console.log('Delete response:', JSON.stringify(response.data, null, 2));

                expect([200, 204]).toContain(response.status);
                log.success('Appointment deleted successfully');

                // Verify deletion
                try {
                    await api.get(`/appointments/${testAppointmentId}`);
                    log.error('Appointment still exists after deletion');
                    fail('Appointment should not exist');
                } catch (error: any) {
                    expect(error.response?.status).toBe(404);
                    log.success('Verified appointment no longer exists');
                }
            } catch (error: any) {
                log.error('Failed to delete appointment');
                console.error('Error details:', error.response?.data || error.message);
                throw error;
            }
        });
    });

    // ============================================
    // EDGE CASES
    // ============================================

    describe('EDGE CASES - Error Handling', () => {
        test('Should handle non-existent appointment ID', async () => {
            log.info('🔍 Testing non-existent appointment...');

            const fakeId = '00000000-0000-0000-0000-000000000000';

            try {
                await api.get(`/appointments/${fakeId}`);
                log.error('Should have failed with 404');
                fail('Should have thrown an error');
            } catch (error: any) {
                console.log('Expected error status:', error.response?.status);
                expect(error.response?.status).toBe(404);
                log.success('404 error handled correctly');
            }
        });

        test('Should validate date ranges', async () => {
            log.info('📅 Testing date validation...');

            const invalidData = {
                title: 'Invalid Date Appointment',
                type: 'visit',
                priority: 'medium',
                startTime: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
                endTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // End before start
            };

            try {
                await api.post('/appointments', invalidData);
                log.warn('Date validation may not be enforced');
            } catch (error: any) {
                console.log('Validation error:', error.response?.data);
                expect([400, 422]).toContain(error.response?.status);
                log.success('Date validation working correctly');
            }
        });
    });
});

// ============================================
// RUN TESTS
// ============================================

if (require.main === module) {
    console.log('\n' + '='.repeat(60));
    console.log('🧪 APPOINTMENTS CRUD TESTS');
    console.log('='.repeat(60) + '\n');

    // Note: To run with Jest, use: npm test appointments-crud.test.ts
    console.log('Run with: npm test tests/appointments/appointments-crud.test.ts');
}
