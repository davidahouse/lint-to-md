#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const glob = require("glob");
const parseString = require("xml2js").parseString;

const lintResults = [];

const rootPrefix = path.dirname(path.resolve("."));

let output = "status";
if (process.argv.length > 2) {
  output = process.argv[2];
}

let sha = null;
if (process.argv.length > 3) {
  sha = process.argv[3];
}

let repoUrl = null;
if (process.argv.length > 4) {
  repoUrl = process.argv[4];
}

glob("**/lint-results.xml", async function (err, files) {
  // console.dir(files);
  for (let index = 0; index < files.length; index++) {
    parseString(fs.readFileSync(files[index]), function (err, result) {
      if (result.issues.issue != null) {
        for (let iindex = 0; iindex < result.issues.issue.length; iindex++) {
          lintResults.push(result.issues.issue[iindex]);
        }
      }
    });
  }

  if (output === "text") {
    outputText();
  } else if (output === "summary") {
    outputSummary();
  } else {
    if (lintResults.length > 0) {
      lintResults.forEach(function (finding) {
        if (finding["$"]["severity"] === "Error") {
          console.log(
            "lint findings detected, so returning a non-zero exit code"
          );
          process.exit(1);
        }
      });
    }
  }
});

function outputText() {
  let files = {};
  lintResults.forEach(function (finding) {
    for (let index = 0; index < finding.location.length; index++) {
      const fileName = finding.location[index]["$"].file.replace(
        rootPrefix + "/",
        ""
      );
      if (files[fileName] == null) {
        files[fileName] = {
          findings: [finding],
        };
      } else {
        files[fileName].findings.push(finding);
      }
    }
  });

  Object.keys(files).forEach(function (key) {
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

    files[key].findings.forEach(function (finding) {
      let output = "";
      if (finding["$"].severity === "Warning") {
        output += ":warning: ";
      } else if (finding["$"].severity === "Error") {
        output += ":rotating_light: ";
      }
      output += finding["$"].summary + " | ";
      if (
        sha != null &&
        repoUrl != null &&
        finding.location.length > 0 &&
        finding.location[0]["$"].line != null
      ) {
        output +=
          "[" +
          finding.location[0]["$"].line +
          "](" +
          repoUrl +
          "/blob/" +
          sha +
          "/" +
          key +
          "#L" +
          finding.location[0]["$"].line +
          ") | ";
        output +=
          "[" +
          finding["$"].message +
          "](" +
          repoUrl +
          "/blob/" +
          sha +
          "/" +
          key +
          "#L" +
          finding.location[0]["$"].line +
          ") | ";
      } else if (
        finding.location.length > 0 &&
        finding.location[0]["$"].line != null
      ) {
        output += finding.location[0]["$"].line + " | ";
        output += finding["$"].message;
      } else {
        output += "n/a | ";
        output += finding["$"].message;
      }
      console.log(output);
    });
    console.log(" ");
  });
}

function outputSummary() {
  let information = 0;
  let warnings = 0;
  let errors = 0;
  lintResults.forEach(function (finding) {
    if (finding["$"]["severity"] === "Warning") {
      warnings += 1;
    } else if (finding["$"]["severity"] === "Information") {
      information += 1;
    } else {
      errors += 1;
    }
  });

  console.log("### Lint Summary:");
  console.log(" ");
  console.log(
    "- :page_facing_up: " + information.toString() + " Information(s)"
  );
  console.log("- :warning: " + warnings.toString() + " Warning(s)");
  console.log("- :rotating_light: " + errors.toString() + " Error(s)");
}
