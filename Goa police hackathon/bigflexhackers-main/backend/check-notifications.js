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

async function checkNotifications() {
  try {
    await connectDB();
    
    console.log('🔍 Checking notifications for officers...\n');
    
    // Officer Schema
    const officerSchema = new mongoose.Schema({
      officerId: String,
      name: String,
      rank: String,
      role: String,
      currentStatus: String,
      isActive: Boolean
    }, { timestamps: true });
    
    // Notification Schema
    const notificationSchema = new mongoose.Schema({
      recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'Officer', required: true },
      type: { type: String, default: 'New Duty' },
      message: { type: String, required: true },
      isRead: { type: Boolean, default: false }
    }, { timestamps: true });
    
    const Officer = mongoose.models.Officer || mongoose.model('Officer', officerSchema);
    const Notification = mongoose.models.Notification || mongoose.model('Notification', notificationSchema);
    
    // Find test officers
    const officers = await Officer.find({ officerId: { $in: ['x01', 'x02'] } });
    
    console.log(`📋 Found ${officers.length} test officers:`);
    officers.forEach(officer => {
      console.log(`   - ${officer.name} (${officer.officerId}) - Status: ${officer.currentStatus}`);
    });
    console.log();
    
    // Check notifications for each officer
    for (const officer of officers) {
      const notifications = await Notification.find({ recipient: officer._id })
        .sort({ createdAt: -1 })
        .populate('recipient', 'officerId name');
      
      console.log(`🔔 Notifications for ${officer.name} (${officer.officerId}):`);
      console.log(`   Total: ${notifications.length}`);
      
      const unreadCount = notifications.filter(n => !n.isRead).length;
      console.log(`   Unread: ${unreadCount}`);
      
      if (notifications.length > 0) {
        console.log(`   Recent notifications:`);
        notifications.slice(0, 3).forEach((notif, index) => {
          const status = notif.isRead ? 'READ' : 'UNREAD';
          const timeAgo = new Date() - new Date(notif.createdAt);
          const minutesAgo = Math.floor(timeAgo / 60000);
          console.log(`     ${index + 1}. [${status}] ${notif.type}`);
          console.log(`        Message: ${notif.message}`);
          console.log(`        Time: ${minutesAgo} minutes ago`);
        });
      } else {
        console.log(`   No notifications found`);
      }
      console.log();
    }
    
    // Check total notifications in system
    const totalNotifications = await Notification.countDocuments();
    const totalUnread = await Notification.countDocuments({ isRead: false });
    
    console.log(`📊 System-wide notification stats:`);
    console.log(`   Total notifications: ${totalNotifications}`);
    console.log(`   Total unread: ${totalUnread}`);
    
    // Show recent notifications across all officers
    const recentNotifications = await Notification.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('recipient', 'officerId name');
    
    console.log(`\n📋 Recent notifications (last 10):`);
    recentNotifications.forEach((notif, index) => {
      const status = notif.isRead ? 'READ' : 'UNREAD';
      const timeAgo = new Date() - new Date(notif.createdAt);
      const minutesAgo = Math.floor(timeAgo / 60000);
      console.log(`   ${index + 1}. [${status}] ${notif.recipient?.name} (${notif.recipient?.officerId})`);
      console.log(`      ${notif.type}: ${notif.message}`);
      console.log(`      ${minutesAgo} minutes ago`);
    });
    
  } catch (error) {
    console.error('❌ Error checking notifications:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

checkNotifications();
