const express = require("express")
const cors = require("cors")
const nodemailer = require("nodemailer")
const mongoose = require("mongoose")

const app = express()

app.use(express.json())
app.use(cors({
  origin: "*"
}))


mongoose.connect(
  "mongodb+srv://krishnaapranav576:Pranav%402026@cluster0.absqqdo.mongodb.net/passkey?retryWrites=true&w=majority"
)
.then(() => console.log("DB connected"))
.catch((err) => {
  console.log("DB failed")
  console.log(err)
})



const credential = mongoose.model(
  "credential",
  {},
  "bulkmail"
)



const Mail = mongoose.model(
  "mail",
  {
    subject: String,
    body: String,
    emails: [String],
    status: String,
    date: { type: Date, default: Date.now }
  }
)



app.post("/sendemail", async (req, res) => {

  try {

    const subject = req.body.subject || "No subject"
    const msg = req.body.msg || ""
    const emailList = req.body.emailList || []

    console.log("Emails:", emailList.length)

   
    const data = await credential.find()

    if (!data.length) {
      console.log("No credential in DB")
      return res.send(false)
    }

    const user = data[0].toJSON().user
    const pass = data[0].toJSON().pass

    console.log("Using:", user)

    
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: user,
        pass: pass
      }
    })


   
    for (let i = 0; i < emailList.length; i++) {

      await transporter.sendMail({
        from: user,
        to: emailList[i],
        subject: subject,
        text: msg
      })

      console.log("Sent to:", emailList[i])

    }


    
    await Mail.create({
      subject: subject,
      body: msg,
      emails: emailList,
      status: "sent"
    })


    res.send(true)

  }
  catch (err) {

    console.log("ERROR:", err)

    try {
      await Mail.create({
        subject: req.body.subject,
        body: req.body.msg,
        emails: req.body.emailList,
        status: "failed"
      })
    } catch {}

    res.send(false)

  }

})


const PORT = process.env.PORT || 3005

app.listen(PORT, () => {
  console.log("server started on", PORT)
})