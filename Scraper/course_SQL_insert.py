import csv

# Define the input and output file paths
input_file = 'jsonUpdate.csv'
output_file = 'gpa_updatedCoursesJSON.sql'

# Open the input and output files
with open(input_file, 'r', encoding='utf-8') as csv_file, open(output_file, 'w', encoding='utf-8') as sql_file:
    # Create a CSV reader object
    csv_reader = csv.reader(csv_file)
    
    # Skip the header row
    next(csv_reader)
    
    # Initialize a list to store values for each row
    value_sets = []
    
    # Iterate over each row in the CSV file
    for row in csv_reader:
        # Extract the values from the row
        course_id = row[0]
        name = row[1].replace("'", "''")  # Escape single quotes
        description = row[2].replace("'", "''")  # Escape single quotes
        credits = row[3]
        attributes = row[4]
        standing = row[5]
        restrictions = row[6]
        prerequisites = row[7]
        corequisites = row[8]
        approval_required = row[9]

        
        if attributes != "NULL":
            attributes = "'" + attributes + "'"

        if standing != "NULL":
            standing = "'" + standing + "'"

        if restrictions != "NULL":
            restrictions = "'" + restrictions + "'"
        
        if prerequisites != "NULL":
            prerequisites = "'" + prerequisites + "'"

        if corequisites != "NULL":
            corequisites = "'" + corequisites + "'"

        description = description.replace('\r', '')
        description = description.replace('\n', '')


        # Construct the values for the current row
        values = f"('{course_id}', '{name}', '{description}', {credits}, {attributes}, {standing}, {restrictions}, {prerequisites}, {corequisites}, {approval_required})"
        
        # Append the values to the list
        value_sets.append(values)

    # Construct the final SQL insert statement
    insert_statement = f"INSERT INTO course (code, name, description, credits, attributes, standing, restrictions, prerequisites, corequisites, approval_required)\nVALUES\n"
    insert_statement += ",\n".join(value_sets) + ";\n"  # Join the value sets with commas and newlines

    # Write the insert statement to the SQL file
    sql_file.write(insert_statement)
