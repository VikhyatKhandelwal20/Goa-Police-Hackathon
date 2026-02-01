const mongoose = require('mongoose');

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://mario:mario1234@cluster0.clljubv.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

async function connectDB() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
}

async function updateOfficersWithEmails() {
  try {
    await connectDB();
    
    console.log('📧 Updating officers with email addresses...\n');
    
    // Officer Schema
    const officerSchema = new mongoose.Schema({
      officerId: String,
      name: String,
      email: String,
      rank: String,
      role: String,
      currentStatus: String,
      isActive: Boolean
    }, { timestamps: true });
    
    const Officer = mongoose.models.Officer || mongoose.model('Officer', officerSchema);
    
    // Get all officers
    const officers = await Officer.find({});
    console.log(`📋 Found ${officers.length} officers to update\n`);
    
    for (const officer of officers) {
      // Generate email based on officer ID and name
      const email = `${officer.officerId.toLowerCase()}@police.gov.in`;
      
      // Update officer with email
      await Officer.updateOne(
        { _id: officer._id },
        { email: email }
      );
      
      console.log(`✅ Updated ${officer.name} (${officer.officerId}) → ${email}`);
    }
    
    console.log(`\n🎉 Successfully updated ${officers.length} officers with email addresses!`);
    
    // Show updated officers
    const updatedOfficers = await Officer.find({}).select('officerId name email role');
    console.log('\n📋 Updated Officers:');
    updatedOfficers.forEach(officer => {
      console.log(`   - ${officer.name} (${officer.officerId}) → ${officer.email} [${officer.role}]`);
    });
    
  } catch (error) {
    console.error('❌ Error updating officers:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

updateOfficersWithEmails();
