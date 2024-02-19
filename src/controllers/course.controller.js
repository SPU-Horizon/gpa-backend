import { getEnrollments } from '../../database.js';


//This will get all classes a student has taken, what year/quarter it was taken, and what grade was recieved
//It requires the student's email to be passed in the body of the request
export async function getClasses(req, res) {
    
    const enrollments = await getEnrollments(req.query.email)
    res.send(enrollments);
    return;
    
}

