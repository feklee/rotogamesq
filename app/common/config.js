// Common configuration, for client and server.

/*jslint browser: true, maxlen: 80 */

/*global define, require, module */

var commonDefine;
try {
    commonDefine = define;
} catch (ignore) {
    commonDefine = require("amdefine")(module);
}

commonDefine({
    boards: [ // shown in the specified order, from left to right
        {
            name: "sapple:2016",
            sideLenT: 5,
            startPosT: [15, 95],
            endPosT: [10, 95],
            start: "11-13"
        },
        {
            name: "cat:2016",
            sideLenT: 7,
            startPosT: [19, 144],
            endPosT: [12, 144],
            start: "11-13"
        },
        // {
        //     name: "pumpkins:2016",
        //     sideLenT: 5,
        //     startPosT: [27, 78],
        //     endPosT: [5, 78],
        //     start: "10-26"
        // },
        // {
        //     name: "pumpkinm:2016",
        //     sideLenT: 6,
        //     startPosT: [27, 72],
        //     endPosT: [6, 72],
        //     start: "10-26"
        // },
        // {
        //     name: "flower:2016",
        //     sideLenT: 5,
        //     startPosT: [45, 45],
        //     endPosT: [5, 45],
        //     start: "03-16"
        // },
        // {
        //     name: "bfly:2016",
        //     sideLenT: 7,
        //     startPosT: [35, 50],
        //     endPosT: [7, 50],
        //     start: "04-02"
        // },
        {
            name: "mushroom:2016",
            sideLenT: 7,
            startPosT: [35, 65],
            endPosT: [14, 50],
            start: "10-26"
        },
        // {
        //     name: "ebunny:2016",
        //     sideLenT: 5,
        //     startPosT: [40, 45],
        //     endPosT: [15, 45],
        //     start: "03-16"
        // },
        // {
        //     name: "20:2015a",
        //     sideLenT: 6,
        //     startPosT: [6, 155],
        //     endPosT: [0, 155],
        //     start: "12-31"
        // },
        // {
        //     name: "16:2015",
        //     sideLenT: 5,
        //     startPosT: [5, 161],
        //     endPosT: [0, 161],
        //     start: "12-31"
        // },
        // {
        //     name: "pumpkin:2015",
        //     sideLenT: 7,
        //     startPosT: [0, 65],
        //     endPosT: [7, 65],
        //     start: "10-30"
        // },
        // {
        //     name: "pumpkins:2015",
        //     sideLenT: 5,
        //     startPosT: [0, 78],
        //     endPosT: [5, 78],
        //     start: "10-30"
        // },
        // {
        //     name: "logo:2015a",
        //     sideLenT: 5,
        //     startPosT: [37, 0],
        //     endPosT: [17, 0],
        //     start: "03-31"
        // },
        // {
        //     name: "20:2015",
        //     sideLenT: 6,
        //     startPosT: [6, 144],
        //     endPosT: [0, 144],
        //     start: "01-01"
        // },
        // {
        //     name: "15:2015",
        //     sideLenT: 5,
        //     startPosT: [5, 150],
        //     endPosT: [0, 150],
        //     start: "01-01"
        // },
        // {
        //     name: "house",
        //     sideLenT: 7,
        //     startPosT: [0, 10],
        //     endPosT: [7, 10],
        //     start: "04-01",
        //     duration: 330
        // },
        {
            name: "spiral:2013-12-31:2014-01-31",
            sideLenT: 6,
            startPosT: [6, 100],
            endPosT: [0, 100],
            start: "12-31",
            duration: 31
        },
        {
            name: "smiley",
            sideLenT: 5,
            startPosT: [0, 5],
            endPosT: [5, 5],
            start: "03-01",
            duration: 330
        },
        {
            name: "rgbcmy",
            sideLenT: 6,
            startPosT: [0, 17],
            endPosT: [6, 17],
            start: "05-01",
            duration: 330
        },
        {
            name: "race:2014",
            sideLenT: 7,
            startPosT: [0, 38],
            endPosT: [7, 38],
            start: "12-03"
        },
        {
            name: "star:2015",
            sideLenT: 7,
            startPosT: [23, 23],
            endPosT: [16, 23],
            start: "01-22"
        },
        {
            name: "chess",
            sideLenT: 8,
            startPosT: [0, 23],
            endPosT: [8, 23],
            start: "02-01",
            duration: 330
        },
        {
            name: "logo:2015b",
            sideLenT: 5,
            startPosT: [37, 5],
            endPosT: [17, 0],
            start: "12-31"
        },
        // {
        //     name: "pumpkinm:2015",
        //     sideLenT: 6,
        //     startPosT: [0, 72],
        //     endPosT: [6, 72],
        //     start: "10-30"
        // },
        // {
        //     name: "flower:2015",
        //     sideLenT: 5,
        //     startPosT: [35, 45],
        //     endPosT: [5, 45],
        //     start: "03-31"
        // },
        // {
        //     name: "ebunny:2015",
        //     sideLenT: 5,
        //     startPosT: [30, 45],
        //     endPosT: [15, 45],
        //     start: "03-31"
        // },
        // {
        //     name: "mask:2015",
        //     sideLenT: 5,
        //     startPosT: [10, 106],
        //     endPosT: [0, 106],
        //     start: "02-05"
        // },
        // {
        //     name: "freak:2015",
        //     sideLenT: 6,
        //     startPosT: [12, 111],
        //     endPosT: [0, 111],
        //     start: "02-05"
        // },
        // {
        //     name: "hppyclwn:2015",
        //     sideLenT: 8,
        //     startPosT: [24, 124],
        //     endPosT: [0, 124],
        //     start: "02-05"
        // },
        // {
        //     name: "logo:2015",
        //     sideLenT: 5,
        //     startPosT: [32, 0],
        //     endPosT: [17, 0],
        //     start: "01-01"
        // },
        // {
        //     name: "xmastree:2014",
        //     sideLenT: 7,
        //     startPosT: [21, 31],
        //     endPosT: [14, 38],
        //     start: "12-23"
        // },
        // {
        //     name: "santa:2014",
        //     sideLenT: 6,
        //     startPosT: [18, 83],
        //     endPosT: [0, 83],
        //     start: "12-03"
        // },
        // {
        //     name: "firtree:2014",
        //     sideLenT: 5, // px
        //     startPosT: [22, 72], // position of upper left corner of start
        //                          // tiles in boards sprites
        //     endPosT: [12, 72],
        //     start: "12-03"
        // },
        // {
        //     name: "pumpkin:2014",
        //     sideLenT: 7,
        //     startPosT: [0, 65],
        //     endPosT: [7, 65],
        //     start: "10-31",
        //     duration: 40
        // },
        // {
        //     name: "pumpkins:2014",
        //     sideLenT: 5,
        //     startPosT: [0, 78],
        //     endPosT: [5, 78],
        //     start: "10-31",
        //     duration: 25
        // },
        // {
        //     name: "bee:2014",
        //     sideLenT: 8,
        //     startPosT: [16, 57],
        //     endPosT: [8, 57],
        //     start: "08-06"
        // },
        // {
        //     name: "ebunny:2014",
        //     sideLenT: 5,
        //     startPosT: [20, 45],
        //     endPosT: [15, 45],
        //     start: "04-18"
        // },
        // {
        //     name: "flower:2014",
        //     sideLenT: 5,
        //     startPosT: [25, 45],
        //     endPosT: [5, 45],
        //     start: "04-18"
        // },
        // {
        //     name: "mask",
        //     sideLenT: 5,
        //     startPosT: [5, 106],
        //     endPosT: [0, 106],
        //     start: "02-26",
        //     duration: 31
        // },
        // {
        //     name: "freak",
        //     sideLenT: 6,
        //     startPosT: [6, 111],
        //     endPosT: [0, 111],
        //     start: "02-26",
        //     duration: 31
        // },
        // {
        //     name: "hppyclwn",
        //     sideLenT: 8,
        //     startPosT: [16, 124],
        //     endPosT: [0, 124],
        //     start: "02-26",
        //     duration: 31
        // },
        // {
        //     name: "20:2013-12-31:2014-01-31",
        //     sideLenT: 6,
        //     startPosT: [6, 89],
        //     endPosT: [0, 89],
        //     start: "12-31",
        //     duration: 31
        // },
        // {
        //     name: "14:2013-12-31:2014-01-31",
        //     sideLenT: 5,
        //     startPosT: [5, 95],
        //     endPosT: [0, 95],
        //     start: "12-31",
        //     duration: 31
        // },
        // {
        //     name: "logo:2013-12-31:2014-01-31",
        //     sideLenT: 5,
        //     startPosT: [22, 0],
        //     endPosT: [17, 0],
        //     start: "12-31",
        //     duration: 31
        // },
        // {
        //     name: "mushroom:2014",
        //     sideLenT: 7,
        //     startPosT: [21, 65],
        //     endPosT: [14, 50],
        //     start: "08-06"
        // },
        // {
        //     name: "logo:2014",
        //     sideLenT: 5,
        //     startPosT: [27, 0],
        //     endPosT: [17, 0],
        //     start: "08-06"
        // },
        // {
        //     name: "firtree:2013-12-24:2013-12-31",
        //     sideLenT: 5, // px
        //     startPosT: [22, 77], // position of upper left corner of start
        //                          // tiles in boards sprites
        //     endPosT: [12, 72],
        //     start: "12-24",
        //     duration: 7
        // },
        // {
        //     name: "firtree:2013-12-14:2013-12-24",
        //     sideLenT: 5, // px
        //     startPosT: [22, 72], // position of upper left corner of start
        //                          // tiles in boards sprites
        //     endPosT: [12, 72],
        //     start: "12-14",
        //     duration: 10
        // },
        // {
        //     name: "xmastree:2013-12-11:2013-12-31",
        //     sideLenT: 7,
        //     startPosT: [21, 38],
        //     endPosT: [14, 38],
        //     start: "12-11",
        //     duration: 22
        // },
        // {
        //     name: "firtree:2013-12-01:2013-12-11",
        //     sideLenT: 5, // px
        //     startPosT: [17, 72], // position of upper left corner of start
        //                          // tiles in boards sprites
        //     endPosT: [12, 72],
        //     start: "12-01",
        //     duration: 31
        // },
        // {
        //     name: "pumpkin",
        //     sideLenT: 7,
        //     startPosT: [0, 65],
        //     endPosT: [7, 65],
        //     start: "10-31",
        //     duration: 40
        // },
        // {
        //     name: "pumpkins",
        //     sideLenT: 5,
        //     startPosT: [0, 78],
        //     endPosT: [5, 78],
        //     start: "10-31",
        //     duration: 25
        // },
        // {
        //     name: "bee",
        //     sideLenT: 8,
        //     startPosT: [0, 57],
        //     endPosT: [8, 57]
        // },
        // {
        //     name: "ebunny",
        //     sideLenT: 5,
        //     startPosT: [10, 45],
        //     endPosT: [15, 45]
        // },
        // {
        //     name: "bfly",
        //     sideLenT: 7,
        //     startPosT: [0, 50],
        //     endPosT: [7, 50]
        // },
        // {
        //     name: "flower",
        //     sideLenT: 5,
        //     startPosT: [0, 45],
        //     endPosT: [5, 45]
        // },
        // {
        //     name: "20",
        //     sideLenT: 6,
        //     startPosT: [14, 10],
        //     endPosT: [14, 16],
        //     start: "01-01",
        //     duration: 330
        // },
        // {
        //     name: "13",
        //     sideLenT: 5,
        //     startPosT: [0, 0],
        //     endPosT: [5, 0],
        //     start: "2013-01-01",
        //     duration: 330
        // },
        // {
        //     name: "xmastree",
        //     sideLenT: 7,
        //     startPosT: [14, 31],
        //     endPosT: [14, 38]
        // },
        // {
        //     name: "nikolaus",
        //     sideLenT: 5,
        //     startPosT: [12, 5],
        //     endPosT: [17, 5]
        // },
        // {
        //     name: "psycclwn",
        //     sideLenT: 8,
        //     startPosT: [16, 124],
        //     endPosT: [8, 124],
        //     start: "02-26",
        //     duration: 31
        // },
        // {
        //     name: "jester",
        //     sideLenT: 7,
        //     startPosT: [7, 117],
        //     endPosT: [0, 117],
        //     start: "02-26",
        //     duration: 31
        // },
        // {
        //     name: "logo",
        //     sideLenT: 5,
        //     startPosT: [12, 0],
        //     endPosT: [17, 0],
        //     start: "06-01",
        //     duration: 330
        // },
        // {
        //     name: "star",
        //     sideLenT: 7,
        //     startPosT: [0, 31],
        //     endPosT: [7, 31],
        //     start: "07-01",
        //     duration: 330
        // },
        // {
        //     name: "race",
        //     sideLenT: 7,
        //     startPosT: [0, 38],
        //     endPosT: [7, 38],
        //     start: "08-01",
        //     duration: 330
        // },
        // {
        //     name: "pumpkinm",
        //     sideLenT: 6,
        //     startPosT: [0, 72],
        //     endPosT: [6, 72],
        //     start: "10-31"
        //     duration: 25
        // },
        // {
        //     name: "mushroom",
        //     sideLenT: 7,
        //     startPosT: [14, 65],
        //     endPosT: [14, 50],
        //     start: "11-22",
        //     duration: 25
        // }
        // {
        //     name: "santa:2013-12-06:2013-12-24",
        //     sideLenT: 6,
        //     startPosT: [6, 83],
        //     endPosT: [0, 83],
        //     start: "12-06",
        //     duration: 18
        // },
        // {
        //     name: "santa:2013-12-24:2013-12-31",
        //     sideLenT: 6,
        //     startPosT: [12, 83],
        //     endPosT: [0, 83],
        //     start: "12-24",
        //     duration: 7
        // },
        // {
        //     name: "bfly:2014",
        //     sideLenT: 7,
        //     startPosT: [21, 50],
        //     endPosT: [7, 50]
        // },
        // {
        //     name: "tree:2014",
        //     sideLenT: 7,
        //     startPosT: [7, 132],
        //     endPosT: [0, 132],
        //     start: "08-06"
        // },
        // {
        //     name: "pumpkinm:2014",
        //     sideLenT: 6,
        //     startPosT: [0, 72],
        //     endPosT: [6, 72],
        //     start: "10-31",
        //     duration: 25
        // }
        // {
        //     name: "apple",
        //     sideLenT: 5,
        //     startPosT: [15, 78],
        //     endPosT: [10, 78],
        //     start: "11-22",
        //     duration: 25
        // },
        // {
        //     name: "santas:2014",
        //     sideLenT: 5,
        //     startPosT: [5, 139],
        //     endPosT: [0, 139],
        //     start: "12-23"
        // },
        // {
        //     name: "psycclwn:2015",
        //     sideLenT: 8,
        //     startPosT: [24, 124],
        //     endPosT: [8, 124],
        //     start: "02-05"
        // },
        // {
        //     name: "jester:2015",
        //     sideLenT: 7,
        //     startPosT: [14, 117],
        //     endPosT: [0, 117],
        //     start: "02-05",
        //     duration: 31
        // },
        // {
        //     name: "bfly:2015",
        //     sideLenT: 7,
        //     startPosT: [28, 50],
        //     endPosT: [7, 50]
        // },
        {
            name: "jester:2016",
            sideLenT: 7,
            startPosT: [21, 117],
            endPosT: [0, 117],
            start: "10-29"
        },
        // {
        //     name: "pumpkin:2016",
        //     sideLenT: 7,
        //     startPosT: [28, 65],
        //     endPosT: [7, 65],
        //     start: "10-26"
        // }
        {
            name: "giraffe:2016",
            sideLenT: 7,
            startPosT: [27, 16],
            endPosT: [20, 16],
            start: "11-13"
        }
    ]
});
