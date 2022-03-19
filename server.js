const express = require('express')
const cors = require('cors')
const axios = require('axios')
const { CustomAlphabet, customAlphabet } = require("nanoid");
const connectDB = require("./config/db");


let nanoid = customAlphabet("1234567890abcdef", 8)

const PORT = process.env.PORT || 3000;

connectDB();

const URL = require("./models/Urls");

app  = express();
app.use(cors());
app.use(express.json());


app.get("/", (req,res) => {
    res.json({
        message: "Home page"
    });
});

app.post("/api/shortner",async (req, res, next) => {
    if(req.body.url){
        try{
            let url = await URL.findOne({
                originalUrl: req.body.url
            }).exec()
    
            if(url){
                res.json(url)
            }else{
                const response = await axios.get(req.body.url.toString(), {
                    validateStatus: (status) => {
                      return status < 500;
                    },
                  });
                
                if (response.status != 404) {
                    let newUrl;
                    while (true) {
                        let shortUrl = nanoid();
                        let checkedUrl = await URL.findOne({ shortUrl: shortUrl }).exec();
                            if (!checkedUrl) {
                                newUrl = await URL.create({
                                originalUrl: req.body.url,
                                shortUrl: shortUrl,
                                });
                                break;
                            }
                    }
        
                    res.json({
                    short: `${process.env.URL}/${newUrl.shortUrl}`,
                    status: response.status,
                    });
                } else {
                    res.json({
                    message: response.statusText,
                    status: response.status,
                    });
                }
                
            }
        }
        catch(err){
            next(err)
        }

    }else{
        res.status(400)
        const error = new Error("url is required")
        next(error)
    }
});

app.get("/:shortner", async (req, res, next) => {
    try {
      let url = await URL.findOne({ shortUrl: req.params.shortner }).exec();
  
      if (url) {
        res.status(301);
        res.redirect(url.originalUrl);
      } else {
        next();
      }
    } catch (err) {
      next(err);
    }
  });

app.get("/urls",async (req, res, next ) => {
    let urls = await URL.find({}).exec()
    res.json(urls);
});

function notFound(req,res, next){
    res.status(404)
    const error = new Error("Not found "+ req.originalUrl);
    next(error)
}

function errorHandler(err, req, res, next){
    res.status(res.statusCode || 500)
    res.json({
        message : err.message,
        error: {
            status: res.statusCode,
            stack: process.env.ENV = "development" ? err.stack : undefined
        }
    })
}

app.use(notFound);
app.use(errorHandler);

app.listen(PORT, () => console.log(`listening on port ${PORT}`));