// By Sam McFarland
// Reads in general information about the student from the Degree Check HTML:
// - enrollment and graduation terms
// - list of majors and minors
// - list of all classes taken
// and outputs all information in JSON form

import fs from "fs";
import cheerio from "cheerio";

export const courseParse = (input) => {
  //Read in degree check HTML
  const degCheck = fs.readFileSync(input, "utf8");

  //Load HTML
  const $ = cheerio.load(degCheck);

  const output = {};

  //Student ID ignored for now
  output[`student_id`] = null;

  //Get enrollment and graduation dates, put into JSON
  const genInfo = $('b:contains("Admit Term:")').parent().text().trim();

  const admitIndex = genInfo.indexOf("Admit Term:");
  const admitTerm = genInfo.slice(admitIndex + 12, admitIndex + 24);
  const admitQuarterYear = admitTerm.split(" ");
  output[`enrollment_year`] = admitQuarterYear[1];
  output[`enrollment_quarter`] = admitQuarterYear[0];

  //Note: parse slightly differently if graduation not yet applied for
  let gradIndex = genInfo.indexOf("Graduation");
  let gradTerm = genInfo.slice(gradIndex + 12, gradIndex + 23);
  if (gradTerm.includes("You")) {
    //"You have not applied to Graduate."
    gradIndex = genInfo.lastIndexOf("Graduation"); //Get anticipated graduation date
    gradTerm = genInfo.slice(gradIndex + 19, gradIndex + 30);
  }
  const gradQuarterYear = gradTerm.split(" ");
  output[`graduation_year`] = gradQuarterYear[1];
  output[`graduation_quarter`] = gradQuarterYear[0];

  //Get majors/minors
  const majorList = [];
  $('b:contains("Major(s)")')
    .next()
    .each((index, element) => {
      let major = $(element).find("li").text();
      while (major.length > 0) {
        let majorName = major.slice(0, major.indexOf("Drop")).trim();
        majorList.push(majorName);
        major = major.trim().slice(major.indexOf("Change") + 6);
      }
    });

  const minorList = [];
  $('b:contains("Minor(s)")')
    .next()
    .each((index, element) => {
      let minor = $(element).find("li").text();
      while (minor.length > 0) {
        let minorName = minor.slice(0, minor.indexOf("Drop")).trim();
        minorList.push(minorName);
        minor = minor.trim().slice(minor.indexOf("Change") + 6);
      }
    });

  output[`field`] = [majorList, minorList];

  //Extract table
  const classesTaken = [];
  var subject = "";

  $("table.dhckDataWB:first").each((index, element) => {
    $(element)
      .find("tr")
      .each((ind, elem) => {
        if (ind != 0) {
          //skip the column names
          const classData = {};
          $(elem)
            .find("td")
            .each((i, el) => {
              switch (i) {
                case 0: //grab the subject and save it for the next
                  subject = $(el).text().trim();
                  break;
                case 1: //grab the course number, put it and the subject into course_id
                  let courseNum = $(el).text().trim();
                  classData[`course_id`] = subject + courseNum;
                  break;
                case 4: //split the term taken into quarter and year, add to JSON
                  let term = $(el).text().trim();
                  const classQuarterYear = term.split(" ");
                  classData[`year`] = classQuarterYear[1];
                  classData[`quarter`] = classQuarterYear[0];
                  break;
                case 5: //grab the grade and put it in the JSON
                  classData[`grade`] = $(el).text().trim();
              }
            });
          classesTaken.push(classData);
        }
      });
  });

  //Put classes taken into output
  output[`classes_taken`] = classesTaken;

  // //Write JSON data to file
  // fs.writeFileSync('output.json', JSON.stringify(output, null, 2))

  //Write to JSON object
  const json = JSON.stringify(output, null, 2);
  return json;

  // console.log('HTML parsing complete.');
};

export default courseParse;

// courseParse("./something.htm");