USE gpa;

INSERT INTO counselor (counselor_id, name, email, phone) VALUES
(1, "Alison Howard", "howara@spu.edu", "206-281-2542"),
(2, "Jazmyne Krienen", "krienenj@spu.edu", "206-281-2245"),
(3, "Emily Morris", "morrise3@spu.edu", "206-281-2578"),
(4, "Annette Rendahl", "arendahl@spu.edu", "206-281-2539"),
(5, "Marisa Vogel", "mvogel@spu.edu", "206-281-2840");

INSERT INTO course (
    course_id, 
    name, 
    description, 
    credits, 
    attributes, 
    standing, 
    restrictions, 
    prerequisites, 
    corequisites, 
    approval_required, 
    last_offered, 
    recurrence_year, 
    recurrence_quarter, 
    recurrence_class
) VALUES
("SPGE LWKA","Ways of Knowing in the Arts",NULL,NULL,"WKA",NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),
("SPGE LWKH","Ways of Knowing in the Humanities",NULL,NULL,"WKH",NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),
("SPGE LWKQR","Ways of Knowing in Quantitative Reasoning",NULL,NULL,"WKQR",NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),
("SPGE LWKS","Ways of Knowing in the Sciences",NULL,NULL,"WKFS",NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),
("SPGE LWKSS","Ways of Knowing in the Social Sciences",NULL,NULL,"WKSS",NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),
("SPGE LWE","Ways of Engaging",NULL,NULL,"WE",NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),
("SPGE LCUE","Cultural Understanding and Engagement",NULL,NULL,"CUE",NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),
("HIS LDEL","Independent Project",NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),
("MAT LDEL","Independent Project",NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL);
