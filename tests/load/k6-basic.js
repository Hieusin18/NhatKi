/**
 * k6 Load Test — Setlog REST API
 * Run: k6 run tests/load/k6-basic.js --env BASE_URL=http://localhost:4000
 *
 * Targets:
 *   - p95 latency < 500ms under 50 VUs
 *   - Error rate < 1%
 */
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const BASE_URL = __ENV.BASE_URL || 'https://api.setlog.app';

export const options = {
  stages: [
    { duration: '30s', target: 10 },   // ramp up
    { duration: '1m',  target: 50 },   // steady load
    { duration: '20s', target: 0 },    // ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],   // 95% requests < 500ms
    http_req_failed:   ['rate<0.01'],   // < 1% errors
  },
};

const errorRate = new Rate('errors');
const loginDuration = new Trend('login_duration');

export default function () {
  // Health check
  const health = http.get(`${BASE_URL}/health`);
  check(health, { 'health OK': (r) => r.status === 200 });
  errorRate.add(health.status !== 200);

  // Auth — register + login cycle
  const email = `loadtest_${Date.now()}_${Math.random().toString(36).slice(2)}@test.com`;
  const payload = JSON.stringify({ username: email.split('@')[0], email, password: 'Test@1234' });
  const headers = { 'Content-Type': 'application/json' };

  const register = http.post(`${BASE_URL}/auth/register`, payload, { headers });
  check(register, { 'register 201': (r) => r.status === 201 });

  const start = Date.now();
  const login = http.post(`${BASE_URL}/auth/login`, JSON.stringify({ email, password: 'Test@1234' }), { headers });
  loginDuration.add(Date.now() - start);
  check(login, { 'login 200': (r) => r.status === 200 });

  if (login.status === 200) {
    const token = login.json('token');
    const authHeaders = { ...headers, Authorization: `Bearer ${token}` };

    // Read timeline
    const timeline = http.get(`${BASE_URL}/diary/timeline?page=1&limit=10`, { headers: authHeaders });
    check(timeline, { 'timeline 200': (r) => r.status === 200 });
    errorRate.add(timeline.status !== 200);
  }

  sleep(1);
}
