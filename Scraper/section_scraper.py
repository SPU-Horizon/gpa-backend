from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.common.exceptions import NoSuchElementException
from selenium.webdriver.support import expected_conditions as EC
from time import sleep

import pandas as pd


# **** NOTE I WENT THROUGH AND REMOVED ALL SEPTEMBER SESSION DATES AND REPLACED THEM WITH ARRANGED


# Set up the Chrome driver to scrape 2024-2025 sections
driver = webdriver.Chrome()
driver.get("https://spu.edu/undergraduate-time-schedule?term_year=20245&cat_year=20245")
sleep(60)

# Find the element containing the list of subjects for the year 2023-2024
subject_list = driver.find_element(By.CLASS_NAME, "ts-subject-list")
# Find all the links within the subject list
field_elements = subject_list.find_elements(By.TAG_NAME, "a")

# Store all the links in a list
links = [link.get_attribute("href") for link in field_elements]

# Initialize an empty list to store the data
data = []
course_links = []
# Collect course links
for link in links:

    driver.get(link)

    # Find all course headings and collect their href attributes
    try:
        course_headings = driver.find_elements(By.XPATH, "//tr[@class='course-heading']/td/a")
        
        for course_heading in course_headings:
            href = course_heading.get_attribute("href")
            course_links.append(href)
    except NoSuchElementException:
        print(f"Course heading not found for {link}")

# Iterate through each course link
if(course_links != []):
    for course in course_links:
        driver.get(course)
        
    # Try to extract course heading
        course_name = driver.find_element(By.XPATH, '//*[@id="maincolumn"]/div[2]/div[2]/h2').text.split("\n")[0]
        course_id = course_name.split(":")[0].strip()
        
        #Loop that iterates and finds all elements, we must increment by 2 to get every other one.
        #sections = driver.find_elements(By.XPATH, '//*[@id="maincolumn"]/div[2]/div[2]/div/table/tbody/tr')
        sections = driver.find_elements(By.XPATH, '//*[@id="maincolumn"]/div[2]/div[2]/div/table/tbody/tr[contains(@class, "section")]')

        for section in sections:
            try:
                # Extracting data based on their position within the row
                section_info = section.find_elements(By.TAG_NAME, "td")
                term = section_info[0].text.strip()
                crn = section_info[1].text.strip()
                instructors = section_info[3].text.split("\n")[0].strip()
                days = section_info[4].text.strip()
                times = section_info[5].text.strip()
                dates = section_info[6].text.strip()
                location = section_info[7].text.strip()
                data.append([crn, course_id, "2023", term.lower(), days, times, dates, location, instructors])
            except IndexError:
                continue


# Close the driver
driver.quit()

# Create a DataFrame from the data list
df = pd.DataFrame(data, columns=["CRN", "Course Heading", "Year", "Term","Days", "Times", "Dates","Location", "Instructor"])

# Output DataFrame to CSV file
df.to_csv("course_sections2025.csv", index=False)

print("Data saved to course_hrefs.csv")
