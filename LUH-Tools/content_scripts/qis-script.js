window.onload = function () {
  // Read if this insert should be done immediately
  chrome.storage.sync.get(["qis_grade_insert"], function (items) {
    if (items["qis_grade_insert"]) {
      mainQISCalculator();
    }
  });
  chrome.runtime.onMessage.addListener(message_handler);
};

function message_handler(request, sender, sendResponse) {
  if (request.function === "mainQISCalculator") {
    mainQISCalculator();
  }
}

function script_already_executed() {
  //grade already inserted
  let lp_element = document.getElementById("luh-tool-lp");
  return lp_element != null;
}

function insertSummary(id, header_txt, body_txt) {
  var tables = document.getElementsByTagName("table");
  var table = tables[0];

  let row = table.insertRow(-1);
  let header = row.insertCell(0);
  header.id = id;
  header.classList.add("mod_header");
  header.innerText = header_txt;
  let body = row.insertCell(1);
  body.classList.add("mod_n_basic");
  body.innerText = body_txt;
}

function mainQISCalculator() {
  if (script_already_executed()) return;

  let tables = document.getElementsByTagName("table");
  let table = tables[1];

  let lp_count = 0;
  let lp_weighted = 0;
  let grade_weighted = 0;

  let average_grade = 0;
  let grade_count = 0;

  for (var i = 0, row; (row = table.rows[i]); i++) {
    let cells = row.cells;
    if (row.childElementCount != 11) continue; // skips all spacer rows
    if (cells[0].classList.contains("tabelleheader")) continue; // skips header rows
    if (
      !(
        cells[0].classList.contains("qis_konto") ||
        cells[0].classList.contains("mod_n")
      )
    )
      continue; //skips irrelevant rows

    //skip all summary rows like grade of all "Compulsory Modules"
    let name = cells[1].innerText;
    if (document.documentElement.lang === "de") {
      //detect if QIS side language
      if (name.toLowerCase().includes("module")) continue;
    } else {
      if (name.toLowerCase().includes("modules")) continue;
    }

    let grade = parseFloat(cells[4].innerText.replace(/,/, "."));
    let status = cells[5].innerText;
    let lp = parseInt(cells[6].innerText, 10);

    // skips all unnecessary rows
    if (status === "") continue;
    if (lp === "0") continue;

    lp_count += lp;
    if (!isNaN(grade) && grade !== 0) {
      //if row has a grade
      lp_weighted += lp;
      grade_weighted += lp * grade;

      average_grade += grade;
      grade_count++;
    }
    //console.log(`${name} ${status}, ${lp} ${grade}`)
    console.log(`${name}, ${lp}, ${grade}`);
  }

  //console.log(lp_count);
  //console.log(lp_weighted);
  //console.log(grade_weighted);
  //console.log(grade_weighted/lp_weighted);
  let rounded_grade = (grade_weighted / lp_weighted).toFixed(3);
  let rounded_average_grade = (average_grade / grade_count).toFixed(3);

  //if lang is german replace "." in number representation with ","
  if (chrome.i18n.getUILanguage() === "de") {
    rounded_grade = rounded_grade.replace(".", ",");
    rounded_average_grade = rounded_average_grade.replace(".", ",");
  }

  insertSummary(
    "luh-tool-lp",
    chrome.i18n.getMessage("total_credit_points"),
    lp_count
  );
  insertSummary(
    "luh-tool-weighted",
    chrome.i18n.getMessage("total_credit_points_weighted"),
    lp_weighted
  );
  insertSummary(
    "luh-tool-grade",
    chrome.i18n.getMessage("weighted_grade"),
    rounded_grade
  );
  insertSummary(
    "luh-tool-average-grade",
    chrome.i18n.getMessage("average_grade"),
    rounded_average_grade
  );
}

function mainQISCalculatorV2() {
  if (script_already_executed()) return;

  let grade_table = document.getElementsByTagName("table")[1];

  //detect if QIS side language for skip word
  let name_must_not_include =
    document.documentElement.lang === "de" ? "module" : "modules";

  console.log("filtering");
  //filter rows
  let rows_filtered = [...grade_table.rows].filter((row) => {
    let cells = row.cells;
    if (row.childElementCount != 11) return false; // skips all spacer rows
    if (
      !(
        cells[0].classList.contains("qis_konto") ||
        cells[0].classList.contains("mod_n")
      )
    )
      return false; //skips irrelevant rows

    let status = cells[5].innerText;
    if (status === "") return false; // skips all rows without a status

    let lp = cells[6].innerText;
    if (lp === "0" || lp === "") return false; // skips all rows without or 0 lp

    //skip all summary rows like grade of all "Compulsory Modules"
    let name = cells[1].innerText;
    if (name.toLowerCase().includes(name_must_not_include)) return false;

    console.log("added");
    return true;
  });

  let stats = {
    lp_count: 0,
    lp_weighted: 0,

    sum_grade: 0,
    sum_weighted_grade: 0,
    total_grade_count: 0,
  };
  for (let row of rows_filtered) {
    console.log("iteration");
    let cells = row.cells;
    let grade = parseFloat(cells[4].innerText.replace(/,/, "."));
    let lp = parseInt(cells[6].innerText, 10);

    stats.lp_count += lp;
    if (!isNaN(grade) && grade !== 0) {
      //if row has a grade
      stats.lp_weighted += lp;
      stats.sum_weighted_grade += lp * grade;
      stats.sum_grade += grade;
      stats.total_grade_count++;
    }
  }

  //console.log(lp_count);
  //console.log(lp_weighted);
  //console.log(grade_weighted);
  //console.log(grade_weighted/lp_weighted);
  let rounded_grade = (stats.sum_weighted_grade / stats.lp_weighted).toFixed(3);
  let rounded_average_grade = (
    stats.sum_grade / stats.total_grade_count
  ).toFixed(3);

  //if lang is german replace "." in number representation with ","
  if (chrome.i18n.getUILanguage() === "de") {
    rounded_grade = rounded_grade.replace(".", ",");
    rounded_average_grade = rounded_average_grade.replace(".", ",");
  }

  insertSummary(
    "luh-tool-lp",
    chrome.i18n.getMessage("total_credit_points"),
    stats.lp_count
  );
  insertSummary(
    "luh-tool-weighted",
    chrome.i18n.getMessage("total_credit_points_weighted"),
    stats.lp_weighted
  );
  insertSummary(
    "luh-tool-grade",
    chrome.i18n.getMessage("weighted_grade"),
    rounded_grade
  );
  insertSummary(
    "luh-tool-average-grade",
    chrome.i18n.getMessage("average_grade"),
    rounded_average_grade
  );
}
