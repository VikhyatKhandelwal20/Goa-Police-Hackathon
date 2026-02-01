const { 
  sendEmail, 
  sendDutyNotificationEmail, 
  sendGeofenceViolationEmail,
  validateEmailConfig 
} = require('./src/config/email');

async function testEmail() {
  console.log('📧 Testing Gmail Email Configuration...\n');
  
  try {
    // Validate configuration
    validateEmailConfig();
    console.log('✅ Gmail configuration is valid\n');
    
    // Test email (replace with your email)
    const testEmail = process.env.TEST_EMAIL || 'your-email@gmail.com';
    
    console.log('📧 Testing basic email...');
    const basicResult = await sendEmail(
      testEmail,
      'Test Email from Police Deployment System',
      '<h1>Hello!</h1><p>This is a test email from the Police Deployment System.</p>'
    );
    console.log('Result:', basicResult);
    console.log();
    
    console.log('📧 Testing duty notification email...');
    const dutyDetails = {
      bandobastName: 'Test Patrol Duty',
      post: 'Test Post 1',
      zone: 'Zone A',
      sector: 'Test Sector',
      dutyDate: '2024-01-20',
      shift: 'Morning'
    };
    
    const dutyResult = await sendDutyNotificationEmail('Test Officer', testEmail, dutyDetails);
    console.log('Result:', dutyResult);
    console.log();
    
    console.log('📧 Testing geofence violation email...');
    const violationDetails = {
      timeOutsideGeofenceInSeconds: 600,
      distance: 250
    };
    
    const violationResult = await sendGeofenceViolationEmail('Test Officer', testEmail, violationDetails);
    console.log('Result:', violationResult);
    console.log();
    
    console.log('🎉 All email tests completed!');
    
  } catch (error) {
    console.error('❌ Email test failed:', error.message);
    console.log('\n📋 Make sure you have set the following environment variables:');
    console.log('   - GMAIL_USER (your Gmail address)');
    console.log('   - GMAIL_APP_PASSWORD (your Gmail app password)');
    console.log('   - TEST_EMAIL (optional, for testing)');
    console.log('\n📖 See GMAIL_SETUP.md for detailed setup instructions');
  }
}

// Run the test
testEmail();
