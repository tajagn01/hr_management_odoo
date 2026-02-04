// Simple test to check what the API returns
async function testAPI() {
  const year = 2026;
  const month = 1; // January
  
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);
  startDate.setHours(0, 0, 0, 0);
  endDate.setHours(23, 59, 59, 999);
  
  console.log('🧪 Testing API Response...\n');
  console.log(`Date Range: ${startDate.toISOString()} to ${endDate.toISOString()}\n`);
  
  const url = `http://localhost:3000/api/attendance?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`;
  
  console.log(`Calling: ${url}\n`);
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.error) {
      console.log('❌ Error:', data.error);
      return;
    }
    
    const records = data.attendanceRecords || [];
    console.log(`📊 Total Records Returned: ${records.length}\n`);
    
    if (records.length === 0) {
      console.log('⚠️  No records returned!');
      return;
    }
    
    // Group by day
    const byDay = new Map<number, number>();
    records.forEach((r: any) => {
      const day = new Date(r.date).getDate();
      byDay.set(day, (byDay.get(day) || 0) + 1);
    });
    
    console.log('📅 Records by Day:\n');
    for (let day = 1; day <= 31; day++) {
      const count = byDay.get(day) || 0;
      if (count > 0) {
        console.log(`   Day ${day.toString().padStart(2, ' ')}: ${count} records`);
      } else {
        console.log(`   Day ${day.toString().padStart(2, ' ')}: 0 records ❌`);
      }
    }
    
    // Show first and last record
    console.log('\n📝 First Record:');
    console.log(`   Date: ${records[0].date}`);
    console.log(`   Day: ${new Date(records[0].date).getDate()}`);
    console.log(`   Status: ${records[0].status}`);
    
    console.log('\n📝 Last Record:');
    const last = records[records.length - 1];
    console.log(`   Date: ${last.date}`);
    console.log(`   Day: ${new Date(last.date).getDate()}`);
    console.log(`   Status: ${last.status}`);
    
  } catch (error) {
    console.error('❌ Fetch Error:', error);
  }
}

testAPI();
