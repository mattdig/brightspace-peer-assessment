//v1.0 2019-11-01
//v1.1 2019-11-08 Save to grade item
//v1.2 2019-12-18 Save gradebreakdown and comments to grade item
//v1.3 2020-01-20 Fix individual grade display
//v1.4 2020-01-28 Accessibility updates
//v1.5 2020-07-20 Introduce array of student roles


var alerticon = '<svg width="18" height="18" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" aria-labelledby="title"><title id="title" lang="en">Alert - This student already has a mark recorded for this grade item. Selecting this will overwrite the mark.</title><path fill="#494c4e" d="M17.79 15.11l-7-14a2 2 0 0 0-3.58 0l-7 14a1.975 1.975 0 0 0 .09 1.94A2 2 0 0 0 2 18h14a1.994 1.994 0 0 0 1.7-.95 1.967 1.967 0 0 0 .09-1.94zM9 16a1.5 1.5 0 1 1 1.5-1.5A1.5 1.5 0 0 1 9 16zm.98-4.806a1 1 0 0 1-1.96 0l-.99-5A1 1 0 0 1 8.01 5h1.983a1 1 0 0 1 .98 1.194z"/></svg>';

var doneicon = '<svg width="18" height="18" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" aria-labelledby="title"><title id="title" lang="en">Saved</title><path fill="#494c4e" d="M9 0a9 9 0 1 0 9 9 9 9 0 0 0-9-9zm4.49 6.924l-5.02 5.51a.983.983 0 0 1-1.442 0l-2.48-2.482a.983.983 0 0 1 .008-1.417 1.027 1.027 0 0 1 1.4.02L7.712 10.3l4.3-4.73a1.018 1.018 0 0 1 1.4-.075 1.006 1.006 0 0 1 .078 1.43z"/></svg>';

//get user role via API as we can't use replace strings here

roleurl = "/d2l/api/lp/1.22/enrollments/myenrollments/" + OrgUnitId + "/access";

var RoleName;
var mygroup;
var enrollments;
var classlistresponse;
var groupresponse;
var whoamiresponse;
var groupsize;
var userid;

let deadline = null;

if(typeof(criteriaMaxPoints) == 'undefined'){
    var criteriaMaxPoints = 100;
}
let gradeItemMaxPoints = 100;

getAssignment(assignment).then(assignmentObject => {

    let deadlineString = "No end date set";
    
    if(assignmentObject.Availability !== null && assignmentObject.Availability.EndDate !== null){
        deadline = new Date(assignmentObject.Availability.EndDate);
        deadlineString = deadline.getMonthName() + ' ' + deadline.getDate() + ', ' + deadline.getFullYear() + ' at ' + (deadline.getHours() > 12 ? deadline.getHours() - 12 : deadline.getHours()) + ':' + (deadline.getMinutes() < 10 ? '0' : '') + deadline.getMinutes() + ' ' + (deadline.getHours() > 12 ? 'PM' : 'AM');
    }

    $.ajax({
        method: "GET",
        url: roleurl,
        dataType: 'json',
        success: function (roleresponse) {
            RoleName = roleresponse.Access.ClasslistRoleName;
            //console.log(RoleName);


            if (studentroles.indexOf(RoleName) != -1) {

                //Student version

                //console.log("Student Role");



                //has the student already submitted?


                submissionsurl = "/d2l/api/le/1.36/" + OrgUnitId + "/dropbox/folders/" + assignment + "/submissions/";

                $.ajax({
                    method: "GET",
                    url: submissionsurl,
                    dataType: 'json',
                    error: function (existingsubmissions) {
                        $("#peeroutput").html("Sorry, there was a problem accessing this content. Please report this to your lecturer.");
                    },
                    success: function (existingsubmissions) {

                        //find my groupcategory

                        groupurl = "/d2l/api/lp/1.22/" + OrgUnitId + "/groupcategories/" + groupcategory + "/groups/";

                        $.ajax({
                            method: "GET",
                            url: groupurl,
                            dataType: 'json',
                            success: function (groupresponse_tmp) {
                                groupresponse = groupresponse_tmp;



                                //now use whoami to get the user's profile ID as we can't use the replace string in content

                                whoamiurl = "/d2l/api/lp/1.22/users/whoami";

                                $.ajax({
                                    method: "GET",
                                    url: whoamiurl,
                                    dataType: 'json',
                                    success: function (whoamiresponse_tmp) {
                                        whoamiresponse = whoamiresponse_tmp;

                                        //console.log(whoamiresponse);

                                        //console.log(groupresponse);
                                        userid = parseInt(whoamiresponse["Identifier"]);
                                        //console.log(userid);


                                        //loop through groupresponse, try to find the current user's ID in the enrollments

                                        mygroup = -1;
                                        mygroupscount = 0;
                                        for (g = 0; g < groupresponse.length; g++) {
                                            //console.log(groupresponse[g].Enrollments);

                                            //console.log("indexof :"+groupresponse[g].Enrollments.indexOf(userid));

                                            if (groupresponse[g].Enrollments.indexOf(userid) != -1) {

                                                mygroup = g;
                                                mygroupname = groupresponse[g].Name;
                                                mygroupscount++;

                                            } else {
                                                //	console.log("no match");

                                            }

                                        } //end for g


                                        if (mygroupscount == 0) {
                                            $("#peeroutput").html("You have not been allocated to a group. Please contact your lecturer");

                                        }

                                        if (mygroupscount > 1) {
                                            $("#peeroutput").html("You have been allocated to more than one group. Please contact your lecturer.");

                                        }

                                        if (mygroupscount == 1) {

                                            enrollments = groupresponse[mygroup].Enrollments;


                                            //console.log(enrollments.length);
                                            if (selfassess) {

                                                groupsize = enrollments.length;
                                            } else {

                                                groupsize = enrollments.length - 1;
                                            }

                                            //get the classlist

                                            classlisturl = "/d2l/api/bas/1.1/orgunits/" + OrgUnitId + "/classlist/";

                                            getClasslist(classlisturl).then(classlistresponse_tmp => {

                                                let studentratings = false;
                                                
                                                if(existingsubmissions.length > 0){

                                                    studentratings = [];
                                                
                                                    let comment = existingsubmissions[0].Submissions[existingsubmissions[0].Submissions.length - 1].Comment.Text;

                                                    for (rating of comment.split("$")) {

                                                        let ratingdetail = rating.split("^");

                                                        let q_id = ratingdetail[0].split('-');
                                                        let q = q_id[0];
                                                        let student = q_id[1];

                                                        if (!(student in studentratings)) {
                                                            studentratings[student] = {};
                                                            studentratings[student]['totalmarks'] = 0;
                                                            studentratings[student]['totalratings'] = 0;
                                                        }
                                                        
                                                        if (q.substring(0, 1) == "q") {

                                                            q = q.substring(1);

                                                            studentratings[student][q] = parseFloat(ratingdetail[1]);
                                                            
                                                            studentratings[student]['totalmarks'] += parseFloat(ratingdetail[1]);
                                                            studentratings[student]['totalratings']++;
                                                            
                                                        } else if(q.substring(0, 1) == "C") {
                                                            studentratings[student]['comment'] = ratingdetail[1];
                                                        }

                                                    } //end for r
                                                }

                                                classlistresponse = classlistresponse_tmp.Objects;

                                                $("#peeroutput").html("<h2>" + mygroupname + "</h2>");

                                                $("#peeroutput").append('<p class="header-three">Last day to submit your responses: ' + deadlineString + '</p>');

                                                if(studentratings){
                                                    $("#peeroutput").append("<p>You have already submitted your response to this peer assessment activity. You may review or change your responses.</p>");
                                                }

                                                $("#peeroutput").append('<p class="header-four">Ratings are all out of ' + criteriaMaxPoints + '.</p>');

                                                $("#peeroutput").append("<div id=\"instructions\"></div><form id=\"studentform\"><table class=\"table table-responsive\" ><thead><tr id=\"theadrow\"><th>Student</th></tr></thead><tbody id=\"scoretablebody\"></tbody><!--tfoot><tr id=\"totalrow\"><td colspan=\"\">Points Awarded:</td></td></tfoot--></table>");

                                                questionstxt = "";

                                                for (q = 1; q < questions.length; q++) {
                                                    $("#theadrow").append("<th>" + questions[q] + "</th>");
                                                    //$("#totalrow").append("<td><span id=\"total-" + q + "\">" + (groupsize * 100) + "</span></td>");
                                                }

                                                $("#theadrow").append("<th>Average</th>");
                                                //$("#totalrow").append("<td>&nbsp</td>");


                                                $("#peeroutput").append("");


                                                $("#instructions").html(instructions);



                                                //loop through groupresponse[mygroup].Enrollments - the members of the current user's group - and display the voting grid


                                                for (e = 0; e < enrollments.length; e++) {

                                                    //console.log(enrollments[e]);

                                                    //find this user's name from classlistreponse

                                                    for (l = 0; l < classlistresponse.length; l++) {


                                                        if (classlistresponse[l].UserId == enrollments[e]) {
                                                            enrollments[e] = classlistresponse[l];
                                                            enrollments[e].Total = 0;

                                                            $("#scoretablebody").append("<tr id=\"row-" + classlistresponse[l].UserId + "\" class=\"row-student\" rowspan=\"2\" data-studentid=\"" + classlistresponse[l].UserId + "\"><th>" + classlistresponse[l].DisplayName + "</th></tr>");


                                                            if (classlistresponse[l].UserId != userid || (classlistresponse[l].UserId == userid && selfassess == true)) {

                                                                for (q = 1; q < questions.length; q++) {

                                                                    let value = (studentratings !== false && classlistresponse[l].UserId in studentratings ? studentratings[classlistresponse[l].UserId][q] : criteriaMaxPoints);
                                                                    $("#row-" + classlistresponse[l].UserId).append("<td><input type=\"text\" id=\"q" + q + "-" + classlistresponse[l].UserId + "\" value=\"" + value + "\" size=\"4\" maxlength=\"" + (criteriaMaxPoints >= 10 ? '5' : '4') + "\" class=\"q" + q + " ratingfield\" onchange=\"validate()\" aria-label=\"Score for student:" + classlistresponse[l].DisplayName + " ,for category: " + questions[q] + "\"/></td>");

                                                                }

                                                                let average = (studentratings !== false && classlistresponse[l].UserId in studentratings ? (studentratings[classlistresponse[l].UserId]['totalmarks'] / studentratings[classlistresponse[l].UserId]['totalratings']).toFixed(2) : criteriaMaxPoints);
                                                                $("#row-" + classlistresponse[l].UserId).append("<td><span id=\"average-" + classlistresponse[l].UserId + "\">" + average + "</span></td>");

                                                                if (commentfields == true) {
                                                                    let comment = (studentratings !== false && classlistresponse[l].UserId in studentratings ? studentratings[classlistresponse[l].UserId]['comment'] : '');
                                                                    $("#scoretablebody").append("<tr><td colspan=\"" + (questions.length + 1) + "\">Briefly explain your mark for " + classlistresponse[l].FirstName + "<br /><input type=\"text\" size=\"100%\" class=\"studentcomment\" id=\"Comment-" + classlistresponse[l].UserId + "\"  aria-label=\"Briefly explain your mark for " + classlistresponse[l].DisplayName + "\" value=\"" + comment + "\"></td></tr>");
                                                                }

                                                            } else {
                                                                //self assess turned off
                                                                $("#row-" + classlistresponse[l].UserId).append("<td colspan=\"" + (questions.length + 1) + "\">You are not able to rate your own contribution</td>");
                                                            }

                                                        } //end if



                                                    } //end for l




                                                } //end for e



                                                //submit button
                                                $("#peeroutput").append("<div id=\"buttoncontainer\"><div id=\"validationmsg\"></div><button class=\"btn-primary\" id=\"studentsubmitbutton\" onclick=\"studentsubmit()\">Submit Scores</button></div>");

                                            }); //end ajax classlist

                                        }//end if mygroups==1


                                    } //end success whoami
                                }); //end ajax whoami



                            } //end success grouplist
                        }); //end ajax grouplist


                        

                    } //end success existingsubmission
                }) //end ajax existingsubmission


            } else {
                //Staff version



                /////////////////////////////////////////////////////////////////////////////
                ////                                                                       //
                ////  STAFF VERSION                                                        //
                ////                                                                       //
                ////                                                                       //
                /////////////////////////////////////////////////////////////////////////////




                //console.log("Staff Role");


                //get the groups

                groupurl = "/d2l/api/lp/1.22/" + OrgUnitId + "/groupcategories/" + groupcategory + "/groups/";


                //check for duplicate enrolments

                all_enrollments = new Array();




                $.ajax({
                    method: "GET",
                    url: groupurl,
                    dataType: 'json',
                    error: function () {
                        $("#peeroutput").html("<p>Could not read group details</p>");
                    },
                    success: function (groupresponse_tmp) {
                        groupresponse = groupresponse_tmp;
                        //console.log("gr.l "+groupresponse.length);
                        if (groupresponse.length == 0) {
                            $("#peeroutput").html("The group category selected has no groups.");
                        } else {


                            for (g = 0; g < groupresponse.length; g++) {
                                all_enrollments = all_enrollments.concat(groupresponse[g].Enrollments);
                            }
                            all_enrollments.sort();
                            //console.log(all_enrollments);



                            dupe_errors = 0;
                            prevstudent = all_enrollments[0];
                            for (g = 1; g < all_enrollments.length; g++) {
                                if (all_enrollments[g] == prevstudent) {
                                    dupe_errors++;
                                    //console.log(dupe_errors);
                                }
                                prevstudent = all_enrollments[g]
                            }

                            if (dupe_errors > 0) {
                                $("#peeroutput").html("<p>Could not proceed. Please check that no student is enrolled in more than one group.</p>");

                            } else {

                                //set up the basic table

                                $("#peeroutput").html("<p class=\"well\">The Student view of this screen allows them to register their Peer Assessment. This view shows you the feedback provided.</p>");

                                $("#peeroutput").append('<p class="header-three">Last day for students to submit their responses: ' + deadlineString + '</p>');


                                $("#peeroutput").append("<div style=\"width:100%;overflow-x:scroll\"><table id=\"outputtable\" class=\"display compact cell-border\" style=\"width:100%\"><thead id=\"outputtablehead\" ><tr id=\"headrow\"><!--<th>Group ID</th>--><th>Group Name</th><!--<th>Student Internal ID</th>--><th>Student Name</th><th>Org Defined ID</th><th>Peer Assessment submitted?</th><th>Ratings Received</th></thead><tbody id=\"outputtablebody\"></tbody></table></div><div id=\"exportbuttonplaceholder\"></div><div id=\"staffnotes\"></div><h3>Individual responses</h3><div style=\"width:100%;overflow-x:scroll\"><table class=\"display compact cell-border\" id=\"votestable\"><thead id=\"votestablehead\"><tr id=\"votesheadrow\"><th>Voter Name</th><th>Vote Recipient</th></tr></thead><tbody id=\"votestablebody\"></tbody></table></div>");




                                for (q = 1; q < questions.length; q++) {

                                    $("#headrow").append("<th style=\"display:none\">" + questions[q] + "</th>");
                                    $("#headrow").append("<th>" + questions[q] + " (avg / " + criteriaMaxPoints + ")</th>");

                                    $("#votesheadrow").append("<th>" + questions[q] + "</th>");

                                }




                                if (commentfields == true) {
                                    $("#votesheadrow").append("<th>Comments</th><th>&nbsp;</th>");
                                }



                                $("#headrow").append("<th>Average peer score</th>");


                                for (g = 0; g < groupresponse.length; g++) {


                                    for (e = 0; e < groupresponse[g].Enrollments.length; e++) {

                                        $("#outputtablebody").append("<tr id=\"row-" + groupresponse[g].Enrollments[e] + "\"><!--<td>" + groupresponse[g]["GroupId"] + "</td>--><td>" + groupresponse[g]["Name"] + "</td><!--<td>" + groupresponse[g].Enrollments[e] + "</td>--><td><span id=\"name-" + groupresponse[g].Enrollments[e] + "\"></span></td><td><span id=\"orgdefinedid-" + groupresponse[g].Enrollments[e] + "\"></span><td><span id=\"voted-" + groupresponse[g].Enrollments[e] + "\"></span></td><td><span id=\"ratings-" + groupresponse[g].Enrollments[e] + "\">0</span></td></tr>");

                                        for (q = 1; q < questions.length; q++) {

                                            $("#row-" + groupresponse[g].Enrollments[e]).append("<td style=\"display:none\"><span id=\"q" + q + "-" + groupresponse[g].Enrollments[e] + "\" >0</span></td>");

                                            $("#row-" + groupresponse[g].Enrollments[e]).append("<td><span id=\"pq" + q + "-" + groupresponse[g].Enrollments[e] + "\">0</span></td>");

                                        }

                                        //default average column to defulatgrade if no votes received
                                        $("#row-" + groupresponse[g].Enrollments[e]).append("<td><span id=\"average-" + groupresponse[g].Enrollments[e] + "\">0</span></td>");

                                    } //end for e



                                } //end for g



                                //get the classlist

                                classlisturl = "/d2l/api/le/1.35/" + OrgUnitId + "/classlist/";


                                $.ajax({
                                    method: "GET",
                                    url: classlisturl,
                                    dataType: 'json',
                                    success: function (classlistresponse_tmp) {
                                        classlistresponse = classlistresponse_tmp;



                                        for (l = 0; l < classlistresponse.length; l++) {

                                            $("#name-" + classlistresponse[l].Identifier).html(classlistresponse[l].DisplayName);
                                            $("#orgdefinedid-" + classlistresponse[l].Identifier).html(classlistresponse[l].OrgDefinedId);


                                        } //end for l




                                        //get the assignment response and fill in the blanks


                                        assignmentgeturl = "/d2l/api/le/1.36/" + OrgUnitId + "/dropbox/folders/" + assignment + "/submissions/";

                                        $.ajax({
                                            method: "GET",
                                            url: assignmentgeturl,
                                            dataType: 'json',
                                            success: function (submissions) {


                                                prevstudent = 0;

                                                for (s = 0; s < submissions.length; s++) {
                                                    //console.log(submissions[s]);
                                                    $("#voted-" + submissions[s].Entity.EntityId).html("Y");


                                                    //get the most recent submission from this student

                                                    comment = "";
                                                    comment = submissions[s].Submissions[submissions[s].Submissions.length - 1].Comment.Text;
                                                    //console.log(comment);


                                                    //do some santity checking on comment

                                                    validationerrors = 0;
                                                    validationmsg = "";

                                                    if ((((comment.match(/\^/g) || []).length)) != (((comment.match(/\$/g) || []).length))) {

                                                        validationerrors++;
                                                        validationmsg = validationmsg = "<p>Ratings from student " + submissions[s].Entity.DisplayName + " rejected: invalid format</p>";
                                                    }


                                                    //split comment at $ characters to separate each student ratings-


                                                    // always use length-1 due to trailing $ - last element of array is empty


                                                    studentratings = comment.split("$");

                                                    if (validationerrors > 0) {

                                                        $("#staffnotes").append(validationmsg);

                                                    } else {

                                                        //no validation issue


                                                        for (r = 0; r < studentratings.length - 1; r++) {

                                                            //split each rating at the comma

                                                            ratingdetail = studentratings[r].split("^");

                                                            //console.log(ratingdetail);

                                                            //get existing value in field

                                                            existing = parseFloat($("#" + ratingdetail[0]).text());

                                                            //add this rating and update
                                                            existing += parseFloat(ratingdetail[1]);

                                                            $("#" + ratingdetail[0]).text(existing.toFixed(2));
                                                            

                                                            //split it again at the - to get the student ID

                                                            tmpsplit = ratingdetail[0].split("-");

                                                            if (tmpsplit[1] != prevstudent) {


                                                                existingratings = parseInt($("#ratings-" + tmpsplit[1]).text());
                                                                $("#ratings-" + tmpsplit[1]).text(existingratings + 1);

                                                                existingratings++
                                                            }



                                                            //responses table
                                                            //is there a table row for for the current voter (submissions[s].Entity.EntityId) and student (tmpsplit[1])?


                                                            if (document.getElementById("responserow-" + submissions[s].Entity.EntityId + "-" + tmpsplit[1])) {
                                                                //console.log("exists");
                                                            } else {


                                                                votername = getstudentname(submissions[s].Entity.EntityId);
                                                                recipientname = getstudentname(tmpsplit[1]);


                                                                $("#votestablebody").append("<tr id=\"responserow-" + submissions[s].Entity.EntityId + "-" + tmpsplit[1] + "\"><td>" + votername + "</td><td>" + recipientname + "</td></tr>");


                                                                for (q = 1; q < questions.length; q++) {
                                                                    $("#responserow-" + submissions[s].Entity.EntityId + "-" + tmpsplit[1]).append("<td><span id=\"response-" + submissions[s].Entity.EntityId + "-" + tmpsplit[1] + "-q" + q + "\" ></span></td>");


                                                                } //end for q

                                                                if (commentfields == true) {
                                                                    //	$("#responserow-" + submissions[s].Entity.EntityId + "-" + tmpsplit[1]).append("<td><textarea style=\"width:100%\" id=\"response-" + submissions[s].Entity.EntityId + "-" + tmpsplit[1] + "-Comment" + "\" class=\"response-recipient-"+tmpsplit[1]+" commentbox\" aria-label=\"Comment from "+ votername +" about "+ recipientname +"\" disabled></textarea></td>");

                                                                    $("#responserow-" + submissions[s].Entity.EntityId + "-" + tmpsplit[1]).append("<td id=\"response-" + submissions[s].Entity.EntityId + "-" + tmpsplit[1] + "-Comment" + "\"  class=\"response-recipient-" + tmpsplit[1] + " commentbox\"></td><td><input type=\"button\" class=\"editbutton\" style=\"display:none\" onclick='editcomment(\"response-" + submissions[s].Entity.EntityId + "-" + tmpsplit[1] + "-Comment" + "\")' value=\"Edit Comment\" /></td>");





                                                                }





                                                            }


                                                            //update the score row

                                                            if (tmpsplit[0] == "Comment") {

                                                                $("#response-" + submissions[s].Entity.EntityId + "-" + tmpsplit[1] + "-" + tmpsplit[0]).html(ratingdetail[1]);
                                                            } else {
                                                                $("#response-" + submissions[s].Entity.EntityId + "-" + tmpsplit[1] + "-" + tmpsplit[0]).html(ratingdetail[1]);


                                                            }

                                                            //resize the textarea
                                                            $("#response-" + submissions[s].Entity.EntityId + "-" + tmpsplit[1] + "-" + tmpsplit[0]).height($("#response-" + submissions[s].Entity.EntityId + "-" + tmpsplit[1] + "-" + tmpsplit[0])[0].scrollHeight);



                                                            //$("#votestablebody").append(baseresponse+"<td>"+getstudentname(tmpsplit[1])+"</td><td>"+tmpsplit[0]+"</td><td>"+ratingdetail[1]+"</td>");





                                                            //work out percentage

                                                            if (existingratings > 0) {
                                                                pcscore = parseFloat(existing / existingratings).toFixed(2);
                                                                $("#p" + ratingdetail[0]).text(pcscore);


                                                            }
                                                            prevstudent = tmpsplit[1]



                                                            //update total score
                                                            let newtotal = 0;

                                                            for (q = 1; q < questions.length; q++) {
                                                                //console.log(tmpsplit[1]);

                                                                newtotal = newtotal + parseFloat($("#q" + q + "-" + tmpsplit[1]).text());
                                                                //console.log(newtotal);
                                                            } //end for q


                                                            //console.log(newtotal + "/" + existingratings + "/" + questions.length);

                                                            let averageScore = ((newtotal / existingratings) / (questions.length - 1)).toFixed(2);

                                                            $("#average-" + tmpsplit[1]).text(averageScore);

                                                        } //end for r


                                                    } //end validation errors

                                                } //end for s


                                                enabledownload();
                                                enableexport();


                                            } //success submissions
                                        }) //end ajax submissions										




                                    } //end success classlist
                                }) //end ajax classlist


                            } //end if dupe_errors

                        } //end if groupresponse length >0

                    } // end success groupresponse
                }) //end ajax grupresponse


            } //end else {{rolename}}




        } //end success rolename
    }) //end ajax rolename
}); //end getAssignment


function getstudentname(id) {
    for (l = 0; l < classlistresponse.length; l++) {

        if (classlistresponse[l].Identifier == id || classlistresponse[l].UserId == id) {
            return (classlistresponse[l].DisplayName);
        } //end if

    } //end for l
} //end function



function enableexport() {

    //check that the grade item is valid

    if (typeof GradeItemId === 'undefined' || GradeItemId === null) {
        $("#peeroutput").append("<p>Export to grade item unavailable. Grade item not specified.</p>");
    } else {

        // check if the grade item exists

        let gradeItemUrl = "/d2l/api/le/1.37/" + OrgUnitId + "/grades/" + GradeItemId;

        $.ajax({
            method: "GET",
            url: gradeItemUrl,
            dataType: 'json',
            error: function (gradeItem) {
                $("#peeroutput").append("<p>Export to grade item unavailable. Grade item does not exist.</p>");
            },
            success: function (gradeItem) {

                gradeItemMaxPoints = gradeItem.MaxPoints;

                //get the scores for this grade object.

                let gradepullurl = "/d2l/api/le/1.37/" + OrgUnitId + "/grades/" + GradeItemId + "/values/?isGraded=true";

                $.ajax({
                    method: "GET",
                    url: gradepullurl,
                    dataType: 'json',
                    error: function (existinggrades) {
                        $("#peeroutput").append("<p>Export to grade item unavailable. Grade item does not exist.</p>");
                    },
                    success: function (existinggrades) {

                        //add checkboxes
                        $("#headrow").append("<th><input id=\"selectall\" type=\"checkbox\" onclick=\"selectall()\" aria-label=\"Select all for publishing\" /></th>");
                        //console.log("**");
                        //console.log(existinggrades);
                        for (g = 0; g < groupresponse.length; g++) {

                            for (e = 0; e < groupresponse[g].Enrollments.length; e++) {
                                $("#row-" + groupresponse[g].Enrollments[e]).append("<td><span id=\"checkboxwrapper-" + groupresponse[g].Enrollments[e] + "\" style=\"text-align:center\"><input id=\"checkbox-" + groupresponse[g].Enrollments[e] + "\" type=\"checkbox\" class=\"studentselect\" value=\"" + groupresponse[g].Enrollments[e] + "\" aria-labelledby=\"name-" + groupresponse[g].Enrollments[e] + "\"/>&nbsp;</span></td>");
                            } //end for e
                        } //end for g


                        //get existing grades, display warning if already populated
                        if (existinggrades.Objects) {



                            for (eg = 0; eg < existinggrades.Objects.length; eg++) {

                                $("#checkboxwrapper-" + existinggrades.Objects[eg].User.Identifier).append(alerticon);

                            }
                        }




                        $("#exportbuttonplaceholder").append("<h3>Publish marks to Gradebook</h3>");
                        $("#exportbuttonplaceholder").append("<p>Use the checkmarks in the table above to select which students' feedback you wish to publish to the Gradebook.</p>");



                        if (commentfields == true) {
                            $("#exportbuttonplaceholder").append("<p><input type=\"checkbox\" id=\"includecomments\" onchange=\"edittoggle()\"/> <label for=\"includecomments\">Include comments below?</label> Selecting this option will allow you to edit the version of the comment which is published to the student, however you will still see the unedited comment here.</p>");
                        }


                        $("#exportbuttonplaceholder").append("<p><input type=\"button\" value=\"Publish selected feedback to Gradebook\" onclick=\"savetogradebook()\"></p>");

                    } //end success existinggrades
                }); //end ajax existinggrades

            } //end success gradeItem
        }); //end ajax gradeItem
    } //end if
} //end enableexport function



function edittoggle() {

    commentenabled = document.getElementById("includecomments").checked;

    if (commentenabled) {

        $(".editbutton").show();

    } else {

        $(".editbutton").hide();

    }


}



function savetogradebook() {

    let now = new Date();

    if(now <= deadline){
        if(!confirm("The deadline for students to submit their responses has not yet passed. Are you sure you want to publish these grades to the Gradebook?")){
            return false;
        }
    }

    var token;

    $.ajax({
        method: "GET",
        url: "/d2l/lp/auth/xsrf-tokens",
        success: function (ltoken) {
            //console.log(ltoken);
            token = ltoken;


            let commentenabled = document.getElementById("includecomments") ? document.getElementById("includecomments").checked : false;

            let totalToSumbit = $(".studentselect:checked").length;
            let totalSubmitted = 0;

            $(".studentselect").each(function (index) {
                //console.log($("#" + this.id).prop("checked"));

                if ($("#" + this.id).prop("checked")) {


                    //console.log(this.value);

                    //console.log($("#total-" + this.value).text());

                    gradeputurl = "/d2l/api/le/1.32/" + OrgUnitId + "/grades/" + GradeItemId + "/values/" + this.value;
                    //console.log(gradeputurl);

                    commentstring = "";

                    commentstring = commentstring + "<table><thead><tr><th>Criteria</th><th>Average Score</th></tr></thead><tbody>\n";
                    for (q = 1; q < questions.length; q++) {

                        qscore = $("#pq" + q + "-" + this.value).text();

                        commentstring = commentstring + "<tr><td>" + questions[q] + "</td><td>" + qscore + "</td></tr>\n";


                    }

                    commentstring = commentstring + "</tbody></table>\n";
                    if (commentenabled == true) {
                        //get individual criteria scores

                        commentstring = commentstring + "<h4>Peer Comments</h4>\n";


                        //individualcomments
                        $.each($(".response-recipient-" + this.value), function (index, value) {
                            commentstring = commentstring + "<p>" + $(value).html() + "</p>";


                        });

                        //console.log(commentstring);
                    }


                    let gradePoints = parseFloat($("#average-" + this.value).text());

                    // convert to grade item max points
                    gradePoints = (gradePoints / criteriaMaxPoints * gradeItemMaxPoints).toFixed(2);

                    gradejson = '{"Comments": { "Content" : "' + commentstring + '","Type": "Html" },	"PrivateComments": { "Content" : "API value","Type": "Text"},"GradeObjectType": "1","PointsNumerator": ' + gradePoints + '}';
                    thisid = this.value;

                    ////console.log(gradejson);

                    $.ajax({
                        entityid: thisid,
                        type: "PUT",
                        beforeSend: function (request) {

                            request.setRequestHeader("X-Csrf-Token", token.referrerToken);
                        },
                        url: gradeputurl,
                        data: gradejson,
                        error: function (response) {
                            //console.log(response);
                            $("#checkboxwrapper-" + this.entityid).html("Failed to save");
                        },
                        success: function (response) {
                            //console.log(this);
                            $("#checkboxwrapper-" + this.entityid).html(doneicon);

                            totalSubmitted++;
                            if (totalSubmitted == totalToSumbit) {
                                setTimeout(function(){alert("All selected grades have been published to the Gradebook.");},200);
                            }

                        } //end success ajax PUT

                    }) //end ajax PUT




                } //end if checked


            }) //end each		



        } //end success token
    }) //end ajax token




} //end function savetogradebook




function selectall() {

    //check status of selectall

    if (document.getElementById('selectall').checked) {
        $('.studentselect').prop('checked', true);
    } else {
        $('.studentselect').prop('checked', false);

    }


} //end selectall		



function validate() {
    //console.log("changed");

    let validationerrors = 0;

    //disable the submit button
    $("#studentsubmitbutton").hide();

    //reset previous validation messages
    $("#validationmsg").html("");

    //set bgcolour to white

    $(".ratingfield").removeClass("rating_error");


    //loop through each question's fields

    // let rowTotals = [];

    $('.row-student').each(function (rowIndex, row) {
            
            let rowTotal = 0;
            let studentId = $(row).data('studentid');
            let average = true;
    
            $(row).find('.ratingfield').each(function (fieldIndex, field) {
    
                let floatVal = parseFloat($(field).val());

                if (floatVal < 0 || floatVal > criteriaMaxPoints) {

                    validationerrors++;

                    $(field).addClass("rating_error");
                    $("#validationmsg").html("You must enter a number for each student's score between 0 and " + criteriaMaxPoints + ".");

                    $('#average-' + studentId).html("N/A");
                    average = false;

                } else {

                    $(field).val(floatVal);

                    rowTotal += floatVal;
                    $(field).css("background-color", "FFFFFF");
                    
                }
    
            });

            if (average) {
                average = parseFloat((rowTotal / (questions.length - 1))).toFixed(2);
                $('#average-' + studentId).html(average);
            }

    });

    // for (q = 1; q < questions.length; q++) {

    //     //console.log("question" + q);

    //     $("#total-" + q).show();

    //     total = 0;

    //     $('.q' + q).each(function (i, elem) {

    //         let studentId = $(elem).attr("id").split("-")[1];
    //         if(rowTotals[studentId] == undefined) {
    //             rowTotals[studentId] = 0;
    //         }

    //         rowTotals[studentId] += parseInt($(elem).val());

    //         let intVal = parseInt($(elem).val());

    //         if (intVal != $(elem).val() || intVal < 0 || intVal > 100) {

    //             validationerrors++;

    //             $(elem).css("background-color", "#f098e5");
    //             $("#validationmsg").html("You must enter a number for each student's score between 0 and 100");

    //             $("#total-" + q).hide();

    //         } else {

    //             enrollments[i].Total += parseInt($(elem).val());

    //             total += parseInt($(elem).val());

    //             $("#total-" + q).html(total);

    //         } //end if

    //     }) //end each

    // } //end for q



    /* NOT THIS
    //do the total fields add up?

    targetscore = groupsize * 100;
    validationerrors = 0;


    for (q = 1; q < questions.length; q++) {

        //console.log("total q" + q + ":" + $("#total-" + q).html());

        if (parseInt($("#total-" + q).html()) != targetscore) {

            validationerrors++
            $(".q" + q).css("background-color", "#f098e5");
            $("#validationmsg").html("Your scores for each question must add up to " + targetscore);
        }

    } //end for q
    */


    if (validationerrors == 0) {
        
        $("#validationmsg").html("");
        $("#studentsubmitbutton").show();

        // rowTotals.forEach((total, index) => {
        //     $("#average-" + index).html((total / questions.length).toFixed(2));
        // });
    }

    //enable button after validation passed
    //$("#studentsubmitbutton").show();


} //end function validate




function enabledownload() {
    $('#outputtable').DataTable({
        "paging": false,
        "searching": false,
        dom: 'Bfrtip',
        buttons: [
            {
                extend: 'csv',
                text: 'Export for Excel',
                exportOptions: {
                    modifier: {
                        search: 'none'
                    }
                }
            }
        ]
    });





    $('#votestable').DataTable({
        "paging": false,
        "searching": false,
        dom: 'Bfrtip',
        buttons: [
            {
                extend: 'csv',
                text: 'Export for Excel',
                exportOptions: {
                    modifier: {
                        search: 'none'
                    }
                }
            }
        ]
    });







    //also enable upload

}






function ExportToGradeBook() {



}




function studentsubmit() {

    //delimiters: Newrow=$, tab=, section=|||||

    //loop through group members, loop through questions, add each question's score to csvstring		

    csvstring = "";

    //enrollments = groupresponse[mygroup].Enrollments;

    formelements = document.getElementById("studentform").elements;
    //console.log("***");

    //console.log(formelements);
    //console.log("***");

    commentstring = "";

    for (e = 0; e < formelements.length; e++) {

        //console.log(formelements[e]);

        elementid = formelements[e].id;

        elementvalue = $("#" + elementid).val();


        //console.log(elementid + " " + elementvalue);


        if (elementid.indexOf("Comment") == -1 && elementvalue.indexOf('.') > -1) {
            elementvalue = parseFloat(elementvalue).toFixed(2);
        }

        csvstring = csvstring + elementid + "^" + clean(elementvalue) + "$";


        //csvstring=csvstring+"|||||"+commentstring


    }//end for
    //console.log(csvstring);


    if (csvstring.length > 0) {

        var token;

        $.ajax({
            method: "GET",
            url: "/d2l/lp/auth/xsrf-tokens",
            success: function (ltoken) {
                //console.log(ltoken);
                token = ltoken;
                //submit csvstring to assignment

                dropboxurl = "/d2l/api/le/1.36/" + OrgUnitId + "/dropbox/folders/" + assignment + "/submissions/mysubmissions/";

                dropboxstr = '{"Text":"' + csvstring + '","Html":null}';




                var startAndEndDashes = '--';

                var boundary = 'xxBOUNDARYxx';

                var newLine = '\r\n';

                var jsonHeader = 'Content-Type: application/json';

                // change the values for each json attribute as desired (such as title or Url - aka filename);

                var jsonData = dropboxstr;

                // change the filename as desired

                var fileHeader = 'Content-Disposition: form-data; name="file"; filename="PeerAssessment.txt"\r\nContent-Type: text/plain';

                // change the file content as desired

                var fileContents = '';




                // construct the POST data

                var formdata = startAndEndDashes + boundary + newLine;

                formdata += jsonHeader + newLine + newLine;

                formdata += jsonData + newLine;

                formdata += startAndEndDashes + boundary + newLine;

                formdata += fileHeader + newLine + newLine;

                formdata += fileContents + newLine;

                formdata += startAndEndDashes + boundary + startAndEndDashes + newLine;




                // this function sends the request and then logs the response to the console
                //console.log(formdata);


                //console.log(formdata);



                $.ajax({
                    type: "POST",
                    beforeSend: function (request) {
                        request.setRequestHeader("Content-Type", "multipart/mixed; boundary=xxBOUNDARYxx");

                        request.setRequestHeader("X-Csrf-Token", token.referrerToken);
                    },
                    url: dropboxurl,
                    data: formdata,

                    success: function (response) {
                        //console.log(response);
                        $('#studentsubmitbutton').hide();
                        $("#validationmsg").html("<p>Thank you. Your responses have been received. You may review or modify your responses until the deadline.</p>");

                        setTimeout(function () {
                            $("#validationmsg").html("");
                            $('#studentsubmitbutton').show();
                        }, 5000);

                    },
                    error: function (response) {
                        //console.log(response);
                    },
                    complete: function (response) {
                        //console.log(response);
                    }


                    //end sucess
                }) //end ajax




            } //end success
        }) //end token ajax 



    } //end if length csvstring



} //end function studentsubmit

function getAssignment(assignmentId){

    let assignmentPromise = new Promise((resolve, reject) => {
        $.ajax({
            method: "GET",
            url: "/d2l/api/le/1.40/" + OrgUnitId + "/dropbox/folders/" + assignmentId,
            dataType: 'json',
            success: function (response) {
                resolve(response);
            },
            error: function (response) {
                reject(response);
            }
        });
    });

    return assignmentPromise;

}

function getClasslist(url){

    let d2lPos = url.indexOf('/d2l/');
    if(d2lPos > -1){
        url = url.substring(d2lPos);
    }

    // call the API to get the class list
    // continue calling until result.Next is null

    let classlist = {'Objects': [], 'Next' : url};

    let classlistPromise = new Promise((resolve, reject) => {
        let classlistLoop = function(){
            $.ajax({
                type: "GET",
                url: classlist.Next,
                success: function (response) {
                    classlist.Objects = classlist.Objects.concat(response.Objects);
                    if(response.Next !== null){
                        classlist.Next = response.Next;
                        d2lPos = classlist.Next.indexOf('/d2l/');
                        if(d2lPos > -1){
                            classlist.Next = classlist.Next.substring(d2lPos);
                        }

                        classlistLoop();
                    } else {
                        resolve(classlist);
                    }
                },
                error: function (response) {
                    reject(response);
                }
            });
        }
        classlistLoop();
    });

    return classlistPromise;

}

function editcomment(Id) {
    //hide edit buttons
    $(".editbutton").hide();

    Id = ("#" + Id);
    existingtext = $(Id).html();
    //console.log(Id);
    //console.log(existingtext);

    existingtext = $(Id).html("<textarea id=\"edit_textarea\">" + existingtext + "</textarea><br /><input type=\"button\" onclick=\"savecomment()\" value=\"Save\" />");


}


function savecomment() {
    $(".editbutton").show();

    newtext = $("#edit_textarea").val();
    console.log(newtext);
    $("#edit_textarea").parent().html(newtext);

}


function clean(input) {
    //console.log(input);
    //output=nl2br(input,true);

    output = input.replace(/"/g, '\\"');
    output = output.replace(/'/g, "\\'");

    output = output.replace("^", " ");
    output = output.replace("$", " ");

    //console.log(output);

    return output;
}

Date.prototype.getMonthName = function(lang) {
    lang = lang && (lang in Date.locale) ? lang : 'en';
    return Date.locale[lang].month_names[this.getMonth()];
};

Date.prototype.getMonthNameShort = function(lang) {
    lang = lang && (lang in Date.locale) ? lang : 'en';
    return Date.locale[lang].month_names_short[this.getMonth()];
};

Date.locale = {
    en: {
       month_names: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
       month_names_short: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    }
};