# brightspace-peer-assessment
An updated version of the Brightspace Peer Assessment tool, originally made at the University of Huddersfield 

To upload to Brightspace:

In PeerSetup.htm:

Adjust the following settings as needed:

		defaultmodule = "Assessment";

		defaultinstructions = "Peer Assessment allows you to adjust the scores of your team members to reflect their contribution to the group. Everybody starts off with 100 points per category, but you can reallocate these marks to other team members. Each column must add up to 100 x the number of group members.\r\n\r\nStaff involved in the module will be able to see your ratings but your peers will only see them in an anonymous form.";

		nameprefix = "(EX) ";

		studentroles = ["Student", "ReadOnly"];

Zip the contents of this folder, without any hidden / git / macOS files. Modify as needed.
From the working directory:
zip -r peerassessment.zip . -x ".*" -x "__MACOSX" -x "Thumbs.db" -x "documentation*" -x "README.md" -x "LICENSE"

Follow the more detailed installation instructions in documenation/Administrator Guide.docx

Provide documentation/Peer Assessment Instructor Guide.docx to the instructors