const { Console } = require("console");
const uploadFile = require("../middleware/upload");
const fs = require("fs");
const baseUrl = "http://localhost:8080/files/";

const request = require('request');
const putUrl = 'http://localhost:8081/putFile';
let getUrl = 'http://localhost:8081/getFile';

function fileToBase64(filePath) {
    try {
        const fileBuffer = fs.readFileSync(filePath);
        const base64Data = fileBuffer.toString('base64');
        return base64Data;
    } catch (error) {
        console.error('Error:', error.message);
        return null;
    }
}

function deleteFileAsync(filePath) {
  fs.unlink(filePath, (error) => {
      if (error) {
          console.error('Error:', error.message);
      } else {
          console.log('File deleted successfully:', filePath);
      }
  });
}


const upload = async (req, res) => {
  try {
    await uploadFile(req, res);
    const filePath = "C:\\Users\\anshs\\OneDrive\\Desktop\\Cloud\\express-file-upload-master\\resources\\static\\assets\\uploads\\" + req.file.filename;
    const base64Data = fileToBase64(filePath);

    const postData = {
      "key": req.file.filename,
      "data": base64Data,
      "context":{
        "A":0,
        "B":0,
        "C":0
      }
  };

    console.log(postData);
    
    request.post({
      url: putUrl,
      json: postData,
    }, (error, response, body) => {
      if (error) {
          console.error('Error:', error);
        } else {
          console.log('Status Code:', response.statusCode);
          console.log('Response Body:', body);
        }
      });
      
      deleteFileAsync(filePath);
      
      if (req.file == undefined) {
        return res.status(400).send({ message: "Please upload a file!" });
      }
      
      res.status(200).send({
        message: "Uploaded the file successfully: " + req.file.originalname,
      });
  } catch (err) {
    console.log(err);

    if (err.code == "LIMIT_FILE_SIZE") {
      return res.status(500).send({
        message: "File size cannot be larger than 2MB!",
      });
    }

    res.status(500).send({
      message: `Could not upload the file: ${req.file.originalname}. ${err}`,
    });
  }
};

const getListFiles = (req, res) => {
  const directoryPath = __basedir + "/resources/static/assets/uploads/";

  fs.readdir(directoryPath, function (err, files) {
    if (err) {
      res.status(500).send({
        message: "Unable to scan files!",
      });
    }

    let fileInfos = [];

    files.forEach((file) => {
      fileInfos.push({
        name: file,
        url: baseUrl + file,
      });
    });

    res.status(200).send(fileInfos);
  });
};

const download = (req, res) => {
  const fileName = req.params.name;

  const requestData ={
    "key":fileName
  }

  const options = {
    url: getUrl,
    method: 'GET',
    json: true,
    body: requestData,
};

  request(options, (error, response, body) => {
    if (error) {
        console.error('Error:', error);
    } else {
        console.log('Status Code:', response.statusCode);
        console.log('Response Body:', body);
        res.status(200).send(body.message[0].data);
    }
  });
};

const remove = (req, res) => {
  const fileName = req.params.name;
  const directoryPath = __basedir + "/resources/static/assets/uploads/";

  fs.unlink(directoryPath + fileName, (err) => {
    if (err) {
      res.status(500).send({
        message: "Could not delete the file. " + err,
      });
    }

    res.status(200).send({
      message: "File is deleted.",
    });
  });
};

const removeSync = (req, res) => {
  const fileName = req.params.name;
  const directoryPath = __basedir + "/resources/static/assets/uploads/";

  try {
    fs.unlinkSync(directoryPath + fileName);

    res.status(200).send({
      message: "File is deleted.",
    });
  } catch (err) {
    res.status(500).send({
      message: "Could not delete the file. " + err,
    });
  }
};

module.exports = {
  upload,
  getListFiles,
  download,
  remove,
  removeSync,
};
