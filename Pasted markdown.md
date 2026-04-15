# FindIt - Video Presentation Script

> **Important Video Guidelines to Follow:**
> - **Camera Presence:** The video MUST NOT be only PPT. You must present yourself on-screen for at least 20% of the overall duration.
> - **Visual Requirements (First & Last 15s):** You must VISUALLY display the Project Title, all Student Names, Enrolment Numbers, and University Name on your slides in the first 10-15 seconds and the last 10-15 seconds to fulfill the requirement, even though you will introduce yourselves at your own turns.
> - **Organisation Pride:** Ensure your behavior and the content reflect a sense of pride for the organization. Follow all public video posting guidelines.
> - **Deployment:** The video must be uploaded on a public link/portal/video streaming service.

---

### [0:00 - 0:15] INTRO: Mandatory Initial 15 Seconds
*(Visual of Slide 1 MUST remain on screen for the first 15 seconds showing all team members, enrolment numbers, and Bennett University).*

### Member 1 — Sparsh Kumar (Project Lead)
**(Slide 1 — Introduction & Slide 2 — Problem & Solution)**
> "Hello everyone, welcome to our presentation. The title of our project is **FindIt — A Smart Lost-and-Found Web Application**."
> "My name is **Sparsh Kumar**, and I served as the Project Lead for our team from **Bennett University**."
> "On any college campus, students frequently lose personal items. Right now, there is no centralized, real-time system that connects people who lose items with people who find them. That’s why we created FindIt. Our solution is a full-stack platform that uses a simple three-step workflow: **Report, Match, and Recover**."
> "To ensure the project's success, we adopted an agile methodology, breaking down the development into weekly sprints. This allowed us to iterate quickly based on feedback and maintain a clear focus on the core user experience."

**(Slide 3 — Tech Stack)**
> "Under the hood, FindIt is built using **Next.js** and **React**. For styling, we used Tailwind CSS and a modern, professional UI library. Our database is **PostgreSQL**, hosted on **Supabase**. Authentications are secure, and we use a custom matching algorithm written in TypeScript. 
> I will now hand it over to Akshat to discuss the backend systems."

---

### Member 2 — Akshat Madan (Backend Developer)
**(Slide 4 — Database & Claims System)**
> "Thank you, Sparsh. I'm **Akshat Madan**, Enrolment Number: **[Add Enrolment Number]**, and I led the backend and database architecture."
> "Our database connects users, reports, matched items, and claims seamlessly. I implemented a robust authentication system to ensure sessions are secure and private routes are protected."
> "I also implemented role-based access controls to securely govern user actions. Furthermore, we optimized our database queries and index structures, which significantly reduces data load times even as the number of active database records grows."
> "The claims workflow is built around trust. When claiming an item, users must answer a verification question set by the finder. Recently, we also added a **Claim Dispute Resolution System**. This allows handling cases where claims are unjustly rejected, adding an extra layer of reliability to the recovery process.
> Over to Harsh to showcase the UI design."

---

### Member 3 — Harsh Raj (Frontend Developer)
**(Slide 5 — Frontend & New Features)**
> "Thanks, Akshat. I’m **Harsh Raj**, Enrolment Number: **[Add Enrolment Number]**, and I developed the frontend."
> "I focused on making the app intuitive. The 'Report' forms are easy to fill out, and the 'Browse Items' page acts as a public gallery for anyone looking for their lost items. The app is fully responsive across mobile and desktop."
> "Beyond visual appeal, I focused heavily on web accessibility, ensuring that form inputs are clearly labeled and easily navigable. We also implemented efficient image optimization and smart state management to drastically improve the application's performance on slower networks."
> "To ensure a premium user experience, we recently integrated a **Theme Toggle for Dark Mode support** and updated the visuals to include specific **DTI branding**. This provides a very clean, professional, and consistent look across all pages.
> Now, Samagra will explain the core matching algorithm."

---

### Member 4 — Samagra Gulati (Algorithm & Testing)
**(Slide 6 — Matching Algorithm)**
> "Thank you, Harsh. I'm **Samagra Gulati**, Enrolment Number: **[Add Enrolment Number]**, and I built the automatic matching engine and handled testing."
> "Whenever a new report is added, the algorithm compares it against existing reports in the opposite category. We used the **Jaccard Similarity Index** for this. The system looks for keyword overlaps in titles and descriptions. Matches scoring 80% or above are highlighted in green as high confidence."
> "To handle variations in how people describe items, we integrated text normalization steps, like ignoring capitalization and minor variations prior to the calculation. Additionally, I set up thorough software testing for this core logic, ensuring that future code refinements deploy without breaking existing features."
> "We chose this approach because it’s fast, requires no complex machine learning models, and runs instantly on our servers."

**(Slide 7 — Conclusion)**
> "This project gave us hands-on experience with modern full-stack development. We tackled real challenges, like designing a unique matching engine and implementing secure claim disputes. FindIt successfully automates the recovery process and is ready to be used by any campus community."

---

### [Last 10 - 15 Seconds] OUTRO: Mandatory Final 15 Seconds
*(Visual on screen MUST include the project title, all names, enrolment numbers, and Bennett University).*
> "To conclude, this was **FindIt — A Smart Lost-and-Found Web Application**."
> "We are **Sparsh, Akshat, Harsh, and Samagra** from **Bennett University**."
> "Thank you for your time and for watching. All project links and the code repository are available on this final screen."
