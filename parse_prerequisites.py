import json

def parse_prerequisites(input):
    print ("Function called with: " + input)
    prerequisites = []
    temp = []
    index = 0
    logic_state = True
    length = len(input)
    while(index < length):
        print ("While Loop starts with:" + input[index : length])
        index_of_parenthesis = input[index : index + 3].find("(") + index
        if (index_of_parenthesis >= index):
            print("Opening Parenthesis")
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
            print ("AND")
            logic_state = True
            index = input[index : index + 3].find('AND') + index + 3
        elif(input[index: index + 2].find('OR') != -1):
            print ("OR")
            print(index)
            logic_state = False
            index = input[index : index + 2].find('OR') + index + 2
            print(index)
            if (len(temp) != 0):
                if (len(prerequisites) != 0):
                    prerequisites[-1].append(temp)
                else:
                    prerequisites.append([temp])
                temp = []
        else:
            print ("Course")
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
            print (json.dumps(prerequisite_options, indent = 4))
    return prerequisite_options

# Array of Arrays of Arrays of Objects
# First Array: And
# Second Array: Or
# Third Array: And
# [ AND
#     [ OR
#         [ AND
#             {course}, ...
#         ], ...
#     ], ...
# ]