// <Modules>
const express = require('express')
const fs = require('fs')
const jwt = require('jsonwebtoken')
const mongoose = require('mongoose')
var bodyParser = require('body-parser')
const hash = require('hash.js')
const path = require('path')
// </Modules>

// <Database>
var config = require('./config/database')
mongoose.connect(config.database)
// </Database>

// <MongooseModels>
var Syllabus = require('./Models/syllabusModel');
var Admin = require('./Models/AdminModel');
var Student = require('./Models/StudentModel');
// </Mongoose Models>

// <Initialzations>
var app = express();
var port = 8080;
app.use(express.static(path.join(__dirname+"/public"))) // Set A Public Folder
app.use(bodyParser.json())
app.use(express.urlencoded());
// </Initialization>

// <ServerConfig>
app.listen(port,()=>{
    console.log('\x1b[32m%s\x1b[1m', '[PE-Tests-Server] - Server Has Been Started On Port - '+port);  //cyan
})
// </ServerConfig>

//////////////////////////////////////// API CALLS ////////////////////////////////////////////////////////

app.get('/',(req,res)=>{
    res.sendFile(__dirname+'/public/Student/index.html')
})

// Verification Calls (Common to almost all APIS)
 
    // Verify If Token Exists 
    function verifyToken(req,res,next)
    {
    // Get The Auth Header value
    const bearerToken = req.headers['authorization'];
    // Check if bearer is undefined
    if(typeof(bearerToken)!== 'undefined')
    {
    console.log('\x1b[32m%s\x1b[1m',"[verifyToken] - Token Exists");

    // Get Token from array
    console.log('\x1b[32m%s\x1b[1m',"[verifyToken] - "+bearerToken) 
    req.token = bearerToken;
    req.data = req.body;
    next();
    }
    else
    {
    // Forbidden
    console.log('\x1b[31m%s\x1b[1m',"[verifyToken] - Token does not exist"); 
    res.json({is_verified:false});
    }
    }

    // Verify Admin Token
    app.get("/verifyAdmin",verifyToken ,(req,res)=>{
        console.log("[/verifyAdmin] - Verifying Admin")
        jwt.verify(req.token,'pe-tests-admin',(err,authData)=>{
            if(err){
                console.log('\x1b[31m%s\x1b[1m', '[/verifyAdmin] - Admin Verification Failed');  
                console.log(err);
                res.json({is_verified:false})
            }
            else
            {
                console.log('\x1b[32m%s\x1b[1m', '[/verifyAdmin] - Admin Verification Successful');  
                res.json({is_verified:true,admin:authData.admin})
            }
        })
    })

    app.get("/verifyStudent",verifyToken ,(req,res)=>{
        console.log("[/verifyStudent - Verifying Student")
        jwt.verify(req.token,'pe-tests-student',(err,authData)=>{
            if(err){
                console.log('\x1b[31m%s\x1b[1m', '[/verifyStudent] - Student Verification Failed');  
                console.log(err);
                res.json({is_verified:false})
            }
            else
            {
                console.log('\x1b[32m%s\x1b[1m', '[/verifyStudent] - Student Verification Successful');  
                res.json({is_verified:true,student:authData.student,is_successful:true})
            }
        })
    })


// Admin Related API Calls

        // Create Admin
        app.post('/createAdmin',verifyToken,(req,res)=>{
            jwt.verify(req.token,'pe-tests-admin',(err,authData)=>{
                if(err){
                    console.log('\x1b[31m%s\x1b[1m', '[/createAdmin] - Admin Verification Failed');  
                    console.log(err);
                    res.json({is_verified:false})
                }
                else
                {
                    console.log('\x1b[32m%s\x1b[1m', '[/createAdmin] - Admin Verification Successful');  
                    var hashed_password = hash.sha256().update(req.body.password).digest('hex')
                    console.log(req.body.adminID);
                    console.log(req.body.password);
                    var admin = new Admin({"adminID":req.body.adminID,"password":hashed_password})
                    console.log('\x1b[33m%s\x1b[1m', '[/createAdmin] - Creating an Admin...'); //yellow log
                    console.log(req.body);
                    admin.save((err,admin)=>{
                        if(err){
                            console.log('\x1b[31m%s\x1b[1m', '[/createAdmin] - Error Occured While Creating Admin');  //red log
                            console.log(err)
                            res.json({"is_verified":true,"is_successful":false});
                        }
                        else
                        {
                            console.log('\x1b[32m%s\x1b[1m', `[/createAdmin] - Admin ${admin.adminID} created successfully.'`); // green log
                            res.json({"is_verified":true,"is_successful":true});
        
                        }
                    })
                }
            })
           
            })
        ///////////////////////////////////

        
        // Admin Login
        app.post('/loginAdmin',(req,res)=>{
                var adminID = req.body.adminID;
                var password = hash.sha256().update(req.body.password).digest('hex')
                console.log('\x1b[33m%s\x1b[1m', '[/loginAdmin] - Verifying Admin...'); //yellow log
                Admin.findOne({$and:[{"adminID":adminID},{"password":password}]},(err,admin)=>{
                    if(err || !admin){
                        console.log('\x1b[31m%s\x1b[1m', '[/loginAdmin] - Admin Does not exist.');  //red log
                        console.log(err)
                        res.json({logged_in:false})
                    }
                    else{
                        console.log('\x1b[32m%s\x1b[1m',"[/loginAdmin - Admin Verified"); // green log
                        console.log('\x1b[33m%s\x1b[1m',"[/loginAdmin - Generating Token...."); // yellow log
                        jwt.sign({"admin":admin},"pe-tests-admin",(err,token)=>{
                            if(err){
                                console.log('\x1b[31m%s\x1b[1m',"[/loginAdmin] - Error Generating Admin Token:"); //red log
                                console.log(err)
                                res.json({logged_in:false})
                            }
                            else {
                                console.log('\x1b[32m%s\x1b[1m',"[/loginAdmin] - Admin Token Generated"); // green log
                                res.json({"admin_token":token,"admin":admin,logged_in:true});
                            }
                        })
                    }
                })
        })
        ///////////////////////////////////

        // Fetch Admins
        app.get('/getAdmins',verifyToken,(req,res)=>{
            jwt.verify(req.token,'pe-tests-admin',(err,authData)=>{
                if(err){
                    console.log('\x1b[31m%s\x1b[1m', '[/getAdmins] - Admin Verification Failed');  
                    console.log(err);
                    res.json({is_verified:false})
                }
                else
                {
                    console.log('\x1b[32m%s\x1b[1m', '[/getAdmins] - Admin Verification Successful');  
                    var admins = Admin.find({},(err,admins)=>{
                        if(err || !admins)
                        {
                            console.log('\x1b[31m%s\x1b[1m', '[/getAdmins] - Failed to get admins'); 
                            console.log(err); 
                            res.json({is_verified:true,is_successful:false})

                        }
                        else
                        {
                            console.log('\x1b[32m%s\x1b[1m', '[/getAdmins] - Admins Fetched Successful'); 
                            console.log(admins) 
                            res.json({is_verified:true,is_successful:true,admins:admins})
                        }
                    })
                }

        })
    })
    ///////////////////////////////////

    // Delete Admin
    app.post("/deleteAdmin",verifyToken,(req,res)=>{
        console.log(`REQUEST BODY`);
        jwt.verify(req.token,'pe-tests-admin',(err,authData)=>{
            if(err){
                console.log('\x1b[31m%s\x1b[1m', '[/deleteAdmin] - Admin Verification Failed');  
                console.log(err);
                res.json({is_verified:false})
            }
            else
            {
                console.log('\x1b[32m%s\x1b[1m', '[/deleteAdmin] - Admin Verification Successful');  
                Admin.findOneAndRemove({"adminID":req.body.adminID},(err,output)=>{
                    if(err)
                    {
                        console.log('\x1b[31m%s\x1b[1m', '[/deleteAdmin] - Failed To Delete Admin');  
                        console.log(err);
                        res.json({is_verified:true,is_successful:false})
                    }
                    else
                    {
                        console.log('\x1b[32m%s\x1b[1m', '[/deleteAdmin] - Admin Deleted Successfully');  
                        res.json({is_verified:true,is_successful:true})

                    }
                })
            
            }

    })
    })
    ///////////////////////////////////

    // Change Admin Password

    app.post("/changeAdminPassword",verifyToken,(req,res)=>{
        jwt.verify(req.token,'pe-tests-admin',(err,authData)=>{
            if(err){
                console.log('\x1b[31m%s\x1b[1m', '[/changeAdminPassword] - Admin Verification Failed');  
                console.log(err);
                res.json({is_verified:false})
            }
            else
            {
                console.log('\x1b[32m%s\x1b[1m', '[/changeAdminPassword] - Admin Verification Successful');  
                var new_password = hash.sha256().update(req.body.new_password).digest('hex');
                console.log('\x1b[33m%s\x1b[1m',"[/changeAdminPassword - Changing Password...."); // yellow log
                Admin.findOneAndUpdate({"adminID":req.body.adminID},{"$set":{"password":new_password}},(err,callback)=>{
                    if(err){
                        console.log('\x1b[31m%s\x1b[1m', "[/changeAdminPassword] - Failed to change password :'( ");
                        res.json({is_verified:true,is_successful:false})
                    }
                    else
                    {
                        console.log('\x1b[32m%s\x1b[1m', '[/changeAdminPassword] - Password Changed Successfully ^_^');  
                        res.json({is_verified:true,is_successful:true})
                    }
                })
            
            }

    })
    })

// Student Related API Calls

    // Create Student

    app.post('/createStudent',verifyToken,(req,res)=>
    {
        jwt.verify(req.token,'pe-tests-admin',(err,authData)=>{
            if(err){
                console.log('\x1b[31m%s\x1b[1m', '[/createStudent] - Admin Verification Failed');  
                console.log(err);
                res.json({is_verified:false})
            }
            else
            {
                console.log('\x1b[32m%s\x1b[1m', '[/createStudent] - Admin Verification Successful');  
                console.log('\x1b[33m%s\x1b[1m',"[/createStudent] - Creating Student...."); // yellow log
                console.log(req.body);
                var student = new Student({"studentID":req.body.studentID,"name":req.body.studentName,"password":hash.sha256().update(req.body.password).digest('hex'),"email":req.body.studentEmail,"contact":req.body.studentContact,"packs":req.body.packs});
                student.save((err,output)=>{
                    if(err)
                    {
                        console.log('\x1b[31m%s\x1b[1m', "[/createStudent] - Failed to create student :'( ");
                        console.log(err);
                        res.json({is_verified:true,is_successful:false})
                    }
                    else
                    {
                        console.log('\x1b[32m%s\x1b[1m', '[/createStudent] - Student created successfully');                  
                        res.json({is_verified:true,is_successful:true})
                    }
                })
            }

    })
    })

     // Student Login
     app.post('/loginStudent',(req,res)=>{
        var password = req.body.password;
        console.log(password);
        var hashed_password = hash.sha256().update(req.body.password).digest('hex');
        console.log('\x1b[33m%s\x1b[1m', '[/loginStudent] - Verifying Student...'); //yellow log
        Student.findOne({$and:[{"studentID":req.body.studentID},{"password": hashed_password}]},(err,student)=>{
            if(err || !student){
                console.log('\x1b[31m%s\x1b[1m', '[/loginStudent] - Student Does not exist.');  //red log
                console.log(err)
                res.json({logged_in:false})
            }
            else{
                console.log('\x1b[32m%s\x1b[1m',"[/loginStudent - Student Found"); // green log
                console.log('\x1b[33m%s\x1b[1m',"[/loginStudent - Generating Token...."); // yellow log
                jwt.sign({"student":student},"pe-tests-student",(err,token)=>{
                    if(err){
                        console.log('\x1b[31m%s\x1b[1m',"[/loginStudent] - Error Generating Student Token:"); //red log
                        console.log(err)
                        res.json({is_verified:true,is_successful:false})
                    }
                    else {
                        console.log('\x1b[32m%s\x1b[1m',"[/loginStudent] - Student Token Generated"); // green log
                        res.json({is_verified:true,"student_token":token,"student":student,is_successful:true});
                    }
                })
            }
        })
})

    // get Student Packs
    app.post("/getStudentPacks",verifyToken,(req,res)=>{
        jwt.verify(req.token,'pe-tests-admin',(err,authData)=>{
            if(err){
                console.log('\x1b[31m%s\x1b[1m', '[/getStudentPacks] - Admin Verification Failed');  
                console.log(err);
                res.json({is_verified:false})
            }
            else
            {
                console.log('\x1b[32m%s\x1b[1m', '[/getStudentPacks] - Admin Verification Successful');  
                var student = Student.find({"studentID":req.body.studentID},(err,student)=>{
                    if(err || !student)
                    {
                        console.log('\x1b[31m%s\x1b[1m', '[/getStudentPacks] - Failed to get Student'); 
                        console.log(err); 
                        res.json({is_verified:true,is_successful:false})

                    }
                    else
                    {
                        console.log('\x1b[32m%s\x1b[1m', '[/getStudentPacks] - Student Fetched'); 
                        console.log(student);
                        res.json({is_verified:true,is_successful:true,packs:student[0].packs})
                    }
                })
            }

    })})
    // get Students
    app.get("/getStudents",verifyToken,(req,res)=>{
        jwt.verify(req.token,'pe-tests-admin',(err,authData)=>{
            if(err){
                console.log('\x1b[31m%s\x1b[1m', '[/getStudents] - Admin Verification Failed');  
                console.log(err);
                res.json({is_verified:false})
            }
            else
            {
                console.log('\x1b[32m%s\x1b[1m', '[/getStudents] - Admin Verification Successful');  
                
                var students = Student.find({},(err,students)=>{
                    if(err || !students)
                    {
                        console.log('\x1b[31m%s\x1b[1m', '[/getStudents] - Failed to get Students'); 
                        console.log(err); 
                        res.json({is_verified:true,is_successful:false})

                    }
                    else
                    {
                        console.log('\x1b[32m%s\x1b[1m', '[/getStudents] - Students Fetched Successful'); 
                        console.log(students) 
                        res.json({is_verified:true,is_successful:true,students:students})
                    }
                })
            }

    })})

    // change student Password
    app.post("/changeStudentPassword",verifyToken,(req,res)=>{
        jwt.verify(req.token,'pe-tests-admin',(err,authData)=>{
            if(err){
                console.log('\x1b[31m%s\x1b[1m', '[/changeStudentPassword] - Admin Verification Failed');  
                console.log(err);
                res.json({is_verified:false})
            }
            else
            {
                console.log('\x1b[32m%s\x1b[1m', '[/changeStudentPassword] - Admin Verification Successful');  
                var new_password = hash.sha256().update(req.body.new_password).digest('hex');
                console.log('\x1b[33m%s\x1b[1m',"[/changeStudentPassword - Changing Password...."); // yellow log
                Student.findOneAndUpdate({"studentID":req.body.studentID},{"$set":{"password":new_password}},(err,callback)=>{
                    if(err){
                        console.log('\x1b[31m%s\x1b[1m', "[/changeStudentPassword] - Failed to change password :'( ");
                        res.json({is_verified:true,is_successful:false})
                    }
                    else
                    {
                        console.log('\x1b[32m%s\x1b[1m', '[/changeStudentPassword] - Password Changed Successfully ^_^');  
                        res.json({is_verified:true,is_successful:true})
                    }
                })
            
            }

    })
    })
    
    // Delete Student
    app.post("/addStudentPack",verifyToken,(req,res)=>{
        console.log(`REQUEST BODY`);
        jwt.verify(req.token,'pe-tests-admin',(err,authData)=>{
            if(err){
                console.log('\x1b[31m%s\x1b[1m', '[/addStudentPack] - Admin Verification Failed');  
                console.log(err);
                res.json({is_verified:false})
            }
            else
            {
                console.log('\x1b[32m%s\x1b[1m', '[/addStudentPack] - Admin Verification Successful');  
                Student.findOneAndUpdate({"studentID":req.body.studentID},{$addToSet:{"packs":req.body.pack}},(err,output)=>{
                    if(err)
                    {
                        console.log('\x1b[31m%s\x1b[1m', '[/addStudentPack] - Failed To add Pack');  
                        console.log(err);
                        res.json({is_verified:true,is_successful:false})
                    }
                    else
                    {
                        console.log('\x1b[32m%s\x1b[1m', '[/addStudentPack] - Pack Registered');  
                        res.json({is_verified:true,is_successful:true})

                    }
                })
            
            }

    })
    })

    // Add Student Pack
    app.post("/deleteStudent",verifyToken,(req,res)=>{
        console.log(`REQUEST BODY`);
        jwt.verify(req.token,'pe-tests-admin',(err,authData)=>{
            if(err){
                console.log('\x1b[31m%s\x1b[1m', '[/deleteStudent] - Admin Verification Failed');  
                console.log(err);
                res.json({is_verified:false})
            }
            else
            {
                console.log('\x1b[32m%s\x1b[1m', '[/deleteStudent] - Admin Verification Successful');  
                Student.findOneAndRemove({"studentID":req.body.studentID},(err,output)=>{
                    if(err)
                    {
                        console.log('\x1b[31m%s\x1b[1m', '[/deleteStudent] - Failed To Delete Student');  
                        console.log(err);
                        res.json({is_verified:true,is_successful:false})
                    }
                    else
                    {
                        console.log('\x1b[32m%s\x1b[1m', '[/deleteStudent] - Admin Student Successfully');  
                        res.json({is_verified:true,is_successful:true})

                    }
                })
            
            }

    })
    })

    // Change Student Email

    app.post("/changeStudentEmail",verifyToken,(req,res)=>{
        jwt.verify(req.token,'pe-tests-admin',(err,authData)=>{
            if(err){
                console.log('\x1b[31m%s\x1b[1m', '[/changeStudentEmail] - Admin Verification Failed');  
                console.log(err);
                res.json({is_verified:false})
            }
            else
            {
                console.log('\x1b[32m%s\x1b[1m', '[/changeStudentEmail] - Admin Verification Successful');  
                var new_email = req.body.new_email;
                console.log('\x1b[33m%s\x1b[1m',"[/changeStudentemail - Changing Email ID...."); // yellow log
                Student.findOneAndUpdate({"studentID":req.body.studentID},{"$set":{"email":new_email}},(err,callback)=>{
                    if(err){
                        console.log('\x1b[31m%s\x1b[1m', "[/changeStudentEmail] - Failed to change email :'( ");
                        res.json({is_verified:true,is_successful:false})
                    }
                    else
                    {
                        console.log('\x1b[32m%s\x1b[1m', '[/changeStudentEmail] - Email Changed Successfully ^_^');  
                        res.json({is_verified:true,is_successful:true})
                    }
                })
            
            }

    })
    })
    // Change Student Contact
    app.post("/changeStudentContact",verifyToken,(req,res)=>{
        jwt.verify(req.token,'pe-tests-admin',(err,authData)=>{
            if(err){
                console.log('\x1b[31m%s\x1b[1m', '[/changeStudentContact] - Admin Verification Failed');  
                console.log(err);
                res.json({is_verified:false})
            }
            else
            {
                console.log('\x1b[32m%s\x1b[1m', '[/changeStudentContact] - Admin Verification Successful');  
                var new_contact = req.body.new_contact;
                console.log('\x1b[33m%s\x1b[1m',"[/changeStudentContact - Changing Contact No...."); // yellow log
                Student.findOneAndUpdate({"studentID":req.body.studentID},{"$set":{"contact":new_contact}},(err,callback)=>{
                    if(err){
                        console.log('\x1b[31m%s\x1b[1m', "[/changeStudentContact] - Failed to change contact no :'( ");
                        res.json({is_verified:true,is_successful:false})
                    }
                    else
                    {
                        console.log('\x1b[32m%s\x1b[1m', '[/changeStudentContact] - Contact No.  Changed Successfully ^_^');  
                        res.json({is_verified:true,is_successful:true})
                    }
                })
            
            }
            
    })
    })


// Syllabus Related API Calls

    // Get Full Syllabus
        app.get("/getFullSyllabus",verifyToken,(req,res)=>{
            jwt.verify(req.token,'pe-tests-admin',(err,authData)=>{
                if(err){
                    console.log('\x1b[31m%s\x1b[1m', '[/getFullSyllabus] - Admin Verification Failed');  
                    console.log(err);
                    res.json({is_verified:false})
                }
                else
                {
                    console.log('\x1b[32m%s\x1b[1m', '[/getFullSyllabus] - Admin Verification Successful');  
                    console.log('\x1b[33m%s\x1b[1m', '[/getFullSyllabus] - Fetching full syllabus...');
                    Syllabus.syncIndexes();
                    Syllabus.find({},(err,syllabus)=>{
                        if(err || !syllabus){
                            console.log('\x1b[31m%s\x1b[1m', "[/getFullSyllabus] - Failed to fetch syllabus :'( ");
                            res.json({is_verified:true,is_successful:false})
                        }
                        else
                        {
                            console.log('\x1b[32m%s\x1b[1m', '[/getFullSyllabus] - Fetched Syllabus Successfully ^_^');  
                            console.log(syllabus);
                            res.json({is_verified:true,is_successful:true,syllabus:syllabus})
                        }
                    })
                
                }
                
        })
        })
    // Create Domain
    app.post("/createDomain",verifyToken,(req,res)=>{
        jwt.verify(req.token,'pe-tests-admin',(err,authData)=>{
            if(err){
                console.log('\x1b[31m%s\x1b[1m', '[/createDomain] - Admin Verification Failed');  
                console.log(err);
                res.json({is_verified:false}) 
            }
            else
            {
                console.log('\x1b[32m%s\x1b[1m', '[/createDomain] - Admin Verification Successful');  
                console.log('\x1b[33m%s\x1b[1m', '[/createDomain] - Creating new domain...');
                Syllabus.insertMany({"name":req.body.domain_name},(err,Domain)=>{
                    if(err || !Domain){
                        console.log('\x1b[31m%s\x1b[1m', "[/createDomain] - Failed to create domain :'( ");
                        console.log(err)
                        res.json({is_verified:true,is_successful:false})

                    }
                    else
                    {
                        console.log('\x1b[32m%s\x1b[1m', '[/createDomain] - Created Domain :) ');  
                        res.json({is_verified:true,is_successful:true,domain:Domain})

                    }
                })
            }
        })
    })
    // Delete Domain
    app.post("/deleteDomain",verifyToken,(req,res)=>{
        jwt.verify(req.token,'pe-tests-admin',(err,authData)=>{
            if(err){
                console.log('\x1b[31m%s\x1b[1m', '[/deleteDomain] - Admin Verification Failed');  
                console.log(err);
                res.json({is_verified:false}) 
            }
            else
            {
                console.log('\x1b[32m%s\x1b[1m', '[/deleteDomain] - Admin Verification Successful');  
                console.log('\x1b[33m%s\x1b[1m', '[/deleteDomain] - Deleting Domain...');
                Syllabus.findOneAndRemove({"name":req.body.domain_name},(err,Domain)=>{
                    if(err || !Domain){
                        console.log('\x1b[31m%s\x1b[1m', "[/deleteDomain] - Failed to delete Domain :'( ");
                        console.log(err)
                        res.json({is_verified:true,is_successful:false})
                    }
                    else
                    {
                        console.log('\x1b[32m%s\x1b[1m', '[/deleteDomain] - Domain Deleted Successfully :) ');  
                        res.json({is_verified:true,is_successful:true,domain:Domain})
                    }
                })
            }
        })
    })

    // Add Subject To a Domain
    app.post("/addSubjectToDomain",verifyToken,(req,res)=>{
        jwt.verify(req.token,'pe-tests-admin',(err,authData)=>{
            if(err){
                console.log('\x1b[31m%s\x1b[1m', '[/addSubjectToDomain] - Admin Verification Failed');  
                console.log(err);
                res.json({is_verified:false})
            }
            else
            {
                console.log('\x1b[32m%s\x1b[1m', '[/addSubjectToDomain] - Admin Verification Successful');  
                console.log('\x1b[33m%s\x1b[1m', '[/addSubjectToDomain] - Adding Subject to domain...');
                subject_name = req.body.subject_name;
                domain_id = req.body.domain_id;
                Syllabus.findByIdAndUpdate(domain_id,{$addToSet:{"Subjects":{"name":subject_name}}},(err,updatedDomain)=>{
                    if(err || !updatedDomain)
                    {
                        console.log('\x1b[31m%s\x1b[1m', "[/addSubjectToDomain] - Failed to add subject :'( ");
                        res.json({is_verified:true,is_successful:false})
                    }
                    else
                    {
                        console.log('\x1b[32m%s\x1b[1m', '[/addSubjectToDomain] - Added Subject Successfully ^_^');  
                        res.json({is_verified:true,is_successful:true,subject:subject_name})
                    }
                })            
            }
            
    })
    })

    // Delete Subject From Domain 
    app.post("/deleteSubjectFromDomain",verifyToken,(req,res)=>{
        jwt.verify(req.token,'pe-tests-admin',(err,authData)=>{
            if(err){
                console.log('\x1b[31m%s\x1b[1m', '[/deleteSubjectFromDomain] - Admin Verification Failed');  
                console.log(err);
                res.json({is_verified:false})
            }
            else
            {
                console.log('\x1b[32m%s\x1b[1m', '[/deleteSubjectFromDomain] - Admin Verification Successful');  
                console.log('\x1b[33m%s\x1b[1m', '[/deleteSubjectFromDomain] - Deleting Subject from domain...');
                subject_name = req.body.subject_name;
                domain_name = req.body.domain_name;
                Syllabus.findOneAndUpdate({$and:[{"name":domain_name},{"Subjects.name":subject_name}]},{$pull:{"Subjects":{"name":subject_name}}},(err,updatedDomain)=>{
                    if(err || !updatedDomain)
                    {
    
                        console.log('\x1b[31m%s\x1b[1m', "[/deleteSubjectFromDomain] - Failed to delete subject :'( ");
                        console.log(err);
                        res.json({is_verified:true,is_successful:false})
                    }
                    else
                    {
                        console.log('\x1b[32m%s\x1b[1m', '[/deleteSubjectFromDomain] - Deleted Subject Successfully ^_^');  
                        res.json({is_verified:true,is_successful:true})
                    }
                })            
            }
            
    })
    })

    // Add Chapter to Subject
    app.post("/addChapterToSubject",verifyToken,(req,res)=>{
        jwt.verify(req.token,'pe-tests-admin',(err,authData)=>{
            if(err){
                console.log('\x1b[31m%s\x1b[1m', '[/addChapterToSubject] - Admin Verification Failed');  
                console.log(err);
                res.json({is_verified:false})
            }
            else
            {
                console.log('\x1b[32m%s\x1b[1m', '[/addChapterToSubject] - Admin Verification Successful');  
                console.log('\x1b[33m%s\x1b[1m', '[/addChapterToSubject] - Adding chapter to subject...');
                subject_name = req.body.subject_name;
                domain_name = req.body.domain_name;
                chapter_name = req.body.chapter_name;
                Syllabus.findOneAndUpdate({$and:[{"name":domain_name},{"Subjects.name":subject_name}]},{$addToSet:{"Subjects.$.Chapters":{"name":chapter_name}}},(err,updatedDomain)=>{
                    if(err || !updatedDomain)
                    {
    
                        console.log('\x1b[31m%s\x1b[1m', "[/addChapterToSubject] - Failed to add chapter to subject :'( ");
                        console.log(err);
                        res.json({is_verified:true,is_successful:false})
                    }
                    else
                    {
                        console.log('\x1b[32m%s\x1b[1m', '[/addChapterToSubject] - added chapter to subject successfully ^_^');  
                        res.json({is_verified:true,is_successful:true})
                    }
                })            
            }
            
    })
    })

    // Delete Chapter From Subject 
    app.post("/deleteChapterFromSubject",verifyToken,(req,res)=>{
        jwt.verify(req.token,'pe-tests-admin',(err,authData)=>{
            if(err){
                console.log('\x1b[31m%s\x1b[1m', '[/deleteChapterFromSubject] - Admin Verification Failed');  
                console.log(err);
                res.json({is_verified:false})
            }
            else
            {
                console.log('\x1b[32m%s\x1b[1m', '[/deleteChapterFromSubject] - Admin Verification Successful');  
                console.log('\x1b[33m%s\x1b[1m', '[/deleteChapterFromSubject] - Deleting chapter to subject...');
                subject_name = req.body.subject_name;
                domain_name = req.body.domain_name;
                chapter_name = req.body.chapter_name;
                Syllabus.findOneAndUpdate({$and:[{"name":domain_name},{"Subjects.name":subject_name}]},{$pull:{"Subjects.$.Chapters":{"name":chapter_name}}},(err,updatedDomain)=>{
                    if(err || !updatedDomain)
                    {
    
                        console.log('\x1b[31m%s\x1b[1m', "[/deleteChapterFromSubject] - Failed to delete chapter from subject :'( ");
                        console.log(err);
                        res.json({is_verified:true,is_successful:false})
                    }
                    else
                    {
                        console.log('\x1b[32m%s\x1b[1m', '[/deleteChapterFromSubject] - deleted chapter from subject successfully ^_^');  
                        res.json({is_verified:true,is_successful:true})
                    }
                })            
            }
            
    })
    })
    

    // Add Section To Subject
    app.post("/addSectionToSubject",verifyToken,(req,res)=>{
        jwt.verify(req.token,'pe-tests-admin',(err,authData)=>{
            if(err){
                console.log('\x1b[31m%s\x1b[1m', '[/addSectionToSubject] - Admin Verification Failed');  
                console.log(err);
                res.json({is_verified:false})
            }
            else
            {
                console.log('\x1b[32m%s\x1b[1m', '[/addSectionToSubject] - Admin Verification Successful');  
                console.log('\x1b[33m%s\x1b[1m', '[/addSectionToSubject] - Adding chapter to subject...');
                subject_name = req.body.subject_name;
                domain_name = req.body.domain_name;
                section_name = req.body.section_name;
                Syllabus.findOneAndUpdate({$and:[{"name":domain_name},{"Subjects.name":subject_name}]},{$addToSet:{"Subjects.$.Sections":{"name":section_name}}},(err,updatedDomain)=>{
                    if(err || !updatedDomain)
                    {
    
                        console.log('\x1b[31m%s\x1b[1m', "[/addSectionToSubject] - Failed to add section to subject :'( ");
                        console.log(err);
                        res.json({is_verified:true,is_successful:false})
                    }
                    else
                    {
                        console.log('\x1b[32m%s\x1b[1m', '[/addSectionToSubject] - added section to subject successfully ^_^');  
                        res.json({is_verified:true,is_successful:true})
                    }
                })            
            }
            
    })
    })

    // Delete Section From Subject
    app.post("/deleteSectionFromSubject",verifyToken,(req,res)=>{
        jwt.verify(req.token,'pe-tests-admin',(err,authData)=>{
            if(err){
                console.log('\x1b[31m%s\x1b[1m', '[/deleteSectionFromSubject] - Admin Verification Failed');  
                console.log(err);
                res.json({is_verified:false})
            }
            else
            {
                console.log('\x1b[32m%s\x1b[1m', '[/deleteSectionFromSubject] - Admin Verification Successful');  
                console.log('\x1b[33m%s\x1b[1m', '[/deleteSectionFromSubject] - Deleting section from subject...');
                subject_name = req.body.subject_name;
                domain_name = req.body.domain_name;
                section_name = req.body.section_name;
                Syllabus.findOneAndUpdate({$and:[{"name":domain_name},{"Subjects.name":subject_name}]},{$pull:{"Subjects.$.Sections":{"name":section_name}}},(err,updatedDomain)=>{
                    if(err || !updatedDomain)
                    {
    
                        console.log('\x1b[31m%s\x1b[1m', "[/deleteSectionFromSubject] - Failed to delete section from subject :'( ");
                        console.log(err);
                        res.json({is_verified:true,is_successful:false})
                    }
                    else
                    {
                        console.log('\x1b[32m%s\x1b[1m', '[/deleteSectionFromSubject] - deleted section from subject successfully ^_^');  
                        res.json({is_verified:true,is_successful:true})
                    }
                })            
            }
    })
    })


    // Add Topic To Chapter
    app.post("/addTopicToChapter",verifyToken,(req,res)=>{
        jwt.verify(req.token,'pe-tests-admin',(err,authData)=>{
            if(err){
                console.log('\x1b[31m%s\x1b[1m', '[/addTopicToChapter] - Admin Verification Failed');  
                console.log(err);
                res.json({is_verified:false})
            }
            else
            {
                console.log('\x1b[32m%s\x1b[1m', '[/addTopicToChapter] - Admin Verification Successful');  
                console.log('\x1b[33m%s\x1b[1m', '[/addTopicToChapter] - Adding topic to chapter...');
                subject_name = req.body.subject_name;
                domain_name = req.body.domain_name;
                chapter_name = req.body.chapter_name;
                topic_name = req.body.topic_name;
                Syllabus.findOneAndUpdate({$and:[{"name":domain_name},{"Subjects.name":subject_name},{"Subjects.Chapters.name":chapter_name}]},{$addToSet:{"Subjects.$.Chapters.Topics":{"name":topic_name}}},(err,updatedDomain)=>{
                    if(err || !updatedDomain)
                    {
    
                        console.log('\x1b[31m%s\x1b[1m', "[/addTopicToChapter] - Failed to add topic to chapter :'( ");
                        console.log(err);
                        res.json({is_verified:true,is_successful:false})
                    }
                    else
                    {
                        console.log('\x1b[32m%s\x1b[1m', '[/addTopicToChapter] - added topic to chapter successfully ^_^');  
                        res.json({is_verified:true,is_successful:true})
                    }
                })            
            }
            
    })
    })
    