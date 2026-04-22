
const express = require("express");
const multer = require("multer");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));

const PORT = 3000;

if (!fs.existsSync("uploads")) fs.mkdirSync("uploads");
if (!fs.existsSync("plist")) fs.mkdirSync("plist");

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => {
    const id = Date.now();
    cb(null, id + "-" + file.originalname);
  }
});

const upload = multer({ storage });

app.post("/upload", upload.single("file"), (req, res) => {
  const file = req.file;
  const id = file.filename.split("-")[0];

  const { bundle, version, title } = req.body;

  const ipaUrl = `${req.protocol}://${req.get("host")}/uploads/${file.filename}`;
  const plistName = `${id}.plist`;

  const plistContent = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
<key>items</key><array><dict>
<key>assets</key><array>
<dict><key>kind</key><string>software-package</string>
<key>url</key><string>${ipaUrl}</string></dict>
</array>
<key>metadata</key><dict>
<key>bundle-identifier</key><string>${bundle}</string>
<key>bundle-version</key><string>${version}</string>
<key>kind</key><string>software</string>
<key>title</key><string>${title}</string>
</dict>
</dict></array>
</dict></plist>`;

  fs.writeFileSync(`plist/${plistName}`, plistContent);

  const plistUrl = `${req.protocol}://${req.get("host")}/plist/${plistName}`;
  const installLink = `itms-services://?action=download-manifest&url=${plistUrl}`;

  res.send(`
    <h2>Upload thành công</h2>
    <p><a href="${installLink}">👉 Cài trực tiếp</a></p>
    <p>Plist: ${plistUrl}</p>
  `);
});

app.use("/uploads", express.static("uploads"));
app.use("/plist", express.static("plist"));

app.listen(PORT, () => console.log("http://localhost:" + PORT));
