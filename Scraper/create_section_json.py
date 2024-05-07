import pandas as pd
import json

# Read the CSV file
df = pd.read_csv("course_sections2025.csv")
data = []

# In this program we take in all information from the input CSV and condense the Days,Times, and Dates columns into a single JSON object for reach row
# Read line by line
for index, row in df.iterrows():
    json_array = []


    try:
        if '\n' in row['Location']: #This if evaluates to True when there is a new line character in the location column, indicating multiple locations
            row['Location'] = "Multiple Locations"
    except TypeError:
        print("Location: ", row['Location'], "CRN: ", row['CRN'])
        exit()

    if '**' in row['Location']: # Online classes are labled as "**online"
        row['Location'] = row['Location'].replace('**', '') 

    if '\n' in row['Days']:# We enter this if statement when there is a newline character in the days column, indicating multiple days at different times or dates

        # Split the days, times, and dates into lists (each new line of days is equivalent/on the same row as the corresponding time and date line)
        days_list = row['Days'].split('\n')
        times_list = row['Times'].split('\n')
        dates_list = row['Dates'].split('\n')

        #Loop through the lists and remove any carriage returns
        w = 0
        while w < len(days_list):
            if '\r' in days_list[w]:
                days_list[w] = days_list[w].replace('\r', '')
            if '\r' in times_list[w]:
                times_list[w] = times_list[w].replace('\r', '')
            if '\r' in dates_list[w]:
                dates_list[w] = dates_list[w].replace('\r', '')
            w += 1

        # We will be using these lists as the core building blocks of the json object. Each element in final_days_list will correspond to the same index in final_times_list and final_dates_list
        final_days_list = []
        final_times_list = []
        final_dates_list = []

        # Add all times, and dates to the final lists. final_days will be modified to include comma seperated days like "M,W,F" as individual entries in the list
        final_times_list.extend(times_list)
        final_dates_list.extend(dates_list)

        # Remove days labled as "Arranged" and the corresponding dates/times
        i2 = 0
        while i2 < len(days_list):
            if days_list[i2] == "Arranged":
                days_list.pop(i2)
                final_dates_list.pop(i2)
                final_times_list.pop(i2)
                i2 = 0
            else:
                i2 += 1
                        
        
        # Loop through list and remove all dates which do not match the first date (the first date is the date classes always meet, different dates occur rarely ) as well as corresponding days, and times
        u = 0
        while u < len(final_dates_list):
            if final_dates_list[u] != final_dates_list[0]:
                final_times_list.pop(u)
                days_list.pop(u)                
                final_dates_list.pop(u)
                u = 0
            else:
                u += 1


        # Split days with commas into individual entries (such as days like "M,W,F") if we split days into another item in the list then also add a list item for date and time
        j = 0
        while j < len(days_list):
            if ',' in days_list[j]:
                final_days_list.extend(days_list[j].split(','))
                x = 0
                while x < len(days_list[j].split(','))-1:
                    final_times_list.append(times_list[j])
                    final_dates_list.append(dates_list[j])
                    x += 1
            else:
                final_days_list.append(days_list[j])
            j += 1

        # Create a JSON object for each day and time
        i = 0
        weekdays_found = []
        while i < len(final_days_list):
            if final_days_list[i] not in weekdays_found:
                weekdays_found.append(final_days_list[i])
                start_end = []
                start_end.extend(final_times_list[i].split('-'))
                json_array.append({"weekday": final_days_list[i], "start_time": start_end[0], "end_time": start_end[1]})
            i += 1

    # We enter this if statement if the days column is only "Arranged"        
    elif "Arranged" in row['Days']:
        pass

    else: #Could be M,W,F (commar seperated days) or a single day but only 1 line (so there are no "\n" characters in the days column)
        days = row['Days']
        times = row['Times']

        final_days_list = []
        start_end = []
        start_end.extend(times.split('-'))
        
        # Split days with commas into individual entries (such as days like "M,W,F")
        if ',' in days:
            final_days_list.extend(days.split(','))
        else:
            final_days_list.append(days)

        i = 0
        while i < len(final_days_list):
            json_array.append({"weekday": final_days_list[i], "start_time": start_end[0], "end_time": start_end[1]})
            i += 1

    data.append([row['CRN'], row['Course Heading'], row['Year'], row['Term'], json.dumps(json_array), row['Location'], row['Instructor']])


# Create a DataFrame from the data list
af = pd.DataFrame(data, columns=["CRN", "Course", "Year", "Term", "Classes", "Location", "Instructor"])

# Output DataFrame to CSV file
af.to_csv("sections_with_json.csv", index=False)