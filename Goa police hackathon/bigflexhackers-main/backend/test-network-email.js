const { sendDutyNotificationEmail } = require('./src/config/email');

async function testNetworkEmail() {
  console.log('📧 Testing email with network IP link...\n');
  
  try {
    const dutyDetails = {
      bandobastName: 'Network Test Duty',
      post: 'Network Post 1',
      zone: 'Zone A',
      sector: 'Network Sector',
      dutyDate: '2024-01-20',
      shift: 'Morning'
    };
    
    const result = await sendDutyNotificationEmail(
      'Test Officer', 
      'yunoa315@gmail.com', 
      dutyDetails
    );
    
    console.log('Result:', result);
    console.log('\n📧 Check your Gmail inbox for the email with the network IP link!');
    console.log('🔗 The link should now be: http://10.30.44.14:8081/login?redirect=/dashboard');
    console.log('🌐 This will work on all devices connected to the same network!');
    
  } catch (error) {
    console.error('❌ Email test failed:', error.message);
  }
}

testNetworkEmail();
