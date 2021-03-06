import Vue from 'vue'
import App from './App.vue'
import router from './router'
import ElementUI from 'element-ui'
import 'element-ui/lib/theme-chalk/index.css'
import store from './store/store'
import NProgress from 'nprogress'
import 'nprogress/nprogress.css'
import aes from '././aes/aes'
import rsa, {getSign, rsaEncrypt} from '././rsa/rsa'
import ipconfig from '../public/config/IPConfig'
import global from './global_variable'
import AlobalData from "@/global_variable";
import {axiosUtil} from "@/network/axiosUtil";
import Variable_global from "@/global_variable";
//main.js
import Viewer from 'v-viewer'
import 'viewerjs/dist/viewer.css'
import qs from "qs";

import './utils/dialogDrag.js'

import Print from 'vue-print-nb';//浏览器打印
Vue.use(Print);

import echarts from 'echarts'

Vue.prototype.$echarts = echarts

Vue.use(Viewer);
Viewer.setDefaults({
    Options: {
        "inline": true,
        "button": true,
        "navbar": true,
        "title": true,
        "toolbar": true,
        "tooltip": true,
        "movable": true,
        "zoomable": true,
        "rotatable": true,
        "scalable": true,
        "transition": true,
        "fullscreen": true,
        "keyboard": true,
        "url": "data-source"
    }
});

Vue.config.productionTip = false
Vue.use(ElementUI)
Vue.use(NProgress)

//全局进度条配置
NProgress.configure({
    showSpinner: true,
    parent: 'body',
    easing: 'ease',
    speed: '500'
})
/**
 * 随机获取uuid
 */
Vue.prototype.getUuid = function(){
    let s = [];
    let hexDigits = "0123456789abcdef";
    for (let i = 0; i < 36; i++) {
        s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1);
    }
    s[14] = "4"; // bits 12-15 of the time_hi_and_version field to 0010
    s[19] = hexDigits.substr((s[19] & 0x3) | 0x8, 1); // bits 6-7 of the clock_seq_hi_and_reserved to 01
    s[8] = s[13] = s[18] = s[23] = "-";

    let uuid = s.join("");
    return uuid;
},
/**
 * 时间戳转换成YYYY-MM-DD
 * @param timestamp
 * @returns {string}
 */
Vue.prototype.timestampToTime = function (timestamp) {
    let date = new Date(timestamp);//时间戳
    let Y = date.getFullYear() + '-';
    let M = (date.getMonth() + 1 < 10 ? '0' + (date.getMonth() + 1) : date.getMonth() + 1) + '-';
    let D = (date.getDate() < 10 ? '0' + date.getDate() : date.getDate()) + ' ';
    let h = (date.getHours() < 10 ? '0' + date.getHours() : date.getHours()) + ':';
    let m = (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes()) + ':';
    let s = (date.getSeconds() < 10 ? '0' + date.getSeconds() : date.getSeconds());
    return Y + M + D;
}
/**
 * 时间戳转换成YYYY-MM-DD HH:MM:SS
 * @returns {string}
 */
Vue.prototype.timestampToTimeYMDHMS = function () {
    let date = new Date();//时间戳
    let Y = date.getFullYear() + '-';
    let M = (date.getMonth() + 1 < 10 ? '0' + (date.getMonth() + 1) : date.getMonth() + 1) + '-';
    let D = (date.getDate() < 10 ? '0' + date.getDate() : date.getDate()) + ' ';
    let h = (date.getHours() < 10 ? '0' + date.getHours() : date.getHours()) + ':';
    let m = (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes()) + ':';
    let s = (date.getSeconds() < 10 ? '0' + date.getSeconds() : date.getSeconds());
    return Y + M + D+h+m+s;
}
/**
 * 日期推迟，提前
 * @param date
 * @param d
 * @returns {number}
 */
Vue.prototype.defaultTime = function (date, d) {
    date.setDate(date.getDate() + d);
    return date.getTime();
}
/*
* 全局前置路由 在路由进入前start进度条
* */
router.beforeEach((to, from, next) => {
    NProgress.start()
    next()
})

/*
* 全局后置路由 在路由完成时done进度条
* */
router.afterEach(() => {
    NProgress.done()
})

//Springboot后台路径
Vue.prototype.getLocation = function () {
    return ipconfig.getBackLink();
}

//vue首页页面
Vue.prototype.getLocationHref = function () {
    return ipconfig.getFrontLink;
}

/**
 * 对请求体aes加密，对aes的key用Rsa加密，并且校验
 * @param contentData
 * @param serverPublicKey
 * @returns {{appEncryptedKey: (CipherParams|string|null|PromiseLike<ArrayBuffer>), appSignature: *, serverPublicKey: *, contentDataByKey, appPublicKey: string}}
 */
Vue.prototype.getHeaderAndBody = function (contentData, serverPublicKey) {
    let iv = global.rsaAes.iv;
    let AESKey = aes.getRandom(32);
    let contentDataByKey = aes.encrypt(contentData, AESKey, iv);
    let vuePublicKey = global.rsaAes.vuePublicKey;
    let vueEncryptedKey = rsa.rsaEncrypt(AESKey, serverPublicKey);
    let vueSignature = rsa.getSign(contentData, global.rsaAes.vuePrivateKey);
    let returnData = {
        appEncryptedKey: vueEncryptedKey, //使用服务器RSA公钥加密后的AES密钥
        appSignature: vueSignature, //APP使用RSA密钥对请求体的签名
        appPublicKey: vuePublicKey,
        serverPublicKey: serverPublicKey,
        contentDataByKey: contentDataByKey,
    }
    console.info(returnData)
    return returnData;
}


/**
 * rsa解密
 * @param pas
 * @param privateKey
 * @returns {WordArray|string|PromiseLike<ArrayBuffer>}
 */
Vue.prototype.rsaDecrypt = function (pas, privateKey, encrypt) {
    let prototype = rsa.rsaDecrypt(pas, privateKey);
    let encryptData = encrypt.replace(/[\r\n]/g, "");
    let returnData = aes.decrypt(encryptData, prototype, global.rsaAes.iv);
    return returnData;
}


/**
 * post请求不加密
 * @param url
 * @param param
 */
Vue.prototype.post_url_notEncryption = function (url, param) {
    let that = this;
    console.info("data条件", param)
    return new Promise(function (resolve) {
        let operator = "";//操作人
        if (JSON.parse(sessionStorage.getItem("user")) != null) {
            operator = JSON.parse(sessionStorage.getItem("user")).username
        }
        //let postData = qs.stringify(param);
        axiosUtil({
            url: url,
            method: 'post',
            data: param,
            headers: {
                xhrFields: {withCredentials: true}
            }
        }).then(function (res) {
            console.info("不加密返回体", res)
            resolve(res);
        }).catch(function (res) {
            that.$message.error("服务器繁忙！");
        });

    });
}

/**
 * post请求导出
 * @param url
 * @param param
 */
Vue.prototype.postExport = function (url, param) {
    let that = this;
    console.info("data条件", param)
    return new Promise(function (resolve) {
        let postData = qs.stringify(param);
        axiosUtil({
            url: url,
            method: 'post',
            data: postData,
            responseType:'blob'
        }).then(function (res) {
            console.info("导出返回体", res)
            resolve(res);
        }).catch(function (res) {
            that.$message.error("服务器繁忙！");
        });

    });
}



/**
 * post请求
 * @param url
 * @param param
 */
Vue.prototype.post_url = function (url, param, message, functions, state) {
    let that = this;
    console.info("data条件", param)
    return new Promise(function (resolve) {
        let contentData = JSON.stringify(param);
        if (sessionStorage.getItem("serverPublicKey") == null || sessionStorage.getItem("serverPublicKey") == "") {
            that.$message.error("账号过期，请重新登录!")
            that.$router.push({
                path: '/login'
            })
            return;
        }
        if (AlobalData.rsaAes.serverPublicKey == null || AlobalData.rsaAes.serverPublicKey == "") {
            AlobalData.rsaAes.serverPublicKey = sessionStorage.getItem("serverPublicKey");
        }
        console.info(" 服务端公钥", AlobalData.rsaAes.serverPublicKey);
        let headerAndBody = that.getHeaderAndBody(
            contentData,
            AlobalData.rsaAes.serverPublicKey
        );
        let operator = "";//操作人
        if (JSON.parse(sessionStorage.getItem("user")) != null) {
            operator = JSON.parse(sessionStorage.getItem("user")).username
        } else {
            if (state != "login") {
                that.$message.error("账号过期，请重新登录!")
                that.$router.push({
                    path: '/login'
                })
                return;
            }

        }
        //校验后台用户数据
        axiosUtil({
            url: url,
            method: 'post',
            data: headerAndBody.contentDataByKey,
            headers: {
                appEncryptedKey: headerAndBody.appEncryptedKey, //使用服务器RSA公钥加密后的AES密钥
                appSignature: headerAndBody.appSignature, //APP使用RSA密钥对请求体的签名
                appPublicKey: headerAndBody.appPublicKey,
                serverPublicKey: headerAndBody.serverPublicKey,
                operator: operator
            }
        }).then(function (res) {
            if (res != null && res.headers != null && res.headers.code == global.errorCode.KEY_RSA_SERVER_EXPIRED) {//服务端公钥过期
                that.$message.error("账号过期，请重新登录!")
                that.$router.push({
                    path: '/login'
                })
                return;
            }

            console.info("main.js", res)
            let returnKey = that.rsaDecrypt(
                res.headers.serverencryptedkey,
                AlobalData.rsaAes.vuePrivateKey,
                res.data.data
            );
            res.data = JSON.parse(returnKey);
            resolve(res);
            // if (res.headers.code == global.errorCode.SUCCESS) {
            //     resolve(res);
            // } else {
            //     // that.$message.error(res.data);
            //     resolve(res);
            // }
        }).catch(function (res) {
            resolve(res);
            console.log("失败")
        });
    });
}
/**
 * postUploadTemplate下载
 * @param url
 * @param param
 */
Vue.prototype.getUploadTemplate = function (url, param) {
    console.info("下载文件信息", param)
    return new Promise(function (resolve) {
        //校验后台用户数据
        axiosUtil({
            url: url,
            method: 'post',
            data: param,
            responseType:'blob'
        }).then(function (res) {
                resolve(res);
            const link = document.createElement("a");
            let blob = new Blob([res.data], { type: "application/vnd.ms-excel" });
            link.style.display = "none";
            link.href = URL.createObjectURL(blob);
            link.setAttribute("download", decodeURI(res.headers['filename']));
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link)
        }).catch(function (res) {
            resolve(res);
        });
    });
}


/**
 * postUpload上传
 * @param url
 * @param param
 */
Vue.prototype.postUpload = function (url, param, message, functions) {
    let that = this;
    console.info("上传文件信息", param)
    return new Promise(function (resolve) {
        let operator = "";//操作人
        if (JSON.parse(sessionStorage.getItem("user")) != null) {
            operator = JSON.parse(sessionStorage.getItem("user")).username
        }
        //校验后台用户数据
        axiosUtil({
            url: url,
            method: 'post',
            data: param,
            headers: {
                "Content-Type": "multipart/form-data",
                operator: operator
            }
        }).then(function (res) {
            if (functions != null) {
                functions
            }
            if (res != null && res.headers != null && res.headers.code == global.errorCode.KEY_RSA_SERVER_EXPIRED) {//服务端公钥过期
                that.$message.error("账号过期，请重新登录!")
                that.$router.push({
                    path: '/login'
                })
                return;
            }
            if (res.data.code == Variable_global.errorCode.SUCCESS) {
                resolve(res);
            } else {
                that.$message.error(message);
            }
            console.info("提交新增图片返回体", res)
        }).catch(function (res) {
            console.info("提交新增图片报错返回体", res)
            resolve(res);
            if (functions != null) {

                functions
            }
            that.$message.error(message);
        });
    });
}


new Vue({
    router,
    store,
    data: {
        eventHub: new Vue()
    },
    render: h => h(App)
}).$mount('#app')

