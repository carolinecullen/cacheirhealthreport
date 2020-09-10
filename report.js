"use strict";

const MODE = [
  "Specialized",
  "Megamorphic",
  "Generic"
];

const HAPPINESS = [
  "😀",
  "😐",
  "☹️",
  "🤬"
];

const SCRIPT_HEADER_ROWS = 1;
const JSOP_HEADER_ROWS = 1;
const STUB_HEADER_ROWS = 2;

var JSON_FILE;
var isFiltered = false;

var selectedScriptRowNumber;
var selectedJSOpRowNumber;
var selectedStubRowNumber;

function highlightSelectedScript(tbody, row) {
  if (typeof selectedScriptRowNumber !== 'undefined') {
    // Change previously selected row to original color.
    tbody.rows[selectedScriptRowNumber].style.backgroundColor = "";
  }

  row.style.backgroundColor = "#03635d";
  selectedScriptRowNumber = row.rowIndex - SCRIPT_HEADER_ROWS;
}

function highlightSelectedStub(tbody, row) {
  if (typeof selectedStubRowNumber !== 'undefined') {
    // Change previously selected row to original color.
    tbody.rows[selectedStubRowNumber].style.backgroundColor = "";
  }

  row.style.backgroundColor = "#03635d";
  selectedStubRowNumber = row.rowIndex - STUB_HEADER_ROWS;
}

function highlightSelectedJSOp(tbody, row) {
  if (typeof selectedJSOpRowNumber !== 'undefined') {
    // Change previously selected row to original color.
    tbody.rows[selectedJSOpRowNumber].style.backgroundColor = "";
  }

  row.style.backgroundColor = "#03635d";
  selectedJSOpRowNumber = row.rowIndex - JSOP_HEADER_ROWS;
}

function addCellValue(row, value) {
  let cell = row.insertCell();
  let text = document.createTextNode(value);
  cell.appendChild(text);
}

// Create table for displaying CacheIROps contained in selected stub.
function createCacheIRTable(cacheIRTbody, stub) {
  if (stub.cacheIROps.length) {
    for (let op of stub.cacheIROps) {
      let row = document.createElement("tr");
      addCellValue(row, op.cacheIROp);
      addCellValue(row, op.opHealth);
      cacheIRTbody.appendChild(row);
    }
  } else {
    let row = document.createElement("tr");
    addCellValue(row, "No CacheIROps recorded.");
    cacheIRTbody.appendChild(row);
  }
}

// Create table for displaying stub chain for the selected JS_OP.
function createStubTable(cacheIRTable, cacheIRTbody, stubTbody, entry) {
  if (entry.stubs.length) {
    for (let stub of entry.stubs) {
      let row = document.createElement("tr");

      addCellValue(row, stub.stubHealth);
      addCellValue(row, stub.hitCount);

      row.onclick = function() {
        // Highlight selected stub row.
        highlightSelectedStub(stubTbody, row);

        if (cacheIRTable.style.display === "") {
          cacheIRTable.style.display = "inline-block";
        } else {
          clearCacheIRTable("inline-block");
        }

        createCacheIRTable(cacheIRTbody, stub);
      };

      stubTbody.appendChild(row);
    }
  } else {
    let row = document.createElement("tr");
    addCellValue(row, "No Stubs Attached.");
    stubTbody.appendChild(row);
  }

}

// Create table for displaying JS_OPs and their associated information.
function createOpTableRow(entry, opTbody, happinessFilter) {
  let health = entry.entryHappiness;

  if (happinessFilter == undefined || happinessFilter == health) {
    let stubTable = document.getElementById("stub-table");
    let stubTbody = stubTable.getElementsByTagName('tbody')[0];
    let row = document.createElement("tr");

    // Add JS_OP to table.
    addCellValue(row, entry.op);

    // Add line number to table.
    addCellValue(row, entry.lineno);

    // Add column number to table.
    addCellValue(row, entry.column);

    // Add health score to table if stubs exist.
    if (entry.hasOwnProperty('stubs')) {
      let cacheIRTable = document.getElementById("cacheIR-table");
      let cacheIRTbody = cacheIRTable.getElementsByTagName('tbody')[0];

      addCellValue(row, HAPPINESS[health]);

      // If stubs exist then add stub table for that row.
      row.onclick = function() {
        // Highlight selected JS_OP row.
        highlightSelectedJSOp(opTbody, row);

        if (stubTable.style.display === "") {
          stubTable.style.display = "block";
        } else {
          // When selecting a new JS_Op we must clear all previously 
          // created tables.
          clearStubTable("block");
          clearCacheIRTable("");
        }

        // For the display of the selected JS_Op.
        let jsOp = document.getElementById("jsOp-id");
        jsOp.textContent = entry.op;

        createStubTable(cacheIRTable, cacheIRTbody, stubTbody, entry);
      };
    }

    // Add mode to table if mode was recorded.
    if (entry.hasOwnProperty('mode')) {
      addCellValue(row, MODE[entry.mode]);
    }

    // Add fallback count to table if it exists.
    if (entry.hasOwnProperty('fallbackCount')) {
      addCellValue(row, entry.fallbackCount);
    }

    opTbody.appendChild(row);
  }
}

function createOpTable(entries, opTable, opTbody, happinessFilter) {
  opTable.style.display = "inline-block";

  for (let entry of entries) {
    createOpTableRow(entry, opTbody, happinessFilter);
  }

  if (isFiltered && opTbody.innerHTML == "") {
    let row = document.createElement("tr");
    addCellValue(row, "No stubs have happiness level specified by filter.");
    opTbody.appendChild(row);
  }
}

// Create table for displaying scripts and their associated information.
function createScriptTableRow(script, scriptTbody, happinessFilter) {
  let health = script.scriptHappiness;
  if (happinessFilter == undefined || happinessFilter == health) {
    let row = document.createElement("tr");

    // Add script name to table.
    addCellValue(row, script.filename);

    // Add line number to table.
    addCellValue(row, script.line);

    // Add column number to table.
    addCellValue(row, script.column);

    // Add health score for the script.
    addCellValue(row, HAPPINESS[health]);

    row.onclick = function() {
      let opTable = document.getElementById("op-table");
      let opTbody = opTable.getElementsByTagName('tbody')[0];

      // Highlight selected script row.
      highlightSelectedScript(scriptTbody, row);

      if (opTable.style.display === "") {
        opTable.style.display = "inline-block";
      } else {
        // When selecting a new script we must clear all previously 
        // created tables.
        clearOpTable("inline-block");
        clearStubTable("");
        clearCacheIRTable("");
      }

      createOpTable(script.entries, opTable, opTbody, happinessFilter);
    };


    scriptTbody.appendChild(row);
  }
}

function createScriptTable(happinessFilter) {
  let scriptTable = document.getElementById("script-table");
  scriptTable.style.display = "block";

  let scriptTbody = scriptTable.getElementsByTagName('tbody')[0];
  for (let script of JSON_FILE.scripts) {
    createScriptTableRow(script, scriptTbody, happinessFilter);
  }

  if (isFiltered && scriptTbody.innerHTML == "") {
    let row = document.createElement("tr");
    addCellValue(row, "No scripts have happiness level specified by filter.");
    scriptTbody.appendChild(row);
  }
}

function rateMyCacheIR(json) {
  JSON_FILE = json[0];
  if (JSON_FILE.channel != "RateMyCacheIR") {
    document.getElementById("status").textContent = "Wrong JSON spew channel."
  }

  document.getElementById("happiness-filter").style.display = "inline-block";

  createScriptTable(undefined);
}

function handleJSON(event) {
  const reader = new FileReader();
  const file = document.getElementById("file").files[0];
  let json;

  reader.onload = function(event) {
    const status = document.getElementById("status");

    try {
      json = JSON.parse(event.target.result);
      status.textContent = "Successfully parsed JSON.";
    } catch (e) {
      status.textContent = "Error parsing JSON file.";
      status.style.color = "red";
    }

    rateMyCacheIR(json);
  };

  reader.readAsText(file);
  event.preventDefault();
}

document.getElementById("form").addEventListener("submit", function() {
  handleJSON(event);
});

function filterOpTable(happinessFilter) {
  clearAllTables();
  createScriptTable(happinessFilter);

  isFiltered = true;
}

document.getElementById("clear-filter").addEventListener("click", function() {
  clearAllTables();
  createScriptTable(undefined);
});

document.getElementById("sad").addEventListener("click", function() {
  filterOpTable(3);
});

document.getElementById("medium-sad").addEventListener("click", function() {
  filterOpTable(2);
});

document.getElementById("medium-happy").addEventListener("click", function() {
  filterOpTable(1);
});

document.getElementById("happy").addEventListener("click", function() {
  filterOpTable(0);
});

document.getElementById("happiness-filter").addEventListener("click", function() {
  document.getElementById("happiness-options").classList.toggle("dropdown-display");
});

function clearScriptTable(displayString) {
  let scriptTable = document.getElementById("script-table");
  scriptTable.getElementsByTagName('tbody')[0].innerHTML = "";
  scriptTable.style.display = displayString;
  selectedScriptRowNumber = undefined;
}

function clearOpTable(displayString) {
  let opTable = document.getElementById("op-table");
  opTable.getElementsByTagName('tbody')[0].innerHTML = "";
  opTable.style.display = displayString;
  selectedJSOpRowNumber = undefined;
}

function clearStubTable(displayString) {
  let stubTable = document.getElementById("stub-table");
  stubTable.getElementsByTagName('tbody')[0].innerHTML = "";
  stubTable.style.display = displayString;
  selectedStubRowNumber = undefined;
}

function clearCacheIRTable(displayString) {
  let cacheIROpTable = document.getElementById("cacheIR-table");
  cacheIROpTable.getElementsByTagName('tbody')[0].innerHTML = "";
  cacheIROpTable.style.display = displayString;
}

function clearAllTables() {
  document.getElementById("happiness-options").classList.remove("dropdown-display");
  
  clearScriptTable("");
  clearOpTable("");
  clearStubTable("");
  clearCacheIRTable("");
}

document.getElementById("clear").addEventListener("click", function() {
  document.getElementById("form").reset();
  document.getElementById("happiness-filter").style.display = "";

  clearAllTables();

  document.getElementById("status").textContent = "Cleared.";
});
