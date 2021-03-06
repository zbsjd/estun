
/**
 *
 * @param times
 * @param format
 * @returns {*}
 */
function formatTime(times, format) {
    let date
    if (times.length == 10) {
        date = new Date(times * 1000); //如果时间戳为10位数， 则*1000改为毫秒数
    } else {
        date = new Date(times);
    }
    if (/(y+)/.test(format)) {
        format = format.replace(RegExp.$1, (date.getFullYear() + '').substr(4 - RegExp.$1.length));
    }
    let o = {
        'M+': date.getMonth() + 1,
        'd+': date.getDate(),
        'h+': date.getHours(),
        'm+': date.getMinutes(),
        's+': date.getSeconds()
    };
    for (let k in o) {
        if (new RegExp(`(${k})`).test(format)) {
            let str = o[k] + '';
            format = format.replace(RegExp.$1, (RegExp.$1.length === 1) ? str : padLeftZero(str));
        }
    }
    return format;
}
function padLeftZero(str) {
    return ('00' + str).substr(str.length);
};

/**
 * 获取当前时间的年月
 */
function getDateYM(){
    let day2 = new Date();
    day2.setTime(day2.getTime());
    let m = day2.getMonth()+1;
    let s2 = day2.getFullYear()+"-" + ('00' + m).substr((m+"").length);
    return s2;
}


export default {
    formatTime,
    getDateYM
}

