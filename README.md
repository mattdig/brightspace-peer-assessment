# brightspace-peer-assessment
An updated version of the Brightspace Peer Assessment tool, originally made at the University of Huddersfield 

Original article: https://community.brightspace.com/s/article/Developer-Spotlight-Building-Peer-Assessment-within-Brightspace

Changes from the original:
* Grades are averages instead of totals
* Students can review and resubmit responses until the deadline
* Criteria can be out of any number from 1 to 100
* Target grade item can be any number from 1 to 100
* Course codes with spaces are supported
* Grades can be published to the gradebook without comments

To upload to Brightspace:

First, in PeerSetup.htm adjust the following settings as needed:
```
defaultmodule = "Assessment";

defaultinstructions = "Peer Assessment allows you to adjust the scores of your team members to reflect their contribution to the group. Each category can be graded from 0 to 100 points.\r\n\r\nStaff involved in the module will be able to see your ratings but your peers will only see them in an anonymous form.";

nameprefix = "";

studentroles = ["Learner", "Demo-Learner", "Guest"];
```

Zip the contents of this folder, without any hidden / git / macOS files. Modify as needed, this is for macOS.

From the working directory:
```
zip -r peerassessment.zip . -x ".*" -x "__MACOSX" -x "Thumbs.db" -x "documentation*" -x "README.md" -x "LICENSE"
```

Follow the more detailed installation instructions in documenation/Administrator Guide.docx

Provide documentation/Peer Assessment Instructor Guide.docx to the instructors
