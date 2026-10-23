// Quick check: login as Admin Humas and try to access /pengguna page backend
const test = async () => {
  const loginRes = await fetch('http://localhost:3001/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'komang.ari', password: 'admin123' })
  });
  const loginData = await loginRes.json();
  const token = loginData.token || loginData.accessToken;
  const user = loginData.user;
  console.log('User role:', user?.role);

  // Test GET /users
  const usersRes = await fetch('http://localhost:3001/api/users', {
    headers: { Authorization: `Bearer ${token}` }
  });
  console.log('GET /users status:', usersRes.status);

  // Try to create a user (POST)
  const createRes = await fetch('http://localhost:3001/api/users', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      fullName: 'Test User',
      username: 'test.user.xyz999',
      email: 'test.xyz999@polinela.ac.id',
      password: 'polinela123',
      role: 'USER',
      roleLabel: 'Anggota Humas',
      status: 'AKTIF'
    })
  });
  console.log('POST /users status:', createRes.status);
  const createData = await createRes.json();
  console.log('Create result:', createData.id || createData.message || JSON.stringify(createData).slice(0,100));

  // Clean up: delete if created
  if (createData.id) {
    const delRes = await fetch(`http://localhost:3001/api/users/${createData.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('DELETE cleanup status:', delRes.status);
  }
};

test().catch(console.error);
