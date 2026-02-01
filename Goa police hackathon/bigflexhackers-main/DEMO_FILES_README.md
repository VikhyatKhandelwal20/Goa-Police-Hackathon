# Demo Excel Files for Roster Upload Testing

This directory contains demo Excel files to test the roster upload functionality.

## 📁 Available Demo Files

### 1. `demo-duty-roster.xlsx` - Complete Demo File
- **Purpose**: Full-featured demo with all valid data
- **Size**: 22.78 KB
- **Rows**: 15 duty assignments + header
- **Officers**: DEMO001, DEMO002, DEMO003 (all valid)
- **Success Rate**: 100%

**Features:**
- ✅ All officers exist in database
- ✅ Complete data with all fields
- ✅ Multiple dates (2024-01-15 to 2024-01-19)
- ✅ Various shifts (Morning, Evening, Night, General)
- ✅ Different sectors (Panaji, Margao, Vasco)
- ✅ Different zones (Zone A, B, C)
- ✅ GPS coordinates included
- ✅ Descriptions for each duty

### 2. `test-error-handling.xlsx` - Error Testing File
- **Purpose**: Test error handling with invalid data
- **Size**: 17.44 KB
- **Rows**: 5 duty assignments + header
- **Valid Officers**: DEMO001, DEMO002, DEMO003
- **Invalid Officers**: INVALID001, INVALID002
- **Success Rate**: 60% (3/5 successful)

**Features:**
- ✅ Tests valid officer assignments
- ❌ Tests invalid officer handling
- 📊 Shows error reporting
- 🔍 Demonstrates unfound officer tracking

## 🧪 How to Test

### 1. Using the Frontend
1. **Start both servers:**
   ```bash
   # Backend
   cd backend && npm run dev
   
   # Frontend
   cd frontend && npm run dev
   ```

2. **Open browser:** Go to `http://localhost:5173`

3. **Login as supervisor** and navigate to "Upload Roster"

4. **Upload files:**
   - Drag and drop or click to select `demo-duty-roster.xlsx`
   - Click "Submit Roster"
   - Check results and success message

### 2. Using cURL (Command Line)
```bash
# Test complete demo file
curl -X POST -F "dutyRoster=@demo-duty-roster.xlsx" http://localhost:3000/api/duties/upload

# Test error handling file
curl -X POST -F "dutyRoster=@test-error-handling.xlsx" http://localhost:3000/api/duties/upload
```

## 📊 Expected Results

### Demo File Results:
- **Total Rows**: 15
- **Successful**: 15
- **Failed**: 0
- **Success Rate**: 100%
- **Created Duties**: 15 new duty assignments

### Error Handling File Results:
- **Total Rows**: 5
- **Successful**: 3
- **Failed**: 2
- **Success Rate**: 60%
- **Unfound Officers**: INVALID001, INVALID002
- **Created Duties**: 3 new duty assignments

## 📋 Excel File Format

### Required Columns:
- `Officer ID` - Must match existing officers in database
- `Duty Name` - Name of the duty/bandobast
- `Sector` - Geographic sector
- `Zone` - Administrative zone
- `Post` - Specific post/station

### Optional Columns:
- `Officer Name` - Display name (not used for matching)
- `Duty Date` - Date of duty (YYYY-MM-DD format)
- `Shift` - Time period (Morning, Evening, Night, General)
- `Latitude` - GPS latitude coordinate
- `Longitude` - GPS longitude coordinate
- `Description` - Additional details

## 🔧 Troubleshooting

### Common Issues:
1. **"Officers not found"** - Check if demo officers exist in database
2. **"Upload failed"** - Ensure backend server is running
3. **"File not accepted"** - Only .xlsx files are supported
4. **"Blank page"** - Check browser console for errors

### Database Setup:
Make sure demo officers exist in the database:
- DEMO001 - Inspector Rajesh Kumar
- DEMO002 - Sub Inspector Priya Sharma  
- DEMO003 - Assistant Sub Inspector Amit Patel

## 🎯 Testing Scenarios

### 1. Happy Path Testing
- Use `demo-duty-roster.xlsx`
- Expect 100% success rate
- Verify all duties are created
- Check success toast message

### 2. Error Handling Testing
- Use `test-error-handling.xlsx`
- Expect 60% success rate
- Verify error reporting
- Check unfound officer list

### 3. Edge Case Testing
- Try uploading non-Excel files
- Try uploading empty files
- Try uploading files with missing columns
- Test with very large files

## 📈 Performance Notes

- **File Size**: Demo files are small (< 25KB)
- **Processing Time**: < 2 seconds for 15 assignments
- **Memory Usage**: Minimal impact
- **Database**: Creates new duty documents

## 🚀 Next Steps

After testing with these demo files, you can:
1. Create your own Excel files with real data
2. Modify the column names to match your requirements
3. Add more officers to the database
4. Test with larger datasets
5. Implement additional validation rules

---

**Note**: These demo files are for testing purposes only. Replace with real data for production use.
