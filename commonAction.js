var commonAction = {};

var common = require("./common.js");

findRootAppUI = function () {
    var root = packageName(common.destPackageName).className("FrameLayout").findOne(1000);
    if (root == null) {
        toastLog(common.destAppName + " FrameLayout is not exist");
        return null;
    }
    return root;
}

// 判断是否主界面
judgeAppMainPage = function () {
    var root = findRootAppUI();
    if (root == null) {
        return false;
    }

    var tabNames = ["考拉豆", "分类", "购物车", "我的考拉"];
    for (var i = 0; i < tabNames.length; i++) {
        var entry = root.findOne(className("TextView").text(tabNames[i]));
        if (entry == null) {
            log("judgeAppMainPage: " + tabNames[i] + " not exist");
            return false;
        }
    }

    return true;
}

// 多次判断是否进入主页，避免网络延时导致问题
commonAction.loopJudgeAppMainPage = function (sleepTime) {
    var trytimes = 0;
    while (trytimes < 10) {
        var isLoged = judgeAppMainPage();
        if (isLoged) {
            return true;
        }
        trytimes = trytimes + 1;
        sleep(sleepTime);
    }
    return false;
}

commonAction.backToAppMainPage = function () {
    log("backToAppMainPage");
    try{
        var curPkg = currentPackage();
        log("currentPackage(): " + curPkg);
        if (curPkg != common.destPackageName) {
            log("recents: " + recents());
            sleep(1000);
            var btn = text(common.destAppName).findOne(3000);
            if (btn != null) {
                log("switch to " + common.destAppName + ": " + btn.parent().parent().click());
                sleep(1000);
            } else {
                log("no " + common.destAppName + " process");
            }
        }

        var trytimes = 0;
        while (trytimes < 10)
        {
            result = judgeAppMainPage()
            if (result){
                return true;
            }
            var result = back();
            if (!result) {
                toastLog(common.destAppName + " back fail");
                return false;
            }
            trytimes = trytimes + 1;
            sleep(3000);
        }
        return false;
    } catch(e) {
        console.error("mainWorker",e);
    }
}

//进入考拉豆
commonAction.gotoKaolaBean = function () {
    log("gotoKaolaBean");
    var kaolaBeanTab = text("考拉豆").packageName(common.destPackageName).findOne(30000);
    if (kaolaBeanTab == null){
        toastLog("考拉豆 tab not exist");
        commonAction.backToAppMainPage();
        return null;
    }

    var clickRet = kaolaBeanTab.parent().parent().click();
    log("点击 考拉豆: " + clickRet);
    if (clickRet == false) {
        commonAction.backToAppMainPage();
        return null;
    }
    sleep(1000);

    var myAward = common.waitForText("text", "我的奖励", true, 30);
    if (myAward == null) {
        commonAction.backToAppMainPage();
        return null;
    }

    sleep(5000);
    var levelTips = myAward.parent().parent().parent().parent().parent().child(2).child(0);
    var progressTips = myAward.parent().parent().parent().parent().parent().child(2).child(1).child(0);
    log("级数: " + levelTips.text() + ", 升级进度: " + progressTips.text());

    //考拉豆数量: myAward.parent().parent().parent().parent().parent().child(3).child(最后一个节点).child(0);
    //赚豆: myAward.parent().parent().parent().parent().parent().child(4).child(最后一个节点).child(最后一个节点);
    return myAward.parent().parent().parent().parent().parent();
}

commonAction.scrollThrough = function (txt, timeout) {
    //超时返回false
    var startTime = parseInt(new Date().getTime() / 1000);
    var nowTime = parseInt(new Date().getTime() / 1000);
    for (;;) {
        var slide = textContains(txt).visibleToUser(true).findOne(1000);
        nowTime = parseInt(new Date().getTime() / 1000);
        log("slide tips: " + (slide != null) + ", " + (nowTime - startTime) + "s");
        if (slide != null) {
            log("slide.bounds().height(): " + slide.bounds().height());
        }
        if (slide == null || nowTime - startTime > timeout || slide != null && slide.bounds().height() < 10) {
            break;
        }

        var curPkg = currentPackage();
        if (curPkg != common.destPackageName) {
            //跳其他app了要跳回来
            log("currentPackage(): " + curPkg);
            log("recents: " + recents());
            sleep(1000);
            var btn = text(common.destAppName).findOne(3000);
            if (btn != null) {
                log("switch to " + common.destAppName + ": " + btn.parent().parent().click());
                sleep(1000);
            } else {
                log("no " + common.destAppName + " process");
            }
        }

        swipe(device.width / 5, device.height * 13 / 16, device.width / 5, device.height * 11 / 16, Math.floor(Math.random() * 200) + 200);
        sleep(1000);
    }

    if (nowTime - startTime >= timeout) {
        return false;
    }

    return true;
}

commonAction.backToTaskList = function (title) {
    if (title.indexOf("(") != -1) {
        title = title.slice(0, title.indexOf("("));
    }
    toastLog("backToTaskList: " + title);
    var startTick = new Date().getTime();
    for (;;) {
        var ret = back();
        log("back(): " + ret);

        var curPkg = currentPackage();
        log("currentPackage(): " + curPkg);
        if (curPkg != common.destPackageName) {
            log("recents: " + recents());
            sleep(1000);
            var btn = text(common.destAppName).findOne(3000);
            if (btn != null) {
                log("switch to " + common.destAppName + ": " + btn.parent().parent().click());
                sleep(1000);
            } else {
                log("no " + common.destAppName + " process");
            }
        }

        sleep(3000);
        var tips = packageName(common.destPackageName).className("android.view.View").textContains(title).findOne(1000);
        if (tips != null) {
            break;
        }
        toastLog("no " + title);

        if (new Date().getTime() - startTick > 15 * 1000) {
            log("backToFeedTaskList timeout");
            break;
        }
    }
}

//成功返回true，超时或异常返回false，最后会返回上一个页面
commonAction.doBrowseTasks = function (tasklist, triedTasklist) {
    var ret = false;
    for (var i = 0; i < tasklist.length; i++) {
        // toastLog("点击[" + (i+1) + "/" + tasklist.length + "] " + tasklist[i].Title + " " + tasklist[i].BtnName + ": " + click(tasklist[i].Button.bounds().centerX(), tasklist[i].Button.bounds().centerY()));
        toastLog("点击[" + (i+1) + "/" + tasklist.length + "] " + tasklist[i].Title + " " + tasklist[i].BtnName + ": " + tasklist[i].Button.parent().click());
        sleep(5000);
        if (triedTasklist != null) {
            triedTasklist.push(tasklist[i].Title);
        }
        // 等待离开任务列表页面
        if (tasklist[i].Tips == "") {
            sleep(20000);
            //回到任务列表
            commonAction.backToTaskList(tasklist[i].Title);
        } else {
            if (common.waitForText("textContains", "浏览", true, 10)) {
                log("等待 " + tasklist[i].Title + " 浏览完成，60s超时");
                sleep(5000);
                var browseRet = commonAction.scrollThrough("浏览", 60);
                //回到任务列表
                commonAction.backToTaskList(tasklist[i].Title);
                if (browseRet) {
                    log("浏览 " + tasklist[i].Title + " 完成");
                    ret = true;
                } else {
                    log("60s timeout");
                }
                break;
            } else {
                commonAction.backToTaskList(tasklist[i].Title);
            }
        }
    }
    return ret;
}

module.exports = commonAction;