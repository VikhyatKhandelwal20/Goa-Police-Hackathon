# Test Accounts for Excel Upload Testing

This document contains information about the test accounts created for testing the Excel upload functionality.

## 👮 Test Accounts Created

### **Account x1**
- **Officer ID**: `x1`
- **Name**: Test Officer X1
- **Rank**: Constable
- **Badge Number**: X001
- **Department**: Patrol Division
- **Password**: `password123`
- **Status**: Off-Duty
- **Location**: Panaji (15.4989, 73.8278)

### **Account x2**
- **Officer ID**: `x2`
- **Name**: Test Officer X2
- **Rank**: Head Constable
- **Badge Number**: X002
- **Department**: Traffic Division
- **Password**: `password123`
- **Status**: Off-Duty
- **Location**: Margao (15.2733, 73.9589)

## 📊 Test Excel File: `test-x1-x2-roster.xlsx`

### **File Details:**
- **Size**: 22.6 KB
- **Total Rows**: 14 duty assignments + header
- **Success Rate**: 100% (14/14 successful)
- **Date Range**: 2024-01-20 to 2024-01-23

### **Duty Assignments:**

#### **Officer x1 (5 duties):**
1. **Morning Patrol** - Panaji, Zone A, Market Post (2024-01-20, Morning)
2. **Traffic Control** - Panaji, Zone A, Traffic Post (2024-01-20, Evening)
3. **Night Watch** - Panaji, Zone A, Night Post (2024-01-21, Night)
4. **VIP Security** - Panaji, Zone A, VIP Post (2024-01-21, Morning)
5. **Community Patrol** - Panaji, Zone A, Community Post (2024-01-22, Afternoon)

#### **Officer x2 (5 duties):**
1. **Traffic Management** - Margao, Zone B, Bus Stand Post (2024-01-20, Morning)
2. **School Security** - Margao, Zone B, School Post (2024-01-20, Afternoon)
3. **Highway Patrol** - Margao, Zone B, Highway Post (2024-01-21, Evening)
4. **Event Security** - Margao, Zone B, Event Post (2024-01-21, Night)
5. **Emergency Response** - Margao, Zone B, Emergency Post (2024-01-22, General)

#### **Joint Operations (2 duties):**
1. **Joint Operation** - Vasco, Zone C, Joint Post (2024-01-22, Morning) - Both x1 and x2

#### **Special Tasks (2 duties):**
1. **Special Task** - Panaji, Zone A, Special Post (2024-01-23, Evening) - x1
2. **Special Task** - Margao, Zone B, Special Post (2024-01-23, Evening) - x2

## 🧪 How to Test

### **1. Login as Test Officers:**
- **URL**: `http://localhost:8080` or `http://10.30.44.14:8080`
- **Username**: `x1` or `x2`
- **Password**: `password123`

### **2. Test Excel Upload:**
1. **Login as supervisor** (any existing supervisor account)
2. **Navigate to "Upload Roster"**
3. **Upload file**: `test-x1-x2-roster.xlsx`
4. **Check results**: Should show 14 successful assignments

### **3. Verify Duty Assignments:**
1. **Login as x1**: Check if duties appear in dashboard
2. **Login as x2**: Check if duties appear in dashboard
3. **Check Live Map**: Officers should appear when on duty

## 📋 Excel File Format Used

### **Headers:**
```
Officer ID | Officer Name | Duty Name | Sector | Zone | Post | Duty Date | Shift | Latitude | Longitude | Description
```

### **Sample Data:**
```
x1 | Test Officer X1 | Morning Patrol | Panaji | Zone A | Market Post | 2024-01-20 | Morning | 15.4989 | 73.8278 | Morning patrol in market area
```

## ✅ Test Results

### **Upload Test Results:**
- **Status**: ✅ SUCCESS
- **Total Processed**: 14 rows
- **Successful**: 14 assignments
- **Failed**: 0 assignments
- **Success Rate**: 100%
- **Unfound Officers**: None

### **Database Verification:**
- **Officers Created**: ✅ x1 and x2
- **Duties Created**: ✅ 14 duty assignments
- **Auth Records**: ✅ Login credentials set
- **Location Data**: ✅ GPS coordinates assigned

## 🔧 Troubleshooting

### **If Login Fails:**
1. Check if backend server is running
2. Verify MongoDB connection
3. Check if accounts exist in database

### **If Upload Fails:**
1. Check if file is .xlsx format
2. Verify officer IDs match exactly (x1, x2)
3. Check backend logs for errors

### **If Duties Don't Appear:**
1. Check if officers are logged in
2. Verify duty status in database
3. Check if officers are marked as "On-Duty"

## 🎯 Next Steps

### **Testing Scenarios:**
1. **Login Test**: Try logging in as x1 and x2
2. **Duty Assignment**: Check if duties appear in dashboards
3. **Clock In/Out**: Test duty status changes
4. **Location Updates**: Test location tracking
5. **Geofencing**: Test geofence alerts
6. **Live Map**: Check if officers appear on supervisor map

### **Additional Tests:**
1. **Create more test accounts** if needed
2. **Test with different Excel formats**
3. **Test error handling** with invalid data
4. **Test large file uploads**

---

**Note**: These test accounts are for development/testing purposes only. Use real data for production.
