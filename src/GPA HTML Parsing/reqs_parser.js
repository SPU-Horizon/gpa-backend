// By Sam McFarland
// Reads in a specific degree's course requirements and outputs them as JSON
// Note: Only tested with Computer Science B.S. requirements so far; further testing and refinement needed

import fs from "fs";
import cheerio from "cheerio";

export const reqsParse = (input) => {
  //Read in degree check HTML
  const degCheck = fs.readFileSync(input, "utf8");

  //Load HTML
  const $ = cheerio.load(degCheck);

  const output = {};

  //Field ID ignored for now
  output[`field_id`] = null;

  //Parse field information
  const field = $("div.heading").text();
  const fName = field.slice(0, field.lastIndexOf("Catalog") - 9); // Name
  output[`field_name`] = fName;
  if (fName.includes("Minor")) {
    output[`field_type`] = "Minor";
  } else if (fName.includes("BA") || fName.includes("BS") || fName.includes("Major") || fName.includes("Certificate")) {
    output[`field_type`] = "Major";
  } else {
    output[`field_type`] = "Program";
  }
  output[`year`] = field.slice(field.lastIndexOf("Catalog") - 8,field.indexOf("Catalog") - 1); // Catalog year
  let field_credits = $("div.heading").find("i").text().split(" ");
  output[`credits`] = Number(field_credits[0].slice(1)); // Total credits required
  output[`UD_credits`] = Number(field_credits[3]); // Upper Division credits required

  //Parse field requirements

  const reqs = []; // Requirements array
  var req = {}; // Individual requirement group
  var title = "";
  req[`section_title`] = ""; // Title text for the section containing this group
  req[`credits_required`] = 0; // Credits required for this group
  req[`classes`] = []; // List of classes in the group
  req[`comment`] = false; // "true" if this is an empty group where only the section title text is relevant; each section has
  // one of these at the end to assist later formatting

  $("table.degReqTBL:first")
    .find("tr")
    .each((index, element) => {
      let titleRow = $(element).find('b[style="font-size:16px;"]').text().trim(); // Checks for section title formatting
      if (titleRow != "") {
        // If section title found:
        if (req[`section_title`] != "") {
          // Push the previous section title as an empty comment group
          req[`comment`] = true;
          reqs.push(req);
        }
        req = {}; // Reinitialize req with a new section title
        title = titleRow;
        req[`section_title`] = title;
        req[`credits_required`] = 0;
        req[`classes`] = [];
        req[`comment`] = false;
      } else if (
        $(element).hasClass("degReqRowA") ||
        $(element).hasClass("degReqRowA")
      ) {
        // Otherwise, check the row for degReqRow classes
        $(element)
          .children()
          .each((ind, elem) => {
            // If found, iterate through each child of the row (add cases if more info needed):
            switch (ind) {
              case 0: // From the first, grab each class from the table child and put it in the class list.
                $(elem)
                  .find("table")
                  .each((i, e) => {
                    req[`classes`].push($(e).text().trim().split(" ")[0]); // invisible split character is &nbsp; or U+00a0
                  });
              case 1: // From the second, grab the credits required.
                req[`credits_required`] = parseInt($(elem).text().trim());
            }
          });
        reqs.push(req); // Push and reinitialize req with the current section title
        req = {};
        req[`section_title`] = title;
        req[`credits_required`] = 0;
        req[`classes`] = [];
        req[`comment`] = false;
      }
    });
  if (req[`credits_required`] === 0) req[`comment`] = true;
  reqs.push(req);

  //Put requirements data into output
  output[`requirements`] = reqs;
  // //TEST OUTPUT
  // console.log(output);

  // //Write JSON data to file
  // fs.writeFileSync('reqs.json', JSON.stringify(output, null, 2))

  //Write to JSON object
  const json = JSON.stringify(output, null, 2);
  return json;

  // console.log('HTML parsing complete.');
};

export default reqsParse;
