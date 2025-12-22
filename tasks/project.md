You are a senior software engineer tasked with creating a registration form for the BTTH scholarship exam. The landing page should be based on the design from this website: https://btth-scholarship-exam-in1xzs5.gamma.site/#

The form should have the following fields:

1. Name of the student
2. Current Class - 8th, 9th or 10th
3. School Name
4. Parent's mobile number
5. Preferred exam date - 11th Jan 2026 | 18th Jan 2026
6. How you came across BTTH? - Digital Ad (Instagram, Whatsapp, Fb) | School Recommendation | Print Ad (Leaflet) | From parent of existing BT student | Walk in Enquiry | Other (Please Specify) _______
7. Payment integration - Razorpay or PhonePe


After all the information is filled in, the data should be saved in cloud storage - mongodb - In draft state also.

After successful registration, the user's filled info should be saved in the cloud storage, and these need to be displayed in a page. Which will have all the registrations. 

This page should also have filters and sorting option in the table columns.

Make a single axios instance and use it throughout the app.

The registrations page should be secured. Only admins can access it. 