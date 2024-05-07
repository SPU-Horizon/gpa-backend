import csv

# Define the input and output file paths
input_file = 'sections_with_json.csv'
output_file = 'sections_Insert.sql'

# Open the input and output files
with open(input_file, 'r', encoding='utf-8') as csv_file, open(output_file, 'w', encoding='utf-8') as sql_file:
    # Create a CSV reader object
    csv_reader = csv.DictReader(csv_file)
    
    # Initialize a list to store values for each row
    value_sets = []
    
    # Iterate over each row in the CSV file
    for row in csv_reader:
        # Extract the values from the row
        section_id = row['CRN']
        course_id = row['Course']  # Extract course_id from Course column
        year = '2024' #I AM OVERWRITING YEAR
        term = row['Term']
        classes = row['Classes']  # Assuming 'Classes' is in JSON format
        location = row['Location']
        instructor = row['Instructor']

        # Construct the values for the current row

        #TODO: REMOVE TOPIC NULL
        values = f"({section_id}, '{course_id}', '{year}', '{term}', '{classes}', '{location}', "
        values += f'"{instructor}")'
        
        # Append the values to the list
        value_sets.append(values)

    # Construct the final SQL insert statement
    insert_statement = f"INSERT INTO section (section_id, course_id, year, quarter, classes, location, instructor)\nVALUES\n"
    insert_statement += ",\n".join(value_sets) + ";\n"  # Join the value sets with commas and newlines

    # Write the insert statement to the SQL file
    sql_file.write(insert_statement)
