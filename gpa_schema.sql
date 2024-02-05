CREATE SCHEMA IF NOT EXISTS gpa
ENCRYPTION = 'Y';

USE gpa;

CREATE TABLE IF NOT EXISTS student (
student_id MEDIUMINT UNSIGNED AUTO_INCREMENT,
first_name VARCHAR(35) NOT NULL,
last_name VARCHAR(35) NOT NULL,
email VARCHAR(254) NOT NULL,
avatar BLOB,
enrollment_year YEAR,
enrollment_quarter ENUM('autumn', 'winter', 'spring', 'summer'),
graduation_year YEAR,
graduation_quarter ENUM('autumn', 'winter', 'spring', 'summer'),
remaining_courses JSON,
PRIMARY KEY (student_id)
);

CREATE TABLE IF NOT EXISTS department (
department_id TINYINT UNSIGNED AUTO_INCREMENT,
name VARCHAR(127) NOT NULL,
PRIMARY KEY (department_id)
);

CREATE TABLE IF NOT EXISTS field (
field_id TINYINT UNSIGNED AUTO_INCREMENT,
name VARCHAR(72) NOT NULL,
department_id TINYINT UNSIGNED,
credits TINYINT UNSIGNED,
PRIMARY KEY (field_id),
FOREIGN KEY (department_id) REFERENCES department (department_id) ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS student_field (
student_id MEDIUMINT UNSIGNED,
field_id TINYINT UNSIGNED,
PRIMARY KEY (student_id, field_id),
FOREIGN KEY (student_id) REFERENCES student (student_id) ON DELETE CASCADE ON UPDATE CASCADE,
FOREIGN KEY (field_id) REFERENCES field (field_id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS course (
course_id VARCHAR(10),
name VARCHAR(72) NOT NULL,
description LONGTEXT,
credits DECIMAL(2, 1) UNSIGNED,
attributes SET('UD', 'FLC', 'W', 'CUE', 'HON', 'WKA', 'WKH', 'WKQR', 'WKAS', 'WKFS', 'WKSS', 'WE'),
standing SET('freshman', 'sophomore', 'junior', 'senior') NOT NULL,
restrictions TEXT, -- review
prerequisites JSON,
corequisites TEXT, -- review
approval_required BOOL,
last_offered YEAR,
recurrence_year ENUM('yearly', 'biyearly', 'occasionally'),
recurrence_quarter SET('autumn', 'winter', 'spring', 'summer'),
recurrence_class JSON,
PRIMARY KEY (course_id)
);

CREATE TABLE IF NOT EXISTS section (
section_id SMALLINT UNSIGNED,
course_id VARCHAR(10) NOT NULL,
year YEAR,
quarter ENUM('autumn', 'winter', 'spring', 'summer'),
topic TINYTEXT,
classes JSON,
location TINYTEXT,
instructor TEXT,
PRIMARY KEY (section_id, year, quarter),
FOREIGN KEY (course_id) REFERENCES course (course_id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS enrollment (
student_id MEDIUMINT UNSIGNED,
course_id VARCHAR(10),
year YEAR,
quarter ENUM('autumn', 'winter', 'spring', 'summer'),
grade DECIMAL(2, 1) UNSIGNED,
PRIMARY KEY (student_id, course_id, year, quarter),
FOREIGN KEY (student_id) REFERENCES student (student_id) ON DELETE CASCADE ON UPDATE CASCADE,
FOREIGN KEY (course_id) REFERENCES course (course_id) ON DELETE CASCADE ON UPDATE CASCADE
);

INSERT INTO field (field_id, name) VALUE (0, 'CUSTOM');
