const { sendDutyNotificationEmail } = require('./src/config/email');

async function testEmailWithLink() {
  console.log('📧 Testing email with clock-in link...\n');
  
  try {
    const dutyDetails = {
      bandobastName: 'Test Patrol Duty with Link',
      post: 'Test Post 1',
      zone: 'Zone A',
      sector: 'Test Sector',
      dutyDate: '2024-01-20',
      shift: 'Morning'
    };
    
    const result = await sendDutyNotificationEmail(
      'Test Officer', 
      'yunoa315@gmail.com', 
      dutyDetails
    );
    
    console.log('Result:', result);
    console.log('\n📧 Check your Gmail inbox for the email with the clock-in link!');
    console.log('🔗 The link should take you to: http://localhost:8081/login?redirect=/dashboard');
    
  } catch (error) {
    console.error('❌ Email test failed:', error.message);
  }
}

testEmailWithLink();
