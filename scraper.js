const http = require("http");
let axios = require('axios');
let cheerio = require('cheerio');
let fs = require('fs'); 
const Json2csvParser = require('json2csv').Parser;
let masterURL = 'http://shirts4mike.com/'
let shirtsURL = 'http://shirts4mike.com/shirts.php'
const dir = './data';
const fields = ['title', 'price', 'image','url','time'];
let idList = []

//create data directory if doesn't exist
if (!fs.existsSync(dir)){
    fs.mkdirSync(dir);
}

//connect to target web site and get thsirt list and send to product list object
axios.get(shirtsURL)
.then((response) => {
    if(response.status === 200) {
        const html = response.data;
        const $ = cheerio.load(html); 
        let productList = [];
        $('.products li').each(function(i,elem){
            productList[i] = {
                id: $(this).children("a").attr("href"),
            }
        })
//connect to every thsirt page one by one and get related information that tshirt, after that send all data to one array         
        let requests = [];
        let finalList ={}
        for (let i=0; i<productList.length; i++) {
            let id = productList[i].id;
            requests.push(axios.get(masterURL+ id)
            .then((response) => {
                if(response.status === 200) {
                    const html = response.data;
                    const $ = cheerio.load(html); 
                    let title = $('.shirt-picture img').attr("alt");
                    let price = $('.price').text();
                    let url = $('.shirt-picture img').attr("src");
                    let time  = new Date().toUTCString();
                    let newId = id.slice(13, 16);
                        finalList[newId] = {
                            title: title,
                            price : price,
                            image : url,
                            url: masterURL+id, 
                            time : time,
                        }
                    idList.push(newId);
                } 
                
            }, (error) => console.log(err)));
        }
            Promise.all(requests).then(() => {
                    let lastFinalList = [];
                    for (let i=0 ; i<idList.length; i++) {
                        lastFinalList.push(finalList[idList[i]])
                    }
//create export csv from final array if process finished get message to console.                     
                        const json2csvParser = new Json2csvParser({ fields });
                        const csv = json2csvParser.parse(lastFinalList, { fields });
                        const now = new Date();
                        const csv_filename = "./data/" + now.toISOString().substring(0, 10) + ".csv";
                        fs.writeFileSync(csv_filename, csv);
                        console.log("file exported!")
            })
    }
// if app doesn't connect to target web site, get connection error
})  .catch(error => {
    let errorMessage = '';
                if(error.code == "ENOTFOUND") {
                    errorMessage = `There’s been a 404 error. Cannot connect to  ${masterURL} `;
                } else {
                    errorMessage = error.message;
                }
      console.log(errorMessage);                
});


