var request = require("superagent");
var nodemailer = require("nodemailer");
var cheerio = require("cheerio");
var schedule = require('node-schedule');


var path = require("path");
var fs = require('fs');

const moment = require('moment')
var Async = require("async");

const ROOT_URL = "https://www.codecasts.com";

// process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// 伪造的ip
ipConfig = ["10.111.198.99", "10.111.198.98", "10.111.198.97", "10.111.198.96", "10.111.198.95"];

//验证这个是验证身份的token
var cookie_flag;

const base_config = {
  "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8",
  "accept-encoding": "gzip, deflate, br",
  "accept-language": "zh-CN,zh;q=0.9",
  "cache-control": "no-cache",
  "cookie": "__auc=c9ca8dc51609c9d12e9b6ecc7a9; _ga=GA1.3.1205430163.1514456028; __asc=48275a25160e95bc6b73f50c42c; XSRF-TOKEN=eyJpdiI6IkRSbmxsamFZMHZOek1vdWc4WURrWEE9PSIsInZhbHVlIjoieGJNYm1hM0hzK3MxXC9Ld3lrU1o3S2lSeWZKOXBxdnk2cnBwdXd4MzdjbnNaWW1TTTFGd25adlwvNzlleHloOUhmcW9BNjQ3TzNMeUgrQkFcLzlGYitQSFE9PSIsIm1hYyI6ImY0OTZhMTRjYTYzZGI3OTZjMDRkMTY4MTMyYjFlNGNhMDhkZTQ3MWE3ODRiNDM3YjliYTY5OWEyZGM3YThiMDIifQ%3D%3D; laravel_session=eyJpdiI6Ijg1WGJBUDdHSjVIVUlJeVNRTFB3cVE9PSIsInZhbHVlIjoibmlqMVwvSElJSm9SRnZUb3libndWR1pJUHhGbkk3V0s1MnJ4XC9MXC9rdUZ2RU1XNkkzM0VtWE5MXC9VRUdsRStZYXYrc1BIUmVcL1VZMGdQWnV4Z251SWFZdz09IiwibWFjIjoiYjM2NTU2MTkyYjlkNjBmMDdkMzliNTVmZjgxYTI4MTQ2MjYyYjAwMGQ2ZmE2ODU3YThlNWI1OWUxMWYwZDc4ZCJ9; Hm_lvt_5d92f95c051389a923e14e448ede2cf4=1515633219,1515661683,1515726043,1515744224; Hm_lpvt_5d92f95c051389a923e14e448ede2cf4=1515744224",
  "pragma": "no-cache",
  "upgrade-insecure-requests": 1,
  "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/63.0.3239.132 Safari/537.36"
};

//登录获取
async function getToken(callback) {
  request
    .get(ROOT_URL + "/user/login?redirect_url=https://www.codecasts.com")
    .set(base_config)
    .set("X-Forwarded-For", ipConfig[parseInt(Math.random() * 4)])
    .end((err, res) => {

      const $ = cheerio.load(res.text, {decodeEntities: false});

      let _token = $('input[type=hidden]').val();
      // 拿到cookie然后赋值给全局变量
      let _cookie = res.headers["set-cookie"];

      callback(null, {_token, _cookie});
    });
}

//登录函数
async function postLogin(data, callback) {
  console.log(data);
  request.post(ROOT_URL + "/user/login")
    .set("X-Forwarded-For", ipConfig[parseInt(Math.random() * 4)])
    .set("origin", "https://www.codecasts.com")
    .set("referer", "https://www.codecasts.com/user/login?redirect_url=https://www.codecasts.com")
    .set("upgrade-insecure-requests", "1")
    .set("Content-type", "application/x-www-form-urlencoded")
    .set('Cookie', data._cookie)
    .redirects(0)
    .set("X-Forwarded-For", ipConfig[parseInt(Math.random() * 4)])
    .send({
      "email": "3050232357@qq.com",
      "password": "yjs10086",
      "_token": data._token
    }).end((err, result) => {
    console.log(result.text);
    cookie_flag = result.headers['set-cookie'];
    console.log(cookie_flag);
    callback(null, {_token: data._token, cookie: result.headers['set-cookie']});
  });
}

//签到函数
async function checkRemark(data, callback) {
  request.post(ROOT_URL + "/remarks")
    .set(base_config)
    .set("X-Forwarded-For", ipConfig[parseInt(Math.random() * 4)])
    .set("x-csrf-token", data._token)
    .set("Cookie", data.cookie)
    .end(function (err, res) {
      console.log("cuowu 2")
      let result = JSON.parse(res.text);
      if (result.message === "Remark OK!") {
        callback(null, "签到成功");
      } else {
        callback(null, "签到失败");
      }
    });
}

//主函数
async function run() {
  Async.waterfall([
    function (callback) {
      getToken(callback);
    },
    function (data, callback) {
      postLogin(data, callback)
    },
    function (data, callback) {
      checkRemark(data, callback);
    }

  ], function (err, result) {

    console.log("---结果:", result);
    sendMail();
  });

}

// setInterval(()=>run(),1000);
function scheduleCronstyle() {
  schedule.scheduleJob('30 30 10 * * *', async function () {
    try {
      setImmediate(async () => {
        run();
      });
      console.log("成功1");
      // await log('scheduleCronstyle:' + new Date() + "执行成功", true);
    }
    catch (err) {
      console.log("错误1")
      log(err.message, false);
    }
  });
}

scheduleCronstyle();

//--------------request-------------
// const request = require("request");
//
// var iconv = require('iconv-lite');
//
// request.get({
//   url: 'https://www.codecasts.com/',
//   // headers: base_config,
//   // encoding: 'utf-8', //让body 直接是buffer
//   agentOptions: {
//     // rejectUnauthorized: false,
//     // secureProtocol: 'TLSv1_method',
//     // ciphers: '0000'
//   }
// }, function (err, res, body) {
//   console.log(body);
//   console.log("-------");
// });
//--------------request-------------
// const https = require("https");
//
// options = {
//   host: "www.codecasts.com",
//   port: 443,
//   path: "/",
//   method: "GET",
//   rejectUnauthorized: false,
//   secureProtocol: "TLSv1_method",
// };
// option = new https.Agent(options);
//
// const req = https.request(option, (res) => {
//   console.log(res);
//   res.on('data', (d) => {
//     process.stdout.write(d);
//   });
// });
// req.on('error', (e) => {
//   console.error(e);
// });
// req.end();


//aysnc 不能用async函数
//node用低版本来使用然后实现爬虫
//发送通知邮件函数
//目前就通知1143140701@qq.com签到情况
async function sendMail() {
  var transporter = nodemailer.createTransport({
    service: 'qq',
    auth: {
      user: '3050232357@qq.com',
      pass: 'zqmkgvhffupzdcgh'
    }
  });
  var mailOptions = {
    from: '3050232357@qq.com', // 发送者
    to: '1143140701@qq.com', // 接受者,可以同时发送多个,以逗号隔开
    subject: '签到情况说明', // 标题
    text: '签到成功2', // 文本
  };
  transporter.sendMail(mailOptions, function (err, info) {
    if (err) {
      console.log(err);
      log(err.message, false);
      return;
    }
    console.log('发送成功');
  });
}

//实现日志功能
async function log(mess, type) {
  //创建日志目录
  const logDirectory = path.join(__dirname, '/log')
  fs.existSync(logDirectory) || fs.mkdirSync(logDirectory);
  if (type) {
    //创建日志写入流
    const logStream = fs.createWriteStream(path.join(__dirname, `/log/error-${moment().format('YYYYMMDD')}.log`), {flags: 'a'});
    // \r\n用于换行
    logStream.write(`${mess}----\r\n`);
    logStream.end();
  } else {
    //创建日志写入流
    const logStream = fs.createWriteStream(path.join(__dirname, `/log/error-${moment().format('YYYYMMDD')}.log`), {flags: 'a'});
    // \r\n用于换行
    logStream.write(`${mess}----\r\n`);
    logStream.end();
  }

}