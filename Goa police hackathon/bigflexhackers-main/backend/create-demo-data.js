require('dotenv').config({ path: '.env.local' });
const connectDB = require('./src/lib/mongodb');
const Officer = require('./src/schemas/Officer');
const Duty = require('./src/schemas/Duty');

async function createDemoData() {
  try {
    console.log('🎭 Creating demo data...');
    await connectDB();
    
    // Create demo officers if they don't exist
    const demoOfficers = [
      {
        officerId: 'DEMO001',
        name: 'John Smith',
        rank: 'Constable',
        role: 'Officer',
        homePoliceStation: 'Panaji Police Station',
        currentStatus: 'Off-Duty',
        isActive: true,
        password: '$2b$10$rQZ8kFzJ8kFzJ8kFzJ8kFzJ8kFzJ8kFzJ8kFzJ8kFzJ8kFzJ8kFzJ8k' // demo123
      },
      {
        officerId: 'DEMO002',
        name: 'Sarah Johnson',
        rank: 'Head Constable',
        role: 'Officer',
        homePoliceStation: 'Margao Police Station',
        currentStatus: 'Off-Duty',
        isActive: true,
        password: '$2b$10$rQZ8kFzJ8kFzJ8kFzJ8kFzJ8kFzJ8kFzJ8kFzJ8kFzJ8kFzJ8kFzJ8k' // demo123
      },
      {
        officerId: 'DEMO003',
        name: 'Amit Patel',
        rank: 'Sub Inspector',
        role: 'Officer',
        homePoliceStation: 'Vasco Police Station',
        currentStatus: 'Off-Duty',
        isActive: true,
        password: '$2b$10$rQZ8kFzJ8kFzJ8kFzJ8kFzJ8kFzJ8kFzJ8kFzJ8kFzJ8kFzJ8kFzJ8k' // demo123
      },
      {
        officerId: 'SUPER001',
        name: 'Supervisor One',
        rank: 'Inspector',
        role: 'Supervisor',
        homePoliceStation: 'Panaji Police Station',
        currentStatus: 'Off-Duty',
        isActive: true,
        password: '$2b$10$rQZ8kFzJ8kFzJ8kFzJ8kFzJ8kFzJ8kFzJ8kFzJ8kFzJ8kFzJ8kFzJ8k' // demo123
      }
    ];

    for (const officer of demoOfficers) {
      try {
        await Officer.create(officer);
        console.log(`✅ Created officer: ${officer.name} (${officer.officerId})`);
      } catch (error) {
        console.log(`⚠️  Officer ${officer.officerId} might already exist`);
      }
    }

    // Create demo duties
    const officers = await Officer.find({ role: 'Officer' });
    if (officers.length > 0) {
      const demoDuties = [
        {
          officer: officers[0]._id,
          status: 'Assigned',
          bandobastName: 'Festival Security',
          sector: 'Panaji',
          zone: 'Zone A',
          post: 'Post 1',
          currentLocation: {
            lat: 15.4989,
            lon: 73.8278
          }
        },
        {
          officer: officers[1]._id,
          status: 'Assigned',
          bandobastName: 'Traffic Management',
          sector: 'Margao',
          zone: 'Zone B',
          post: 'Post 2',
          currentLocation: {
            lat: 15.2736,
            lon: 73.9589
          }
        },
        {
          officer: officers[2]._id,
          status: 'Assigned',
          bandobastName: 'Beach Patrol',
          sector: 'Vasco',
          zone: 'Zone C',
          post: 'Post 3',
          currentLocation: {
            lat: 15.4989,
            lon: 73.8278
          }
        }
      ];

      for (const duty of demoDuties) {
        try {
          await Duty.create(duty);
          console.log(`✅ Created duty: ${duty.bandobastName}`);
        } catch (error) {
          console.log(`⚠️  Duty might already exist`);
        }
      }
    }

    console.log('\n🎉 Demo data created successfully!');
    console.log('\n📋 Available accounts:');
    console.log('   Officers: DEMO001, DEMO002, DEMO003 (password: demo123)');
    console.log('   Supervisor: SUPER001 (password: demo123)');
    
  } catch (error) {
    console.error('❌ Error creating demo data:', error.message);
  } finally {
    if (connectDB.mongoose && connectDB.mongoose.connection.readyState === 1) {
      await connectDB.mongoose.disconnect();
      console.log('\nDisconnected from MongoDB');
    }
    process.exit(0);
  }
}

createDemoData();
