# brightspace-peer-assessment
An updated version of the Brightspace Peer Assessment tool, originally made at the University of Huddersfield 

To upload to Brightspace:

First, in PeerSetup.htm adjust the following settings as needed:
```
defaultmodule = "Assessment";

defaultinstructions = "Peer Assessment allows you to adjust the scores of your team members to reflect their contribution to the group. Each category can be graded from 0 to 100 points.\r\n\r\nStaff involved in the module will be able to see your ratings but your peers will only see them in an anonymous form.";

defaultgrade = 0;

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