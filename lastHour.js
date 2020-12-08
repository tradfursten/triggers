var https = require('https');

const SESSION = process.env.SESSION;
const MEMBERS = {
  206046: '@fferm',
  121922: '@per.w',
  1789: '@tradfursten',
  193725: '@malin',
  194085: '@h0yta',
  112890: '@zmuda',
  201343: '@lonneberg',
  124628: '@Johan Aschan',
  265568: '@patwik',
  253771: '<@UEH95JD7T>',
  11594: null,
  139397: '@tobbe',
  191081: '@rasmus',
  178288: null,
  194559: '@zugerto',
  217068: null,
  382041: null,
  674035: '@ljunge',
  52404: '<@UG0H9SC59>',
};
var leaderboard = [];

const opts = {
  headers: {
    cookie: 'session=' + SESSION,
  },
  host: 'adventofcode.com',
  path: '/2020/leaderboard/private/view/1789.json'
};

const yourWebHookURL = process.env.HOOK; // PUT YOUR WEBHOOK URL HERE
const userAccountNotification = {
  'username': 'AoC notifier', // This will appear as user name who posts the message
  'text': 'Senaste lösningarna:', // text
  'icon_emoji': ':christmas_tree:', // User icon, you can also use custom icons here
};

const blockMessage = {
	"blocks": [
		{
			"type": "section",
			"text": {
				"type": "mrkdwn",
				"text": "This is a section block with an overflow menu."
			},
			"accessory": {
				"type": "overflow",
				"options": [
					{
						"text": {
							"type": "plain_text",
							"text": "*this is plain_text text*",
							"emoji": true
						},
						"value": "value-0"
					},
					{
						"text": {
							"type": "plain_text",
							"text": "*this is plain_text text*",
							"emoji": true
						},
						"value": "value-1"
					},
					{
						"text": {
							"type": "plain_text",
							"text": "*this is plain_text text*",
							"emoji": true
						},
						"value": "value-2"
					},
					{
						"text": {
							"type": "plain_text",
							"text": "*this is plain_text text*",
							"emoji": true
						},
						"value": "value-3"
					},
					{
						"text": {
							"type": "plain_text",
							"text": "*this is plain_text text*",
							"emoji": true
						},
						"value": "value-4"
					}
				],
				"action_id": "overflow-action"
			}
		}
	]
}

function sendSlackMessage (webhookURL, messageBody) {
  // make sure the incoming message body can be parsed into valid JSON
  try {
    messageBody = JSON.stringify(messageBody);
  } catch (e) {
    throw new Error('Failed to stringify messageBody', e);
  }

  // Promisify the https.request
  return new Promise((resolve, reject) => {
    // general request options, we defined that it's a POST request and content is JSON
    const requestOptions = {
      method: 'POST',
      header: {
        'Content-Type': 'application/json'
      }
    };

    // actual request
    const req = https.request(webhookURL, requestOptions, (res) => {
      let response = '';


      res.on('data', (d) => {
        response += d;
      });

      // response finished, resolve the promise with data
      res.on('end', () => {
        resolve(response);
      })
    });

    // there was an error, reject the promise
    req.on('error', (e) => {
      reject(e);
    });

    // send our message body (was parsed to JSON beforehand)
    req.write(messageBody);
    req.end();
  });
}

callback = function(response) {
  var str = '';

  //another chunk of data has been received, so append it to `str`
  response.on('data', function (chunk) {
    str += chunk;
  });

  //the whole response has been received, so we just print it out here
  response.on('end', function () {
    console.log(str);
    var body = JSON.parse(str);
    const solvedLastHour = [];

    const lastInvokation = new Date();
    lastInvokation.setHours(lastInvokation.getHours() - 5);

    Object.keys(body.members).forEach((it) => {
      const member = body.members[it];
      var nick = MEMBERS[member.id] || member.name;
      var lastStar = new Date(0);
      lastStar.setUTCSeconds(member.last_star_ts);
      leaderboard.push({ id: it, name: nick, points: member.local_score });
      if (lastStar > lastInvokation) {
        Object.keys(member.completion_day_level).forEach((day) => {
          if (member.completion_day_level[day]['1']) {
            const day1Star = new Date(0);
            day1Star.setUTCSeconds(
              member.completion_day_level[day]['1'].get_star_ts
            );
            if (day1Star > lastInvokation) {
              solvedLastHour.push({
                message: `${nick} klarade dag ${day} del 1 ${day1Star.toDateString()} ${
                  day1Star.toTimeString().split(' ')[0]
                }`,
                user: nick,
                time: day1Star,
              });
            }
          }
          if (member.completion_day_level[day]['2']) {
            const day2Star = new Date(0);
            day2Star.setUTCSeconds(
              member.completion_day_level[day]['2'].get_star_ts
            );
            if (day2Star > lastInvokation) {
              solvedLastHour.push({
                message: `${nick} klarade dag ${day} del 2 ${day2Star.toDateString()} ${
                  day2Star.toTimeString().split(' ')[0]
                }`,
                user: nick,
                time: day2Star,
              });
            }
          }
        });
      }
    });

    leaderboard.sort((a, b) => {
      return b.points - a.points;
    });

    solvedLastHour.sort((a, b) => {
      return a.time - b.time;
    });

    const r = {
      leaderboard: leaderboard
        .map((it) => `${it.name} poäng: ${it.points}`)
        .join('\n'),
      recent: solvedLastHour.map((it) => it.message).join('\n'),
    };
    console.log(r);
    if (r.recent) {
      userAccountNotification.text = 'Senaste lösningarna:\n' + r.recent;
      userAccountNotification.blocks = []
      userAccountNotification.blocks.push({
        "type": "section",
        "text": {
          "type": "mrkdwn",
          "text": "Lösningar från: "+solvedLastHour.map((it)=> it.user).join(" ")
        },
        "accessory": {
          "type": "overflow",
          "options": solvedLastHour.map((it) => {
            return {
              "text": {
                "type": "plain_text",
                "text": it.message,
                "emoji": true
              },
              "value": ""+Math.random()
            }
        })
      
        }
      })
      console.log(JSON.stringify(userAccountNotification.blocks))
      const slackResponse = sendSlackMessage(
        yourWebHookURL,
        userAccountNotification
      ).then((response) => console.log(response));

    }
    return r;
  })
}



https.request(opts, callback).end()