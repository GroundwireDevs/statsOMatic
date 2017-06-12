// Sets which day to get data from and output to, this is the only variable which needs to be changed to select different dates.
var daysAgo = 1;
// Sets the token variable, this way, multiple functions can tell if it has been set or not
var token = null;
// Function which subtracts an amount of days from a date object
function subDaysFromDate(date,d){
  // d = number of day ro substract and date = start date
  var result = new Date(date.getTime()-d*(24*3600*1000));
  return result
}
// Sets the start and end dates
var startDate = subDaysFromDate(new Date(), daysAgo);
var endDate = subDaysFromDate(new Date(), daysAgo - 1);
// Counts the number of rows in the spreadsheet, based on column A
var numberOfRows = SpreadsheetApp.getActiveSheet().getRange("A:A").getNumRows();
// Function which determines which row should be written to, based on the daysAgo variable.
function findWriteRow() {
  var valuesYear = SpreadsheetApp.getActiveSheet().getRange("D:D").getValues();
  var valuesMonth = SpreadsheetApp.getActiveSheet().getRange("C:C").getValues();
  var valuesDay = SpreadsheetApp.getActiveSheet().getRange("U:U").getValues();
  // Matches the year, month and day columns with the start date.
  for (var x = 1; x <= numberOfRows; x++) {
    if (valuesYear[x] == startDate.getFullYear() && valuesMonth[x] == startDate.getMonth() + 1 && valuesDay[x] == startDate.getDate()) {
      return x + 1; // Still not sure why 1 needs to be added to x.
    }
  }
}
// Imports data from Google Analytics
function gaImport(){
  // Finds the row to write to
  var writeRow = findWriteRow();
  // Sets the ranges of the three columns which will be written to
  jesuscaresUsersRange = values = SpreadsheetApp.getActiveSheet().getRange("Q" + writeRow);
  jesuscaresCommitmentsRange = values = SpreadsheetApp.getActiveSheet().getRange("P" + writeRow);
  groundwireCommitmentRange = values = SpreadsheetApp.getActiveSheet().getRange("O" + writeRow);
  // Sets the start and end date
  var startDate = daysAgo + 'daysAgo';
  var endDate = daysAgo + 'daysAgo';
  // Sets the Jesus Cares table
  var tableId  = 'ga:' + 96860245;
  // Sets the number of users
  var usersMetric = 'ga:users';
  var usersReport = Analytics.Data.Ga.get(tableId, startDate, endDate, usersMetric);
  jesuscaresUsersRange.setValue(usersReport.rows);
  // Sets the number of Jesus Cares commitments
  var jcCommitmentsMetric = 'ga:goal7Completions';
  var jcCommitmentsReport = Analytics.Data.Ga.get(tableId, startDate, endDate, jcCommitmentsMetric);
  jesuscaresCommitmentsRange.setValue(jcCommitmentsReport.rows);
  // Sets the Groundwire table
  var gwTableId = 'ga:' + 5611435;
  // Sets the number of commitments (adding salvations and recommitments)
  var gwRecommitmentsMetric = 'ga:goal4Completions';
  var gwRecommitmentReport = Analytics.Data.Ga.get(gwTableId, startDate, endDate, gwRecommitmentsMetric);
  var gwRecommitments = gwRecommitmentReport.rows;
  var gwSalvationsMetric = 'ga:goal3Completions';
  var gwSalvationReport = Analytics.Data.Ga.get(gwTableId, startDate, endDate, gwSalvationsMetric);
  var gwSalvations = gwSalvationReport.rows;
  var gwTotal = parseInt(gwRecommitments) + parseInt(gwSalvations);
  groundwireCommitmentRange.setValue(gwTotal);
}
  // Gets an authentication token from Echo based on an Echo user's email and password
  function echoAuth() {
    // Checks if there is already a token, if there is, the existing token is returned instead of another authentication process
    if (token === null) {
      // Sets the body data to be sent (Echo login email address and password)
      var payload = {
        'email' : '***REMOVED***',
        'password' : '***REMOVED***'
      };
      // Sets the request options
   var options = {
   'method' : 'post',
     'payload' : payload
 };
  // Makes the authentication request
  var response = UrlFetchApp.fetch('https://groundwire.echoglobal.org/sessions.json', options);
  // Converts the response data into JSON and saves it to the dataJSON variable
  var dataJSON = JSON.parse(response.getContentText());
      // Changes the token variable from null to the recieved token
  token = dataJSON.auth_token;
      // Returns the token back (not currently used)
  return token;
  } else {
    // Returns the token back if it already existed (not currently used)
    return token
  }
}
// Fetches a particular JSON file from Echo
function echoFetch(url) {
    // If there is no token, run the authentication function
    if (token === null) {
      echoAuth()
    }
    // Sets the part of the URL for the date range, show_average and threshold
    var dateRangeString = '?endDate=%22' + endDate.getFullYear() + '-' + (endDate.getMonth() + 1) + '-' + endDate.getDate() + 'T00:00:00.000Z%22&show_average=false&startDate=%22' + startDate.getFullYear() + '-' + (startDate.getMonth() + 1) + '-' + startDate.getDate() + 'T00:00:00.000Z%22&threshold=15';
    // Sets the final URL, combining the url paramater, dateRangeString and auth_token
    url = url + dateRangeString + "&auth_token=" + token;
    // Sets the request options
    var options = {
      'method' : 'get',
      'contentType': 'application/json'
 };
  // Makes the request
  var response = UrlFetchApp.fetch(url, options);
  // Converts the response data into JSON and saves it to the dataJSON variable
  var dataJSON = JSON.parse(response.getContentText()); 
    // Returns the retrieved, JSONed data
    return dataJSON
  }
// Returns the index of the desired data point, based on the labels array
function statFinder(data, stat) {
  // Filters down to just the labels
  data = data.labels;
  // Goes through each of the data points
  for (var x = 0; x <= data.length; x++) {
    // Returns the index based on the stat parameter
    if (data[x] === stat) {
      return x;
    }
  }
}
// Imports data from Echo 
function echoImport() {
  // Finds the row to write to
  var writeRow = findWriteRow();
  // Retrieves each of the data files, so that none are retrieved more than once
  var outcomesByUser = echoFetch('https://groundwire.echoglobal.org/report/users/outcomes_by_user.json');
  var statuses = echoFetch('https://groundwire.echoglobal.org/report/chats/statuses.json');
  var dispositions = echoFetch('https://groundwire.echoglobal.org/report/chats/dispositions.json');
  var statusesByWebsite = echoFetch('https://groundwire.echoglobal.org/report/chats/statuses_by_website.json');
  var outcomesByWebsite = echoFetch('https://groundwire.echoglobal.org/report/chats/outcomes_by_website.json');
  // Sets each cell to the data in the applicable JSON file. In some cases, statFinder is used to see what position a particular data point is in.
  // Unique count of coaches who took chats
  SpreadsheetApp.getActiveSheet().getRange("E" + writeRow).setValue(outcomesByUser.dataset.length !== undefined ? outcomesByUser.dataset.length : 0);
  // Accepted
  SpreadsheetApp.getActiveSheet().getRange("F" + writeRow).setValue(statuses.data[statFinder(statuses, 'closed')] !== undefined ? statuses.data[statFinder(statuses, 'closed')] : 0);
  // Missed
  SpreadsheetApp.getActiveSheet().getRange("G" + writeRow).setValue(statuses.data[statFinder(statuses, 'timeout')] !== undefined ? statuses.data[statFinder(statuses, 'timeout')] : 0);
  // No response
  SpreadsheetApp.getActiveSheet().getRange("H" + writeRow).setValue(dispositions.data[statFinder(dispositions, 'No Response')] !== undefined ? dispositions.data[statFinder(dispositions, 'No Response')] : 0);
  // Spiritual conversations
  SpreadsheetApp.getActiveSheet().getRange("I" + writeRow).setValue(dispositions.data[statFinder(dispositions, 'Spiritual Conversation')] !== undefined ? dispositions.data[statFinder(dispositions, 'Spiritual Conversation')] : 0);
  // Gospel presentations
  SpreadsheetApp.getActiveSheet().getRange("J" + writeRow).setValue(dispositions.data[statFinder(dispositions, 'Gospel Presentation')] !== undefined ? dispositions.data[statFinder(dispositions, 'Gospel Presentation')] : 0);
  // Coached commitments
  SpreadsheetApp.getActiveSheet().getRange("K" + writeRow).setValue(dispositions.data[statFinder(dispositions, 'Profession of Faith')] !== undefined ? dispositions.data[statFinder(dispositions, 'Profession of Faith')] : 0);
  // JesusCares chats
  SpreadsheetApp.getActiveSheet().getRange("M" + writeRow).setValue(statusesByWebsite.data.JesusCares.data[statFinder(statusesByWebsite.data.JesusCares, 'closed')] !== undefined ? statusesByWebsite.data.JesusCares.data[statFinder(statusesByWebsite.data.JesusCares, 'closed')] : 0);
  // JesusCares commitments
  SpreadsheetApp.getActiveSheet().getRange("N" + writeRow).setValue(outcomesByWebsite.data.JesusCares.data[statFinder(outcomesByWebsite.data.JesusCares, 'Profession of Faith')] !== undefined ? outcomesByWebsite.data.JesusCares.data[statFinder(outcomesByWebsite.data.JesusCares, 'Profession of Faith')] : 0);
}