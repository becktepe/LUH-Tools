// Read if this insert should be done immediately 
chrome.storage.sync.get(['qis_auto'], function (items) {
    if (items['qis_auto']) {
        mainQISCalculator();
    }
});


chrome.runtime.onMessage.addListener(
    function (request, sender, sendResponse) {
        if (request.function === "mainQISCalculator") {
            mainQISCalculator();
        }
        else if (request.function === "script_already_executed") {
            sendResponse({'return': script_already_executed()});
        }  
    }
);

function script_already_executed() {
    //grade already inserted
    let lp_element = document.getElementById("luh-tool-lp");
    return lp_element != null;
}

function insertSummary(id, header_txt, body_txt) {
    var tables = document.getElementsByTagName("table")
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


function get_side_lang() {
    console.log(document.documentElement.lang)
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

    for (var i = 0, row; row = table.rows[i]; i++) {
        let cells = row.cells;
        if (row.childElementCount == 0) continue; // skips all spacer rows
        if (cells[0].classList.contains("tabelleheader")) continue; // skips header rows

        let name = cells[1].innerText;
        let grade = parseFloat(cells[4].innerText.replace(/,/, "."))
        let status = cells[5].innerText;
        let lp = parseInt(cells[6].innerText, 10);

        // skips all unnecessary rows
        if (status === "") continue;
        if (lp == "0") continue;

        lp_count += lp;
        if (!isNaN(grade)) {
            lp_weighted += lp;
            grade_weighted += lp * grade;

            average_grade += grade;
            grade_count++;
        }
        //console.log(`${name} ${status}, ${lp} ${grade}`)
        //console.log(`${name}, ${lp}, ${grade}`);
    }
    
    console.log(lp_count);
    console.log(lp_weighted);
    //console.log(grade_weighted);
    //console.log(grade_weighted/lp_weighted);
    let rounded_grade = (grade_weighted / lp_weighted).toFixed(3);
    let rounded_average_grade = (average_grade/grade_count).toFixed(3);
    if(document.documentElement.lang == "de") {
        insertSummary("luh-tool-lp", "Leistungspunkte gesamt", lp_count);
        insertSummary("luh-tool-weighted", "Leistungspunkte gewichtet", lp_weighted);
        insertSummary("luh-tool-grade", "Bachelornote (bis jetzt)", rounded_grade);
        insertSummary("luh-tool-average-grade", "Durchschnittliche Note", rounded_average_grade);
    } else {
        insertSummary("luh-tool-lp", "Total credit points ", lp_count);
        insertSummary("luh-tool-weighted", "Weighted credit point", lp_weighted);
        insertSummary("luh-tool-grade", "Bachelor grade (so far)", rounded_grade);
        insertSummary("luh-tool-average-grade", "Average grade", rounded_average_grade);

    }
    

}