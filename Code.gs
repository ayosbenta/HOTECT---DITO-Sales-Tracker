/**
 * Google Apps Script for Hotech Dito Sales Tracker & Meta Ads Monitoring
 * 
 * Instructions:
 * 1. Open your Google Sheet linked to the tracker.
 * 2. Click Extensions > Apps Script in the top menu.
 * 3. Delete any code in the editor and paste this entire script.
 * 4. Replace the SpreadSheet ID with your specific ID, or use SpreadsheetApp.getActiveSpreadsheet() if the script is bound to the sheet.
 * 5. Click Save (Disk Icon).
 * 6. Click Deploy > New Deployment.
 * 7. Choose type "Web app".
 * 8. Set Description: "Meta Ads Dynamic Sync"
 * 9. Set "Execute as": "Me" (your email)
 * 10. Set "Who has access": "Anyone" (crucial for React app fetch integrations).
 * 11. Click Deploy, Authorize access, and copy the Web App URL to complete setup!
 */

function doGet(e) {
  var action = e && e.parameter ? e.parameter.action : "";
  
  if (action === "readAll" || !action) {
    return readAllData();
  }
  
  return createJSONResponse({
    status: "error",
    message: "Invalid GET action: " + action
  });
}

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return createJSONResponse({ status: "error", message: "Empty POST contents" });
    }
    
    var payload = JSON.parse(e.postData.contents);
    var action = payload.action;
    
    if (action === "save") {
      var sheetName = payload.sheetName;
      var data = payload.data;
      
      if (!sheetName) {
        return createJSONResponse({ status: "error", message: "Missing sheetName specification" });
      }
      
      return saveSheetData(sheetName, data);
    }
    
    return createJSONResponse({ status: "error", message: "Invalid POST action: " + action });
  } catch (err) {
    return createJSONResponse({ status: "error", message: err.toString() });
  }
}

/**
 * Reads all worksheets from the spreadsheet and produces formatted records
 */
function readAllData() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheets = ss.getSheets();
  var result = { status: "success" };
  
  sheets.forEach(function(sheet) {
    var rawName = sheet.getName();
    var keyName = rawName.toLowerCase(); // converts sheet names like "Meta Ads" to key "meta ads"
    result[keyName] = parseSheetToObjects(sheet);
  });
  
  return createJSONResponse(result);
}

/**
 * Rewrites a worksheet with flat structured array records
 */
function saveSheetData(sheetName, dataList) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(sheetName);
  
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
  } else {
    sheet.clearContents();
    sheet.clearFormats();
  }
  
  if (!dataList || dataList.length === 0) {
    return createJSONResponse({ status: "success", message: "Cleared sheet: " + sheetName });
  }
  
  // 1. Determine unique properties across all records to build headings
  var headerSet = {};
  dataList.forEach(function(item) {
    Object.keys(item).forEach(function(k) {
      headerSet[k] = true;
    });
  });
  var headers = Object.keys(headerSet);
  
  // 2. Write headers in row 1
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBackground("#e2e8f0");
  
  // 3. Write data rows
  var values = dataList.map(function(item) {
    return headers.map(function(key) {
      var val = item[key];
      if (val === undefined || val === null) {
        return "";
      }
      // Stringify objects or array representations safely
      if (typeof val === "object") {
        return JSON.stringify(val);
      }
      return val;
    });
  });
  
  sheet.getRange(2, 1, values.length, headers.length).setValues(values);
  
  // Auto-resize columns for readability
  sheet.autoResizeColumns(1, headers.length);
  
  return createJSONResponse({ 
    status: "success", 
    message: "Data written successfully into " + sheetName,
    recordsCount: values.length 
  });
}

/**
 * Utility: Converts a worksheet array into standard mapped arrays
 */
function parseSheetToObjects(sheet) {
  var range = sheet.getDataRange();
  var values = range.getValues();
  
  if (values.length < 2) return [];
  
  var headers = values[0];
  var rows = [];
  
  for (var r = 1; r < values.length; r++) {
    var rowData = values[r];
    var obj = {};
    for (var c = 0; c < headers.length; c++) {
      var headerVal = headers[c];
      if (headerVal) {
        obj[headerVal] = rowData[c];
      }
    }
    rows.push(obj);
  }
  
  return rows;
}

/**
 * Utility: Build parsed output headers and configurations
 */
function createJSONResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
