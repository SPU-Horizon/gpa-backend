DROP SCHEMA IF EXISTS gpa;

CREATE SCHEMA IF NOT EXISTS gpa;

USE gpa;

CREATE TABLE IF NOT EXISTS counselor (
counselor_id TINYINT UNSIGNED AUTO_INCREMENT,
full_name VARCHAR(70) NOT NULL,
email VARCHAR(254) NOT NULL,
phone VARCHAR(15) NOT NULL,
avatar TEXT,
PRIMARY KEY(counselor_id)
);

CREATE TABLE IF NOT EXISTS student (
student_id SMALLINT UNSIGNED AUTO_INCREMENT,
first_name VARCHAR(35) NOT NULL,
last_name VARCHAR(35) NOT NULL,
email VARCHAR(254) NOT NULL UNIQUE,
avatar TEXT,
counselor_id TINYINT UNSIGNED,
enrollment_year YEAR,
enrollment_quarter ENUM('autumn', 'winter', 'spring', 'summer'),
graduation_year YEAR,
graduation_quarter ENUM('autumn', 'winter', 'spring', 'summer'),
PRIMARY KEY (student_id),
FOREIGN KEY (counselor_id) REFERENCES counselor (counselor_id) ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS student_field (
student_id SMALLINT UNSIGNED,
name VARCHAR(72),
type ENUM('major', 'minor', 'program'),
year YEAR,
quarter ENUM('autumn', 'winter', 'spring', 'summer'),
ud_credits TINYINT UNSIGNED,
total_credits TINYINT UNSIGNED,
requirements JSON,
PRIMARY KEY (student_id, name, type, year, quarter),
FOREIGN KEY (student_id) REFERENCES student (student_id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS course (
course_id VARCHAR(15),
name VARCHAR(72) NOT NULL,
description TEXT,
credits DECIMAL(2, 1),
attributes SET('UD', 'FLC', 'W', 'CUE', 'HON', 'WKA', 'WKH', 'WKQR', 'WKAS', 'WKFS', 'WKSS', 'WE'),
standing SET('freshman', 'sophomore', 'junior', 'senior'),
restrictions JSON,
prerequisites JSON,
corequisites JSON,
approval_required BOOL DEFAULT FALSE,
last_offered YEAR,
recurrence_year ENUM('yearly', 'biyearly', 'occasionally'),
recurrence_quarter SET('autumn', 'winter', 'spring', 'summer'),
recurrence_class JSON,
PRIMARY KEY (course_id)
);

CREATE TABLE IF NOT EXISTS section (
section_id SMALLINT UNSIGNED,
course_id VARCHAR(15) NOT NULL,
year YEAR,
quarter ENUM('autumn', 'winter', 'spring', 'summer'),
topic TINYTEXT,
classes JSON,
location TINYTEXT,
instructor TINYTEXT,
PRIMARY KEY (section_id, year, quarter),
FOREIGN KEY (course_id) REFERENCES course (course_id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS enrollment (
student_id SMALLINT UNSIGNED,
course_id VARCHAR(15),
year YEAR,
quarter ENUM('autumn', 'winter', 'spring', 'summer'),
grade DECIMAL(2, 1),
PRIMARY KEY (student_id, course_id, year, quarter),
FOREIGN KEY (student_id) REFERENCES student (student_id) ON DELETE CASCADE ON UPDATE CASCADE,
FOREIGN KEY (course_id) REFERENCES course (course_id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- CREATE TRIGGER course_recurrence
-- AFTER INSERT ON section
-- FOR EACH ROW
-- BEGIN
-- IF 
-- THEN 
-- ENDIF
-- END;