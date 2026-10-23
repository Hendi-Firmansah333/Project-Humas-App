/**
 * HUMASS API Load & Stress Testing Script
 * 
 * Penggunaan dengan k6:
 *   k6 run test/load_test.js
 */

export const options = {
  stages: [
    { duration: '10s', target: 20 }, // Ramp-up ke 20 pengguna serentak
    { duration: '30s', target: 50 }, // Pertahankan 50 virtual users selama 30 detik
    { duration: '10s', target: 0 },  // Ramp-down ke 0
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% request harus selesai di bawah 500ms
  },
};

export default function () {
  // Dalam k6 eksekusi request HTTP:
  // const res = http.get('http://localhost:3001/activities');
  // check(res, { 'status is 200 or 401': (r) => r.status === 200 || r.status === 401 });
}
