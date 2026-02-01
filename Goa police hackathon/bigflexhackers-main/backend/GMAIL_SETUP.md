# Gmail Email Integration Setup Guide

## Environment Variables Required

Add these environment variables to your `.env.local` file:

```bash
# Gmail Email Configuration
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your-app-password-here
```

## How to Get Gmail App Password

### Step 1: Enable 2-Factor Authentication
1. Go to your Google Account settings
2. Navigate to Security → 2-Step Verification
3. Enable 2-Factor Authentication if not already enabled

### Step 2: Generate App Password
1. Go to Google Account → Security
2. Under "How you sign in to Google", click "App passwords"
3. Select "Mail" and "Other (Custom name)"
4. Enter "Police Deployment System" as the name
5. Click "Generate"
6. Copy the 16-character password (e.g., `abcd efgh ijkl mnop`)

### Step 3: Add to Environment Variables
```bash
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=abcdefghijklmnop
```

## Usage Examples

### Basic Email
```javascript
const { sendEmail } = require('./config/email');

const result = await sendEmail(
  'officer@example.com',
  'Test Email',
  '<h1>Hello from Police Deployment System!</h1>'
);
```

### Duty Notification Email
```javascript
const { sendDutyNotificationEmail } = require('./config/email');

const dutyDetails = {
  bandobastName: 'Beach Patrol Duty',
  post: 'Beach Post 1',
  zone: 'Zone A',
  sector: 'Panaji',
  dutyDate: '2024-01-20',
  shift: 'Morning'
};

const result = await sendDutyNotificationEmail(
  'Officer John Doe',
  'officer@example.com',
  dutyDetails
);
```

### Geofence Violation Email
```javascript
const { sendGeofenceViolationEmail } = require('./config/email');

const violationDetails = {
  timeOutsideGeofenceInSeconds: 600,
  distance: 250
};

const result = await sendGeofenceViolationEmail(
  'Officer John Doe',
  'officer@example.com',
  violationDetails
);
```

## Testing

You can test the email functionality by running:

```bash
node test-email.js
```

## Important Notes

- **Free Service**: Gmail SMTP is completely free
- **Rate Limits**: 500 emails/day for personal accounts, 2000/day for Google Workspace
- **App Password**: Use App Password, not your regular Gmail password
- **Security**: App passwords are more secure than regular passwords
- **HTML Emails**: Supports rich HTML formatting with CSS styling

## Email Templates

The system includes beautiful HTML email templates for:
- ✅ Duty assignment notifications
- ✅ Geofence violation alerts
- ✅ Emergency notifications
- ✅ Custom messages

## Troubleshooting

### Common Issues:
1. **"Invalid login"**: Check your App Password
2. **"Less secure app"**: Enable 2-Factor Authentication
3. **"Quota exceeded"**: Wait 24 hours or upgrade to Google Workspace
4. **"Connection timeout"**: Check your internet connection

### Test Connection:
```bash
node -e "
const { validateEmailConfig } = require('./src/config/email');
try {
  validateEmailConfig();
  console.log('✅ Gmail configuration is valid');
} catch (error) {
  console.log('❌ Gmail configuration error:', error.message);
}
"
```
