// Installation Detail Debug Helper
// Add this to browser console to test the API directly

async function testInstallationDetailAPI(installationId) {
  console.log('🧪 Testing Installation Detail API...');
  console.log('Installation ID:', installationId);
  
  const token = document.cookie.split('; ').find(row => row.startsWith('token='))?.split('=')[1];
  if (!token) {
    console.error('❌ No auth token found in cookies');
    return;
  }
  
  const apiHost = window.location.hostname === 'localhost' 
    ? `http://localhost:3001` 
    : `http://${window.location.hostname}:3001`;
  
  console.log('API Host:', apiHost);
  
  const url = `${apiHost}/api/admin/customer-installation/report/complete/${installationId}`;
  console.log('Request URL:', url);
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('Response Status:', response.status);
    console.log('Response OK:', response.ok);
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ API Error:', errorData);
      return;
    }
    
    const data = await response.json();
    console.log('✅ API Response:', data);
    
    // Check data structure
    const report = data?.data?.data || data?.data || data;
    console.log('📊 Parsed Report:', report);
    
    if (report && report.installation_id) {
      console.log('✅ Report loaded successfully!');
      console.log('Customer:', report.customer_name);
      console.log('Status:', report.installation_status);
    } else {
      console.warn('⚠️ Report data structure unexpected');
    }
    
  } catch (error) {
    console.error('❌ Fetch Error:', error);
  }
}

// Usage: testInstallationDetailAPI('your-installation-id-here')
console.log('✅ Debug helper loaded. Use: testInstallationDetailAPI("installation-id")');
