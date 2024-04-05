// By Sam McFarland
// Reads in a specific degree's course requirements and outputs them as JSON
// Note: Only tested with Computer Science B.S. requirements so far; further testing and refinement needed

import fs from "fs";
import { load } from "cheerio";

export const reqsParse = (input) => {
  //Read in degree check HTML
  const degCheck = fs.readFileSync(input, "utf8");

  //Load HTML
  const $ = load(degCheck);

  const output = {};

  //Parse field information
  const field = $("div.heading").text();
  const fName = field.slice(0, field.lastIndexOf("Catalog") - 9); // Name
  output[`field_name`] = fName;
  if (fName.includes("Minor")) {
    output[`field_type`] = "Minor";
  } else if ((fName.includes("Certification") && !fName.includes("Education")) || 
             (fName.includes("Pre-") && !fName.includes("Social")) || 
              fName.includes("University Scholars")) {
    output[`field_type`] = "Program";
  } else {
    output[`field_type`] = "Major";
  }
  output[`year`] = field.slice(field.lastIndexOf("Catalog") - 8,field.indexOf("Catalog") - 1); // Catalog year
  let field_credits = $("div.heading").find("i").text().split(" ");
  output[`credits`] = Number(field_credits[0].slice(1)); // Total credits required
  output[`UD_credits`] = Number(field_credits[3]); // Upper Division credits required

  //Parse field requirements

  const reqs = []; // Requirements array
  var groups = []; // Inner array of requirement groups (only 1 except if OR)
  var req = {}; // Individual requirement group
  var title = "";
  req[`section_title`] = ""; // Title text for the section containing this group
  req[`credits_required`] = 0; // Credits required for this group
  req[`classes`] = []; // List of classes in the group
  var is_or = false; // boolean for if this line is OR
  var last_or = false; // boolean for if last line was OR

  $("table.degReqTBL:first")
    .find("tr")
    .each((index, element) => {
      let titleRow = $(element).find('b[style="font-size:16px;"]').text().trim(); // Checks for section title formatting
      if (titleRow != "") {
        // If section title found:
        if (req[`section_title`] != "") {
          groups.push(req);
          //TEST OUTPUT (uncomment all occurrences to test this level)
          // console.log(groups);
          reqs.push(groups);
        }
        groups = []; // Reinitialize groups
        req = {}; // Reinitialize req with a new section title
        title = titleRow;
        req[`section_title`] = title;
        req[`credits_required`] = 0;
        req[`classes`] = [];
      } else if ( // Otherwise, check the row for degReqRow classes
        $(element).hasClass("degReqRowA") ||
        $(element).hasClass("degReqRowB")
      ) {
        $(element)
          .children()
          .each((ind, elem) => {
            // Check for OR:
            if($(elem).text().trim().startsWith("OR") && $(elem).text().trim().length == 2) {
              is_or = true;
            }
            // If found, iterate through each child of the row (add cases if more info needed):
            switch (ind) {
              case 0: // From the first, grab each class from the table child and put it in the class list.
                $(elem)
                  .find("table")
                  .each((i, e) => {
                    req[`classes`].push($(e).text().trim().split(" ")[0]); // invisible split character is &nbsp; or U+00a0
                  });
              case 1: // From the second, grab the credits required.
                let credits_required = parseInt($(elem).text().trim());
                if (isNaN(credits_required)) credits_required = 0;
                req[`credits_required`] += credits_required;
            }
          });
        if (is_or) { // If this line was OR, continue, setting last_or to true and is_or to false.
          is_or = false;
          last_or = true;
        } else if (last_or) { // If the last line was OR, add this group to the previous set of groups.
          groups = reqs.pop();
          groups.push(req);
          //TEST OUTPUT (uncomment all occurrences to test this level) 
          // (note: will repost previous group set with new group added)
          // console.log(groups);
          reqs.push(groups);
          last_or = false; // Also, reset last_or.
        } else { // Otherwise, just push this requirement as a lone group.
          groups.push(req);
          //TEST OUTPUT (uncomment all occurrences to test this level)
          // console.log(groups);
          reqs.push(groups);
        }
        groups = [];
        req = {};
        req[`section_title`] = title;
        req[`credits_required`] = 0;
        req[`classes`] = [];
      }
    });
  if (last_or) {
    groups = reqs.pop();
  }
  groups.push(req);
  //TEST OUTPUT (uncomment all occurrences to test this level)
  // console.log(groups);
  reqs.push(groups);

  //Put requirements data into output
  output[`requirements`] = reqs;
  //TEST OUTPUT
  // console.log(reqs);
  // console.log(output);

  // //Write JSON data to file
  // fs.writeFileSync('reqs.json', JSON.stringify(output, null, 2))

  //Write to JSON object
  const json = JSON.stringify(output, null, 2);
  return json;

  // console.log('HTML parsing complete.');
};

export default reqsParse;
