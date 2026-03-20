const express=require("express");
const fs=require("fs");
const path=require("path");
const session=require("express-session");
const app=express();
const PORT=process.env.PORT||3000;

app.use(express.json());
app.use(express.static("public"));
app.use(session({secret:"og-secret",resave:false,saveUninitialized:true}));

const DB="./db.json";
const read=()=>JSON.parse(fs.readFileSync(DB));
const write=d=>fs.writeFileSync(DB,JSON.stringify(d,null,2));

// ROOT
app.get("/",(req,res)=>res.sendFile(path.join(__dirname,"public/login.html")));
app.get("/user/login",(req,res)=>res.sendFile(path.join(__dirname,"public/login.html")));

// LOGIN
app.post("/api/v1/user/login",(req,res)=>{
 const {username,password}=req.body;
 const db=read();
 const u=db.users.find(x=>x.username===username && x.password===password);
 if(!u) return res.json({status:"error"});
 req.session.user=username;
 res.json({status:"success",data:{username}});
});

// DASHBOARD PROTECT
app.get("/user/dashboard",(req,res)=>{
 if(!req.session.user) return res.redirect("/user/login");
 res.sendFile(path.join(__dirname,"public/dashboard.html"));
});

// LOGOUT
app.get("/api/v1/user/logout",(req,res)=>{
 req.session.destroy(()=>res.json({status:"logout"}));
});

// USER INFO
app.get("/api/v1/user/me",(req,res)=>{
 if(!req.session.user) return res.json({status:"error"});
 res.json({status:"success",user:{username:req.session.user}});
});

// OTP AUTO GENERATE
setInterval(()=>{
 let db=read();
 db.users.forEach(u=>u.otp=(Math.floor(100000+Math.random()*900000)).toString());
 write(db);
},5000);

// OTP GET
app.get("/api/v1/user/:username/otp",(req,res)=>{
 let db=read();
 let u=db.users.find(x=>x.username===req.params.username);
 res.json({status:"success",otp:u?.otp||"000000"});
});

// STOCKYARDS
app.get("/api/v1/user/stockyards/:username",(req,res)=>{
 let db=read();
 let u=db.users.find(x=>x.username===req.params.username);
 res.json({status:"success",data:u?.stockyards||[]});
});

// ADD STOCKYARD
app.post("/api/v1/user/stockyards/:username/add",(req,res)=>{
 let db=read();
 let u=db.users.find(x=>x.username===req.params.username);
 u.stockyards.push(req.body);
 write(db);
 res.json({status:"added"});
});

// DELETE STOCKYARD
app.post("/api/v1/user/stockyards/:username/delete",(req,res)=>{
 let db=read();
 let u=db.users.find(x=>x.username===req.params.username);
 u.stockyards=u.stockyards.filter(s=>s.name!==req.body.name);
 write(db);
 res.json({status:"deleted"});
});

// ADMIN
app.get("/api/admin/users",(req,res)=>res.json(read()));
app.post("/api/admin/add-user",(req,res)=>{
 let db=read();
 db.users.push({username:req.body.username,password:req.body.password,phone:req.body.phone,otp:"000000",stockyards:[]});
 write(db);
 res.json({status:"added"});
});

app.listen(PORT,()=>console.log("FINAL SERVER http://localhost:"+PORT));
