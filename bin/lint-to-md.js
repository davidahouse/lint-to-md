#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const glob = require("glob");
const parseString = require("xml2js").parseString;

const lintResults = [];

const rootPrefix = path.dirname(path.resolve("."));

let output = "summary";
if (process.argv.length > 2) {
  output = process.argv[2];
}

let sha = null;
if (process.argv.length > 4) {
  sha = process.argv[4];
}

let repoUrl = null;
if (process.argv.length > 5) {
  repoUrl = process.argv[5];
}

glob("**/lint-results.xml", async function(err, files) {
  // console.dir(files);
  for (let index = 0; index < files.length; index++) {
    parseString(fs.readFileSync(files[index]), function(err, result) {
      for (let iindex = 0; iindex < result.issues.issue.length; iindex++) {
        lintResults.push(result.issues.issue[iindex]);
      }
    });
  }

  if (output === "text") {
    outputText();
  } else {
    outputSummary();
  }
});

function outputText() {
  let files = {};
  lintResults.forEach(function(finding) {
    for (let index = 0; index < finding.location.length; index++) {
      const fileName = finding.location[index]["$"].file.replace(
        rootPrefix + "/",
        ""
      );
      if (files[fileName] == null) {
        files[fileName] = {
          findings: [finding]
        };
      } else {
        files[fileName].findings.push(finding);
      }
    }
  });

  Object.keys(files).forEach(function(key) {
    if (sha != null && repoUrl != null) {
      console.log(
        "### [" + key + "](" + repoUrl + "/blob/" + sha + "/" + key + ")"
      );
    } else {
      console.log("### " + key);
    }

    console.log(" ");
    console.log("Finding | Line | Description ");
    console.log("------- | ---- | ------------");

    files[key].findings.forEach(function(finding) {
      let output = "";
      if (finding["$"].severity === "Warning") {
        output += ":warning: ";
      } else {
        output += ":rotating_light: ";
      }
      output += finding["$"].summary + " | ";
      if (sha != null && repoUrl != null) {
        output +=
          "[" +
          finding.line +
          "](" +
          repoUrl +
          "/blob/" +
          sha +
          "/" +
          key +
          "#L" +
          finding.line +
          ") | ";
        output +=
          "[" +
          finding.reason +
          "](" +
          repoUrl +
          "/blob/" +
          sha +
          "/" +
          key +
          "#L" +
          finding.line +
          ") | ";
      } else {
        output += finding.location[0]["$"].line + " | ";
        output += finding["$"].message;
      }
      console.log(output);
    });
    console.log(" ");
  });
}

function outputSummary() {
  let warnings = 0;
  let errors = 0;
  lintResults.forEach(function(finding) {
    if (finding["$"]["severity"] === "Warning") {
      warnings += 1;
    } else {
      errors += 1;
    }
  });

  console.log("### Lint Summary:");
  console.log(" ");
  console.log("- :warning: " + warnings.toString() + " Warning(s)");
  console.log("- :rotating_light: " + errors.toString() + " Error(s)");
}
