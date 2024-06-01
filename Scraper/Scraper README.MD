The 'Scraper' folder holds 6 files

1.  course_data_formatter.py - This python program was used to format the scrapestorm output to a csv output.
2.  scraped_courses.csv - This csv was the input for course_data_formatter.py.
3.  course_SQL_insert.py - This python program takes the output CSV from course_data_formatter.py.

4.  section_scraper.py - This file uses selenium to access https://spu.edu/undergraduate-time-schedule and collect the section information available there.
5.  create_section_json.py - Program for correctly formatting the scraped data from the section_scraper.py.
6.  section_SQL_insert.py - This file takes in the CSV output from create_section_json.py and makes a SQL insert. It was easily derived from course_SQL_insert.py

Reason for this approach:

- Scrapestorms output to CSV was not clean and required formatting. Then the MySQL CSV import wizard failed to correctly import the JSON columns.
  because of this the next best option was to create an insert statement from the csv file. The section scraper was used since scrapestorm was
  abandoned, it is planned to be combined with create_section_json.py. section_sql_insert.py creates the sql insert statement from the section csv.

For future development:

- Removing the intermidiate CSV step.
- Accessing
