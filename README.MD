# The Graduation Planning App

> [!CAUTION]
> Do not share the contents of this repository with anyone. Doing so may expose private user data to unauthorized persons and violate federal FERPA regulations. Do not share your screen with non-members or engage in reckless acts that may cause the contents of this repository to be discovered.

## Set Up Local Environment

### Install Required Development Software

[Visual Studio Code](https://code.visualstudio.com/#alt-downloads)

[GitHub Desktop](https://desktop.github.com)

[MySQL Workbench](https://dev.mysql.com/downloads/workbench/)

### Install Required Production Software

[Node](https://nodejs.org/en/download/)

[MySQL Community Server](https://dev.mysql.com/downloads/mysql/)

Set the root password of the MySQL Community server as `QzbPjm34@WtV*yHNBDBy@MJMxNZ8CK_q`.

> [!IMPORTANT]
> If the root password of the MySQL Community server isn't set correctly, the application will not run and the password will need to be reset.

> [!NOTE]
> If you need to reset your MySQL server root password:
> 1. Open MySQL WorkBench and connect to the MySQL localhost instance.
> 2. Select "Administration" in the left pane.
> 3. Select "Users and Privileges".
> 4. Select "root" under "User Accounts".
> 5. Copy `QzbPjm34@WtV*yHNBDBy@MJMxNZ8CK_q` and paste into the "Password" and "Confirm Password" fields.
> 6. Select "Apply".

> [!WARNING]
> The MySQL server will continue running in the background until stopped.
> The server may cause significant drag on system performance if not stopped when not in use.

## Build the Application

1. Create a top-level *GPA* directory to store the source code of *gpa-frontend* and *gpa-backend*.
2. Clone the [gpa-backend](https://github.com/SPU-Horizon/gpa-backend) repository inside the *GPA* directory.
3. Clone the [gpa-frontend](https://github.com/SPU-Horizon/gpa-frontend) repository inside the *GPA* directory.
4. In the *gpa-frontend* directory, run the following terminal commands:
   - `npm ci`
   - `npm run build`
5. In the *gpa-backend* directory, run the following terminal commands:
   - `npm ci`
6. Open MySQL WorkBench and connect to the MySQL localhost instance.
7. Select "Open SQL Script" and select `gpa_schema.sql` from *.../GPA/gpa-backend*.
8. Select "Run SQL Script".
9. Select "Open SQL Script" and select `gpa_data.sql` from *.../GPA/gpa-backend*.
10. Select "Run SQL Script".

## Run the Application

1. Ensure that the MySQL server is running.
2. In the *gpa-backend* directory, run the terminal command `node index`.
3. In the *gpa-frontend* directory, run the terminal command `npm run dev`.
4. You’re all done! You should be able to see the site locally using the link shown in the Terminal.

> [!IMPORTANT]
> Remember to stop the terminal process and MySQL server when you have finished running the application. Otherwise, system resources may be constrained.

[GPA on AWS](https://main.dnqrtybjo5tlc.amplifyapp.com)
