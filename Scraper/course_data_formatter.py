import pandas as pd
import json

def parse_prerequisites(input):
    prerequisites = []
    temp = []
    index = 0
    logic_state = True
    length = len(input)
    while(index < length):
        index_of_parenthesis = input[index : index + 3].find("(") + index
        if (index_of_parenthesis >= index):
            if (len(temp) > 0):
                prerequisites.append([temp])
            temp = parse_prerequisites(input[index_of_parenthesis + 1 : input[index_of_parenthesis : length].find(')') + index_of_parenthesis])
            index = input[index_of_parenthesis : length].find(')') + index_of_parenthesis + 1
            if (logic_state):
                prerequisites.append(temp[0])
            else:
                for or_group in temp[0]:
                    prerequisites[-1].append(or_group)
            temp = []
        elif(input[index : index + 3].find('AND') != -1):
            logic_state = True
            index = input[index : index + 3].find('AND') + index + 3
        elif(input[index: index + 2].find('OR') != -1):
 
            logic_state = False
            index = input[index : index + 2].find('OR') + index + 2
            if (len(temp) != 0):
                if (len(prerequisites) != 0):
                    prerequisites[-1].append(temp)
                else:
                    prerequisites.append([temp])
                temp = []
        else:
            concurrent_available = False
            course_id = input[index : input[index : length].find(':') + index].strip()
            if(course_id.find('can be taken concurrently') != -1):
                course_id = course_id[0:course_id.find('can be taken concurrently')].strip()
                concurrent_available = True
            min_grade = input[input[index : length].find(':') + index + 1 : input[index : length].find(' or better') + index].strip()
            temp.append({'course_id': course_id, 'min_grade': min_grade, 'concurrent_available': concurrent_available})
            index = input[index : length].find(" or better") + index + 10
    
    if (len(temp) > 0):
        if (logic_state):
            prerequisites.append([temp])
        else:
            prerequisites[-1].append(temp)
    return prerequisites

def enumerate_prerequisites(input):
    prerequisite_options = []
    prerequisites = parse_prerequisites(input)

    for prerequisite in prerequisites:
        if len(prerequisite_options) == 0:
            prerequisite_options = prerequisite
        else:
            curr_options = []
            for option in prerequisite:
                i = len(curr_options)
                for prerequisite_option in prerequisite_options:
                    curr_options.append(prerequisite_option)
                    curr_options[i] += option
                    i += 1
            prerequisite_options = curr_options
    return prerequisite_options




# This function takes an input string of corequisites and returns json array of those corequisites
def create_corequisites_json(input_string):
    corequisites = input_string.split(', ')
    json_array_string = json.dumps(corequisites)
    return json_array_string


# This function goes through the input and matches it to the possible string of inputs in order to get the correct code
def match_attributes_to_codes(attribute_list):
    codes = []
    attribute_codes = {
        'Upper-Division': 'UD',
        'Ways of Engaging': 'WE',
        'WK Social Sciences': 'WKSS',
        'WK Humanities': 'WKH',
        'Writing "W" Course': 'W',
        'WK Applied Science': 'WKAS',
        'WK Arts': 'WKA',
        'Cultural Understand&Engagement': 'CUE',
        'WK Quantitative Reasoning': 'WKQR',
        'Honors Course': 'HON',
        'Foreign Language Comp': 'FLC',
        'WK Fundamental Science': 'WKFS',
    }

    for attr in attribute_list:
        if attr in attribute_codes:
            codes.append(attribute_codes[attr])
        else :
            return "NULL"
    return ','.join(codes)


# This function goes through the restriction list and returns the standing for the course
def find_standing(restriction_list):
    if(restriction_list.find("excluded") != -1): # If the restriction list contains excluded then we need to find the standing that is not excluded
        standing_set = {"Freshman", "Sophomore", "Junior", "Senior", "Graduate", "Doctoral", "Post-Baccalaureate"}
        excluded = set(restriction_list[0:restriction_list.find("student")].strip().split(", "))
        return ', '.join(standing_set.difference(excluded))
    elif(restriction_list.find("only") != -1): # If the standing includes only then we need to find the only standings allowed
        standing_list = restriction_list[0:restriction_list.find("student")].strip()
        return standing_list

    return "NULL"


# Read the input CSV file
input_df = pd.read_csv("scraped_courses.csv") # Raw data does have some modification from the original data. (Removed certain things like september sesion and parenthesis from tests)


# Create the columns
output_df = pd.DataFrame(columns=["CourseID", "Name", "Description", "Credits", "Atrributes", "Standing", "Restrictions", "Prerequisites", "Corequisites", "Approval"])


# Iterate through each row in the input DataFrame (raw data)
for index, row in input_df.iterrows():
    
    # Check if "course-heading" is a string or NaN
    if isinstance(row["course-heading"], str):
        course_id_and_name = " ".join(row["course-heading"].split())  # Remove line breaks within the column
        temp = course_id_and_name[0:course_id_and_name.find("Course Details")-len("Course Details")]
        course_id_and_name = temp
        course_id = course_id_and_name[0:course_id_and_name.find(":")]

        name = course_id_and_name[course_id_and_name.find(":")+2:len(course_id_and_name)] # Set the course name
    else:
        continue
    

    credit = row["Credits"] # This line extracts the "Credits" section from the raw data and sets it to the variable "credit"
    credit = str(credit).strip() #str() sets variable to be a string and strip() removes leading/trailing whitespaces


    if credit.find("-") != -1: #Sometimes the credit column just has a "-" or " "
        credit = credit.split("-")[1].strip()
        print("found it")
    elif credit == "nan":
        credit = "NULL"
        print("NAN FOUND")



    description = row["Course Description"] # Extract the course description column from the row in raw data

    # Initialize variables
    restrictions = ""
    prerequisites = ""
    corequisites = ""
    attributes = "NULL"
    approval = 0
    required_standing = "NULL"

    list_of_attributes = "NULL"
    json_restrictions = "NULL"
    json_corequisites = "NULL"
    json_prerequisites = "NULL"
    
    
    restrictions_start = -1
    prerequisites_start = -1
    corequisites_start = -1
    attributes_start = -1
    approval_start = -1
    
    
    # Check if the content after the description contains "Restrictions:" or "Prerequisites:" or "Corequisites:"
    # If you take a look at the raw data, the additional info column is the one which contains all the restriction, prerequisite, corequisite, attribute information.

    additional_info = row["Additional Information"]

    # Find starting index of each section
    restrictions_start = additional_info.find("Restrictions:")
    prerequisites_start = additional_info.find("Prerequisites:")
    corequisites_start = additional_info.find("Corequisites:")
    attributes_start = additional_info.find("Attributes:")
    approval_start = additional_info.find("Approval:")

    if(approval_start != -1): #If approval required is found then set approval to 1
        approval = 1

    # If the restriction information is found, extract the information
    if restrictions_start != -1:
        list_of_restrictions = []
        fields = []

        # Initialize restriction information
        json_restrictions = {
        "excluded_fields": None,
        "allowed_fields": None,
        "transfer_only": False,
        }
        default_restrictions = json_restrictions.copy()
        
        
        # These two lines find where the restricitons end
        info_after_restrictions = additional_info[restrictions_start: -1]
        restriction_end = info_after_restrictions.find("\n") + restrictions_start

        # Extract the line that contains the restrictions
        restrictions = additional_info[restrictions_start + len("Restrictions:"):restriction_end].strip()
            
        # Check if the restrictions contain "International Sustainable Dev"
        if(restrictions.find("International Sustainable Dev") != -1):
            json_restrictions["International Sustainable Dev. required?"] = True

        # Multiple restrictions are seperated by periods, so we split them by periods
        list_of_restrictions.extend(restrictions.split(". ")) #this period messes up 1 thing (international sustianable dev)
  

        #loop through restrictions list we just created
        for i in range(len(list_of_restrictions)):
            if(list_of_restrictions[i].find("Undergraduate") != -1):
                if(list_of_restrictions[i].find("Undergraduate  only") != -1): #The double space before only is not a typo
                    required_standing = "freshman,sophomore,junior,senior"
                elif(list_of_restrictions[i].find("Graduate, Undergraduate  only") != -1):
                    required_standing = "freshman,sophomore,junior,senior,graduate"
            elif(list_of_restrictions[i].find("Doctoral, Graduate are excluded") != -1): #special case
                required_standing = "freshman,sophomore,junior,senior,post-baccalaureate"
            elif (list_of_restrictions[i].find("student") != -1): #If there is a student standing restriction call find_standing
                required_standing = find_standing(list_of_restrictions[i]).lower()
                required_standing = required_standing.replace(" ", "")
            elif (list_of_restrictions[i].find("Concentrations") != -1):
                concentrations = list_of_restrictions[i][0:list_of_restrictions[i].find("Majors")].strip()
                fields.extend(concentrations.split(", "))
                json_restrictions["allowed_fields"] = fields
            elif (list_of_restrictions[i].find("Theatre Performance concentrations only") != -1):
                fields.append("Theatre Performance")
                json_restrictions["allowed_fields"] = fields
            elif(list_of_restrictions[i].find("majors ") != -1 ):
                majors = list_of_restrictions[i][0:list_of_restrictions[i].find("majors")].strip()
                fields.extend(majors.split(", "))
                if(list_of_restrictions[i].find("only") != -1):
                    json_restrictions["allowed_fields"] = fields
                elif(list_of_restrictions[i].find("excluded") != -1):
                    json_restrictions["excluded_fields"] = fields
            elif(list_of_restrictions[i].find("minors ") != -1 ):
                minors = list_of_restrictions[i][0:list_of_restrictions[i].find("minors")].strip()
                fields.extend(minors.split(", "))
                json_restrictions["allowed_fields"] = fields
            elif(list_of_restrictions[i].find("STEM & Social Sciences") != -1):
                fields.append("Stem & Social Sciences")
                json_restrictions["allowed_fields"] = fields
            # elif(list_of_restrictions[i].find("University Scholar Accepted") != -1):
            #     json_restrictions["University Scholar Accepted  cohort(s) only?"] = True
            elif(list_of_restrictions[i].find("Health Sciences  only") != -1): #This double space before "only" is not a typo
                fields.append("Health Sciences")
                json_restrictions["allowed_fields"] = fields
            if(list_of_restrictions[i].find("Matriculated") != -1):
                json_restrictions["transfer_only"] = True

        if(json_restrictions == default_restrictions):
            json_restrictions = "NULL"
        else:
            json_restrictions = json.dumps(json_restrictions)


    # If the prerequisite information is found, lets extract the information
    if prerequisites_start != -1:
        prerequisites = {}
        #Preeqs are always last in additional information, so no need to find line break
        prerequisite_info = additional_info[prerequisites_start + len("Prerequisites:"):].strip()
        prerequisites = parse_prerequisites(prerequisite_info) # Call the function which formats everything
        json_prerequisites = json.dumps(prerequisites)


    # If the corequisite information is found, lets extract the information
    if corequisites_start != -1:
        info_after_corequisites = additional_info[corequisites_start: -1]
        corequisite_end = info_after_corequisites.find("\n") + corequisites_start
        corequisites += additional_info[corequisites_start + len("Corequisites:"):corequisite_end].strip() # Extract the line with coreqs
        json_corequisites = create_corequisites_json(corequisites) # Not using json.dumps() because of weird output

        
    # If attribute information is found, lets extract the information
    if attributes_start != -1:
        info_after_attributes = additional_info[attributes_start: -1]
        attributes_end = info_after_attributes.find("\n") + attributes_start

        list_of_attributes = additional_info[attributes_start + len("Attributes:"):attributes_end].strip()
        attributes = match_attributes_to_codes(list_of_attributes.split(", "))


    # Append a new row to the output DataFrame (This is at the end of each loop iteration)
    new_row = pd.DataFrame({
        "CourseID": [course_id],
        "Name" : [name],
        "Credits": credit,
        "Description": [description],
        "Atrributes": attributes,
        "Standing": required_standing,
        "Restrictions": json_restrictions,
        "Prerequisites": json_prerequisites,
        "Corequisites": json_corequisites,
        "Approval": approval
    })


    output_df = pd.concat([output_df, new_row], ignore_index=True) # Add all new rows to the output DataFramea

# Write the output DataFrame to a new CSV file
output_df.to_csv("stevenTEst.csv", index=False, header=True)
