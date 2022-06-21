var kaolaBeanSignIn = {};

var common = require("./common.js");
var commonAction = require("./commonAction.js");

doMerchantTasks = function (tasklist) {
    var ret = false;
    for (var i = 0; i < tasklist.length; i++) {
        toastLog("点击[" + (i+1) + "/" + tasklist.length + "] " + tasklist[i].Title + " " + tasklist[i].BtnName + ": " + click(tasklist[i].Button.bounds().centerX(), tasklist[i].Button.bounds().centerY()));
        sleep(5000);
        // 等待离开任务列表页面
        var chestTips = common.waitForText("text", "点击查看以下商品开宝箱", true, 10);
        if (chestTips != null) {
            var woodChestNode = chestTips.parent().child(2).child(0);
            var ironChestNode = chestTips.parent().child(2).child(1);
            var goldChestNode = chestTips.parent().child(2).child(2);
            log(woodChestNode.child(1).text() + ": " + woodChestNode.child(2).text());
            log(ironChestNode.child(1).text() + ": " + ironChestNode.child(2).text());
            log(goldChestNode.child(1).text() + ": " + goldChestNode.child(2).text());
            var merchantListParent = chestTips.parent().parent().parent();  //商品从1开始
            var merchantIdx = 1;
            var merchantNums = [];
            var swipeHeight = merchantListParent.child(3).bounds().top - merchantListParent.child(1).bounds().top;
            var visitNum = woodChestNode.child(2).text().match(/\d+/);
            if (visitNum != null) {
                merchantNums.push(parseInt(visitNum[0]));
            }
            visitNum = ironChestNode.child(2).text().match(/\d+/);
            if (visitNum != null) {
                merchantNums.push(parseInt(visitNum[0]));
            }
            visitNum = goldChestNode.child(2).text().match(/\d+/);
            if (visitNum != null) {
                merchantNums.push(parseInt(visitNum[0]));
            }
            for (var j = 0; j < merchantNums.length; j++) {
                for (var k = 0; k < merchantNums[j]; k++) {
                    var merchantNode = merchantListParent.child(merchantIdx);
                    log("点击 [" + merchantIdx + "/" + (merchantListParent.childCount() - 1) + "]" + merchantNode.child(1).child(0).text() + ": " + merchantNode.click());
                    var tmp = common.waitDismiss("text", "点击查看以下商品开宝箱", 10);
                    if (tmp == false) {
                        log("WaitDismiss fail");
                        commonAction.backToAppMainPage();
                        return true;
                    }

                    back();
                    var tips = common.waitForText("text", "逛好物开宝箱", true, 10);
                    if (tips == null) {
                        log("WaitForText fail");
                        commonAction.backToAppMainPage();
                        return true;
                    }

                    if (merchantIdx % 2 == 0) { //merchantIdx为奇数点左侧商品，merchantIdx为偶数点右侧商品并上划屏幕
                        log("上划屏幕: " + swipe(device.width / 2, Math.floor(device.height * 7 / 8), device.width / 2, Math.floor(device.height * 7 / 8) - swipeHeight, 500));
                        if (merchantIdx >= merchantListParent.childCount() - 1) {
                            sleep(5000);    //一开始只加载了20个商品
                            merchantListParent = chestTips.parent().parent().parent();
                            log("新商品列表个数: " + merchantListParent.childCount() - 1);
                        } else {
                            sleep(1000);
                        }
                    }
                    merchantIdx = merchantIdx + 1;
                }

                var openTips = text("打开看看～").findOne(1000);
                if (openTips != null) {
                    log("点击 打开看看～: " + openTips.parent().click());
                    sleep(3000);
                    var continueTips = text("继续逛商品").findOne(1000);
                    if (continueTips != null) {
                        log("点击 继续逛商品: " + continueTips.parent().click());
                        sleep(3000);
                    }
                }
            }
            //回到任务列表
            back();
            sleep(3000);
            ret = true;
            break;
        } else {
            if (textContains("考拉豆可用于").findOne(3000) == null) {
                //回到任务列表
                back();
                sleep(3000);
            }
        }
    }
    return ret;
}

kaolaBeanSignIn.doSignIn = function () {
    toastLog("doSignIn");

    var actionBar = commonAction.gotoKaolaBean();
    if (actionBar == null) {
        commonAction.backToAppMainPage();
        return false;
    }

    sleep(3000);
    var beanNumNode = actionBar.child(3).child(actionBar.child(3).childCount() - 1).child(0);
    toastLog("当前考拉豆: " + beanNumNode.text());
    var earnBtnParent = actionBar.child(4).child(actionBar.child(4).childCount() - 1);
    var earnBtn = earnBtnParent.child(earnBtnParent.childCount() - 1);
    var feedOnceBtn = earnBtnParent.child(0);
    var feed10TimesBtn = actionBar.child(4).child(0).child(0);

    var signInTips = text("每日签到").findOne(1000);
    if (signInTips != null) {
        log("点击 每日签到: " + signInTips.parent().click());
        sleep(3000);
        var iKnownTips = text("我知道了").findOne(1000);
        if (iKnownTips != null) {
            log("点击 我知道了: " + iKnownTips.click());
            sleep(1000);
        }
    }

    var startTick = new Date().getTime();
    var triedTaskNames = [];
    var jobAllDone = false;
    for (;!jobAllDone;) {
        var clickRet = earnBtn.click();
        toastLog("点击 赚豆: " + clickRet);
        sleep(2000);

        var beanTaskTips = common.waitForTextMatches(/考拉豆可用于.*/, true, 15);
        if (beanTaskTips == null) {
            commonAction.backToAppMainPage();
            return false;
        }

        var getTips = text("立即领取").findOne(1000);
        if (getTips != null) {
            log("点击 立即领取: " + getTips.parent().click());
            sleep(1000);
        }

        var closeBtn = beanTaskTips.parent().child(beanTaskTips.parent().childCount() - 1);
        for (;;) {
            var doneTaskList = [];  //已完成的任务，领取就行
            var oneWalkTaskList = [];  //逛逛会场、关注商品任务列表，待够时间回来
            var merchantWalkTaskList = [];  //逛商品开箱子
    
            var totalTasks = [];
            var validTaskNames = [];
            var taskListNode = beanTaskTips.parent().child(3);
            var swipeHeight = taskListNode.child(6).bounds().top - taskListNode.child(0).bounds().top;
            for (var i = 0; i < taskListNode.childCount();) {
                var taskItem = {};
                taskItem.Title = taskListNode.child(i+1).text();
                if (taskListNode.child(i+2).className() == "android.view.View") {
                    taskItem.Tips = taskListNode.child(i+2).text();
                    taskItem.Button = taskListNode.child(i+5).child(0);
                    if (taskListNode.child(i+5).child(0).childCount() == 0) {
                        taskItem.BtnName = taskListNode.child(i+5).child(0).text();
                    } else {
                        taskItem.BtnName = taskListNode.child(i+5).child(0).child(0).child(1).text();
                    }
                    totalTasks.push(taskItem);
                    log(i + ": " + taskItem.Title + ", " + taskItem.Tips + ", " + taskItem.BtnName);
                    i = i + 6;
                } else if (taskListNode.child(i+2).className() == "android.widget.Image") {
                    taskItem.Tips = "";
                    taskItem.Button = taskListNode.child(i+4).child(0);
                    if (taskListNode.child(i+4).child(0).childCount() == 0) {
                        taskItem.BtnName = taskListNode.child(i+4).child(0).text();
                    } else {
                        taskItem.BtnName = taskListNode.child(i+4).child(0).child(0).child(1).text();
                    }
                    totalTasks.push(taskItem);
                    log(i + ": " + taskItem.Title + ", " + taskItem.BtnName);
                    i = i + 5;
                }
    
                if (taskItem.Button.bounds().height() > 40) {
                    validTaskNames.push(taskItem.Title);
                }
            }
    
            toastLog("任务数: " + totalTasks.length + ", 可见: " + validTaskNames.length + ", " + validTaskNames);
            if (totalTasks.length == 0) {
                captureScreen("/sdcard/Download/" + (new Date().Format("yyyy-MM-dd HH:mm:ss")) + ".png");
                break;
            }
    
            totalTasks.forEach(function (tv) {
                if (tv.BtnName.indexOf("下单") == -1 &&
                    tv.Tips.indexOf("下单") == -1 && 
                    tv.BtnName.indexOf("邀请") == -1 && 
                    tv.BtnName.indexOf("已完成") == -1) {
                    if (tv.BtnName == "可领取") {
                        doneTaskList.push(tv);
                        log("未完成任务" + (doneTaskList.length + oneWalkTaskList.length) + ": " + tv.Title + ", " + tv.BtnName + ", (" + tv.Button.bounds().centerX() + ", " + tv.Button.bounds().centerY() + "), " + tv.Tips);
                    } else {
                        if (triedTaskNames.indexOf(tv.Title) == -1) {
                            if (tv.Tips.indexOf("最高可领") != -1) {
                                merchantWalkTaskList.push(tv);
                            } else {
                                oneWalkTaskList.push(tv);
                            }
                            log("未完成任务" + (doneTaskList.length + oneWalkTaskList.length + merchantWalkTaskList.length) + ": " + tv.Title + ", " + tv.BtnName + ", (" + tv.Button.bounds().centerX() + ", " + tv.Button.bounds().centerY() + "), " + tv.Tips);
                        } else {
                            log("跳过失败任务: " + tv.Title + ", " + tv.BtnName + ", (" + tv.Button.bounds().centerX() + ", " + tv.Button.bounds().centerY() + "), " + tv.Tips);
                        }
                    }
                } else {
                    log("跳过任务: " + tv.Title + ", " + tv.BtnName + ", (" + tv.Button.bounds().centerX() + ", " + tv.Button.bounds().centerY() + "), " + tv.Tips);
                }
            });
    
            var uncompleteTaskNum = doneTaskList.length + oneWalkTaskList.length + merchantWalkTaskList.length;
            log("未完成任务数: " + uncompleteTaskNum);
            if (uncompleteTaskNum == 0) {
                log("关闭赚豆任务列表: " + closeBtn.click());
                sleep(2000);
                jobAllDone = true;
                break;
            }
    
            doneTaskList = common.filterTaskList(doneTaskList, validTaskNames);
            if (doneTaskList.length != 0) {
                log("点击 " + doneTaskList[0].BtnName + ": " + doneTaskList[0].Button.click());
                sleep(2000);
                log("关闭赚豆任务列表: " + closeBtn.click());
                sleep(2000);
                break;
            }
    
            merchantWalkTaskList = common.filterTaskList(merchantWalkTaskList, validTaskNames);
            if (doMerchantTasks(merchantWalkTaskList) != 0) {
                log("关闭赚豆任务列表: " + closeBtn.click());
                sleep(2000);
                break;
            }

            oneWalkTaskList = common.filterTaskList(oneWalkTaskList, validTaskNames);
            if (commonAction.doBrowseTasks(oneWalkTaskList, triedTaskNames)) {
                log("关闭赚豆任务列表: " + closeBtn.click());
                sleep(2000);
                break;
            }
    
            log("上划屏幕: " + swipe(device.width / 2, Math.floor(device.height * 7 / 8), device.width / 2, Math.floor(device.height * 7 / 8) - swipeHeight * validTaskNames.length, 500));
            // log("关闭赚豆任务列表: " + closeBtn.click());
            // sleep(2000);
    
            if (new Date().getTime() - startTick > 5 * 60 * 1000) {
                log("timeout");
                commonAction.backToAppMainPage();
                return false;
            }
        }
    }

    var beanNumNode = actionBar.child(3).child(actionBar.child(3).childCount() - 1).child(0);
    var beanNum = parseInt(beanNumNode.text())
    var batchFeedCount = Math.floor(beanNum / 20);
    var onceFeedCount = Math.floor((beanNum - batchFeedCount * 20) / 2);
    toastLog("当前考拉豆: " + beanNumNode.text() + ", 喂10次: " + batchFeedCount + ", 喂它: " + onceFeedCount);
    for (var i = 0; i < batchFeedCount; i++) {
        log("点击 喂10次:" + feed10TimesBtn.click());
        sleep(3000);
    }

    for (var i = 0; i < onceFeedCount; i++) {
        log("点击 喂它:" + feedOnceBtn.click());
        sleep(3000);
    }

    log("考拉豆: " + actionBar.child(3).child(actionBar.child(3).childCount() - 1).child(0).text() + ", 升级进度: " + actionBar.child(2).child(1).child(0).text());
    return true;
}

module.exports = kaolaBeanSignIn;