const nodemailer = require('nodemailer');

// Create Gmail transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD
    }
  });
};

// Validate Gmail configuration
const validateEmailConfig = () => {
  const requiredVars = ['GMAIL_USER', 'GMAIL_APP_PASSWORD'];
  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    throw new Error(`Missing required Gmail environment variables: ${missingVars.join(', ')}`);
  }
};

// Send email function
const sendEmail = async (to, subject, htmlContent, textContent = null) => {
  try {
    // Validate configuration
    validateEmailConfig();
    
    const transporter = createTransporter();
    
    const mailOptions = {
      from: {
        name: 'Police Deployment System',
        address: process.env.GMAIL_USER
      },
      to: to,
      subject: subject,
      html: htmlContent,
      text: textContent || htmlContent.replace(/<[^>]*>/g, '') // Strip HTML for text version
    };
    
    const result = await transporter.sendMail(mailOptions);
    
    console.log(`✅ Email sent successfully to ${to}. Message ID: ${result.messageId}`);
    return {
      success: true,
      messageId: result.messageId,
      response: result.response
    };
    
  } catch (error) {
    console.error(`❌ Failed to send email to ${to}:`, error.message);
    return {
      success: false,
      error: error.message
    };
  }
};

// Send bulk email function
const sendBulkEmail = async (recipients, subject, htmlContent, textContent = null) => {
  const results = [];
  
  for (const recipient of recipients) {
    const result = await sendEmail(recipient, subject, htmlContent, textContent);
    results.push({
      recipient,
      ...result
    });
  }
  
  return results;
};

// Send duty notification email
const sendDutyNotificationEmail = async (officerName, officerEmail, dutyDetails) => {
  const subject = `🚔 New Duty Assignment - ${dutyDetails.bandobastName}`;
  
  // Get the web app URL from environment or use network IP
  const webAppUrl = process.env.WEB_APP_URL || 'http://10.30.44.14:8081';
  const clockInUrl = `${webAppUrl}/login?redirect=/dashboard`;
  
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
      <div style="background: linear-gradient(135deg, #1e40af, #3b82f6); color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
        <h1 style="margin: 0; font-size: 24px;">🚔 NEW DUTY ASSIGNMENT</h1>
      </div>
      
      <div style="padding: 20px; background: #f8fafc;">
        <h2 style="color: #1e40af; margin-top: 0;">Officer: ${officerName}</h2>
        
        <div style="background: white; padding: 15px; border-radius: 6px; margin: 15px 0; border-left: 4px solid #3b82f6;">
          <h3 style="margin: 0 0 10px 0; color: #1e40af;">Duty Details</h3>
          <p><strong>Duty Name:</strong> ${dutyDetails.bandobastName}</p>
          <p><strong>Location:</strong> ${dutyDetails.post}, ${dutyDetails.zone}</p>
          <p><strong>Sector:</strong> ${dutyDetails.sector}</p>
          <p><strong>Date:</strong> ${dutyDetails.dutyDate}</p>
          <p><strong>Shift:</strong> ${dutyDetails.shift}</p>
        </div>
        
        <div style="background: #fef3c7; padding: 15px; border-radius: 6px; border-left: 4px solid #f59e0b; margin: 15px 0;">
          <p style="margin: 0 0 10px 0; font-weight: bold; color: #92400e;">
            ⚠️ Please report to your assigned location immediately and clock in through the system.
          </p>
          <p style="margin: 0; color: #92400e; font-size: 14px;">
            Click the button below to access the system and clock in for your duty.
          </p>
        </div>
        
        <div style="text-align: center; margin: 20px 0;">
          <a href="${clockInUrl}" 
             style="display: inline-block; background: linear-gradient(135deg, #1e40af, #3b82f6); color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            🚔 CLOCK IN FOR DUTY
          </a>
        </div>
        
        <div style="background: #e0f2fe; padding: 15px; border-radius: 6px; border-left: 4px solid #0284c7; margin: 15px 0;">
          <p style="margin: 0; color: #0c4a6e; font-size: 14px;">
            <strong>Note:</strong> You will be redirected to the login page first. After logging in, you'll be taken to your dashboard where you can clock in for this duty assignment.
          </p>
        </div>
      </div>
      
      <div style="text-align: center; padding: 20px; background: #f1f5f9; border-radius: 0 0 8px 8px;">
        <p style="margin: 0; color: #64748b; font-size: 14px;">
          This is an automated notification from the Police Deployment System
        </p>
        <p style="margin: 5px 0 0 0; color: #64748b; font-size: 12px;">
          If the button doesn't work, copy and paste this link: ${clockInUrl}
        </p>
      </div>
    </div>
  `;
  
  return await sendEmail(officerEmail, subject, htmlContent);
};

// Send geofence violation email
const sendGeofenceViolationEmail = async (officerName, officerEmail, violationDetails) => {
  const subject = `⚠️ Geofence Violation Alert - ${officerName}`;
  
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
      <div style="background: linear-gradient(135deg, #dc2626, #ef4444); color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
        <h1 style="margin: 0; font-size: 24px;">⚠️ GEOFFENCE VIOLATION ALERT</h1>
      </div>
      
      <div style="padding: 20px; background: #fef2f2;">
        <h2 style="color: #dc2626; margin-top: 0;">Officer: ${officerName}</h2>
        
        <div style="background: white; padding: 15px; border-radius: 6px; margin: 15px 0; border-left: 4px solid #dc2626;">
          <h3 style="margin: 0 0 10px 0; color: #dc2626;">Violation Details</h3>
          <p><strong>Time Outside Jurisdiction:</strong> ${Math.floor(violationDetails.timeOutsideGeofenceInSeconds / 60)} minutes</p>
          <p><strong>Distance from Assigned Location:</strong> ${violationDetails.distance}m</p>
          <p><strong>Violation Time:</strong> ${new Date().toLocaleString()}</p>
        </div>
        
        <div style="background: #fef3c7; padding: 15px; border-radius: 6px; border-left: 4px solid #f59e0b;">
          <p style="margin: 0; font-weight: bold; color: #92400e;">
            🚨 Please return to your designated area immediately and contact your supervisor.
          </p>
        </div>
      </div>
      
      <div style="text-align: center; padding: 20px; background: #f1f5f9; border-radius: 0 0 8px 8px;">
        <p style="margin: 0; color: #64748b; font-size: 14px;">
          This is an automated alert from the Police Deployment System
        </p>
      </div>
    </div>
  `;
  
  return await sendEmail(officerEmail, subject, htmlContent);
};

// Send emergency email
const sendEmergencyEmail = async (officerName, officerEmail, emergencyMessage) => {
  const subject = `🚨 EMERGENCY ALERT - ${officerName}`;
  
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
      <div style="background: linear-gradient(135deg, #dc2626, #ef4444); color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
        <h1 style="margin: 0; font-size: 24px;">🚨 EMERGENCY ALERT</h1>
      </div>
      
      <div style="padding: 20px; background: #fef2f2;">
        <h2 style="color: #dc2626; margin-top: 0;">Officer: ${officerName}</h2>
        
        <div style="background: white; padding: 15px; border-radius: 6px; margin: 15px 0; border-left: 4px solid #dc2626;">
          <p style="margin: 0; font-size: 16px; line-height: 1.5;">${emergencyMessage}</p>
        </div>
        
        <div style="background: #fef3c7; padding: 15px; border-radius: 6px; border-left: 4px solid #f59e0b;">
          <p style="margin: 0; font-weight: bold; color: #92400e;">
            🚨 Please respond immediately and contact emergency services if needed.
          </p>
        </div>
      </div>
      
      <div style="text-align: center; padding: 20px; background: #f1f5f9; border-radius: 0 0 8px 8px;">
        <p style="margin: 0; color: #64748b; font-size: 14px;">
          This is an automated emergency alert from the Police Deployment System
        </p>
      </div>
    </div>
  `;
  
  return await sendEmail(officerEmail, subject, htmlContent);
};

module.exports = {
  sendEmail,
  sendBulkEmail,
  sendDutyNotificationEmail,
  sendGeofenceViolationEmail,
  sendEmergencyEmail,
  validateEmailConfig
};
