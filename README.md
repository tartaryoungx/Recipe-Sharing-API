# Recipe-Sharing-API
First easy project from "https://projects.masteringbackend.com/projects"
We use 
Database: My Sql2           |
Database UI: phpmyadmin     |---> docker build
Backend: Node.js [npm init -y] [make src folder and index.html index.js]
packages:   express             สำหรับ library node สำหรับทำ Rest API
            cors                สำหรับการเปิดให้ฝั่ง Frontend สามารถยิงเข้ามาผ่าน cross domain ได้
            mysql2              สำหรับจัดการฐานข้อมูล mysql
            jsonwebtoken        สำหรับการเข้ารหัสข้อมูลสำหรับแนบเข้า token ตอน login สำเร็จ
            cookie-parser       สำหรับเรียกใช้และ save cookie
            bcrypt              สำหรับเข้ารหัส password
            express-session     สำหรับการ login ในเคสที่ใช้ session
            uuid
 [npm i --]
 Auth: Webstorage keep token




 ดูว่า port นี้ใครใช้อยุ่
 netstat -ano | findstr :3306
 tasklist | findstr "PID"

 port map
 "ข้างนอก:ข้างใน"
 HOST:CONTAINER