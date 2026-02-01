require('dotenv').config({ path: './.env.local' });
const connectDB = require('./src/lib/mongodb');
const Officer = require('./src/schemas/Officer');
const Duty = require('./src/schemas/Duty');

async function checkTestAccounts() {
  await connectDB();
  console.log('🔍 Checking available test accounts...\n');

  try {
    // Get all officers
    const officers = await Officer.find({}).sort({ role: 1, name: 1 });
    
    console.log('📋 Available Accounts:\n');
    
    // Separate officers and supervisors
    const officerAccounts = officers.filter(o => o.role === 'Officer');
    const supervisorAccounts = officers.filter(o => o.role === 'Supervisor');
    
    console.log('👮‍♂️ OFFICER ACCOUNTS:');
    console.log('=' .repeat(50));
    for (const officer of officerAccounts) {
      console.log(`Username: ${officer.officerId}`);
      console.log(`Name: ${officer.name}`);
      console.log(`Rank: ${officer.rank}`);
      console.log(`Password: password123`);
      console.log(`Status: ${officer.currentStatus}`);
      console.log(`Email: ${officer.email}`);
      console.log('-'.repeat(30));
    }
    
    console.log('\n👨‍💼 SUPERVISOR ACCOUNTS:');
    console.log('=' .repeat(50));
    for (const supervisor of supervisorAccounts) {
      console.log(`Username: ${supervisor.officerId}`);
      console.log(`Name: ${supervisor.name}`);
      console.log(`Rank: ${supervisor.rank}`);
      console.log(`Password: password123`);
      console.log(`Status: ${supervisor.currentStatus}`);
      console.log(`Email: ${supervisor.email}`);
      console.log('-'.repeat(30));
    }

    // Check for officers with active duties
    console.log('\n📋 OFFICERS WITH ACTIVE DUTIES:');
    console.log('=' .repeat(50));
    const activeDuties = await Duty.find({ status: 'Active' }).populate('officer', 'officerId name rank');
    
    if (activeDuties.length === 0) {
      console.log('❌ No officers with active duties found.');
      console.log('💡 Officers need to clock in first to have active duties.');
    } else {
      for (const duty of activeDuties) {
        console.log(`Officer: ${duty.officer.name} (${duty.officer.officerId})`);
        console.log(`Duty: ${duty.bandobastName}`);
        console.log(`Location: ${duty.post}, ${duty.zone}`);
        console.log(`Status: ${duty.status}`);
        console.log('-'.repeat(30));
      }
    }

    // Check for pending checkout requests
    console.log('\n📋 PENDING CHECKOUT REQUESTS:');
    console.log('=' .repeat(50));
    const pendingDuties = await Duty.find({ status: 'Checkout Pending' }).populate('officer', 'officerId name rank');
    
    if (pendingDuties.length === 0) {
      console.log('✅ No pending checkout requests.');
    } else {
      for (const duty of pendingDuties) {
        console.log(`Officer: ${duty.officer.name} (${duty.officer.officerId})`);
        console.log(`Duty: ${duty.bandobastName}`);
        console.log(`Location: ${duty.post}, ${duty.zone}`);
        console.log(`Status: ${duty.status}`);
        console.log('-'.repeat(30));
      }
    }

    console.log('\n🎯 RECOMMENDED TEST ACCOUNTS:');
    console.log('=' .repeat(50));
    
    if (officerAccounts.length > 0) {
      const testOfficer = officerAccounts[0];
      console.log(`👮‍♂️ OFFICER: ${testOfficer.officerId} (${testOfficer.name})`);
      console.log(`   Password: password123`);
      console.log(`   Use this to test checkout request functionality`);
    }
    
    if (supervisorAccounts.length > 0) {
      const testSupervisor = supervisorAccounts[0];
      console.log(`👨‍💼 SUPERVISOR: ${testSupervisor.officerId} (${testSupervisor.name})`);
      console.log(`   Password: password123`);
      console.log(`   Use this to test checkout approval/denial functionality`);
    }

  } catch (error) {
    console.error('❌ Error checking accounts:', error.message);
  } finally {
    process.exit(0);
  }
}

checkTestAccounts();
