$(window).bind("load", function() {
    let battleTags = getBattleTags();
    console.log(battleTags);
    displayStats(battleTags);
});

// Arguments: 
// - team: String, either 1, 2, or nothing for both teams
function getBattleTags(team) {
    team = team || '';
    let spans = $(".match-detail__players [class*='match-detail__players_team" + team + "'] p span:contains('#')");
    return spans.map(function(i, span) { return $.trim($(span).text().replace(/#/g, '-')); });
}

function displayStats(battleTags) {
    let team1Average = $("<p>Average SR: </p>");
    let team2Average = $("<p>Average SR: </p>");
    let team1TotalRank = 0, team1TotalRanked = 0;
    let team2TotalRank = 0, team2TotalRanked = 0;

    battleTags.map(function(i, battleTag) {
        let battleTagNoNumbers = battleTag.split('-')[0];
        let player = $(".match-detail__players .no-margin:contains('" + battleTagNoNumbers + "')");
        addBorder(player);

        getStats(battleTag, function(rank, rankImg, times) {
            if (rank) {
                if (isTeam1(player)) {
                    team1TotalRank += rank;
                    team1TotalRanked += 1;
                    updateAverageSR(team1Average, team1TotalRank / team1TotalRanked);
                } else {
                    team2TotalRank += rank;
                    team2TotalRanked += 1;
                    updateAverageSR(team2Average, team2TotalRank / team2TotalRanked);
                }
                displayRank(player, rank, rankImg);
            }
            if (times) {
                displayTimes(player, times);
            }
        });
    });

    $('.match-detail__players_team1 .player-stats').first().before(team1Average);
    $('.match-detail__players_team2 .player-stats').first().before(team2Average);
    addBorder(team1Average);
    addBorder(team2Average);
}

function addBorder(player) {
    player.wrap('<div class="player-stats"></div>');
    if (!player.parent().is(':last-child')) {
        let div = $('<div></div>');
        div.css({
            'border-bottom': '1px solid #6b67a7',
            'padding-bottom': '10px',
            'display': 'inline-block'
        });
        player.wrap(div);
    }
}

function getStats(battleTag, callback) {
    $.ajax({
        dataType: "json",
        url: 'https://owapi.net/api/v3/u/' + battleTag + '/blob',
        success: function(response) {
            console.log(response);
            callback(response.us.stats.competitive.overall_stats.comprank,
                     response.us.stats.competitive.overall_stats.tier_image,
                     response.us.heroes.playtime.competitive);
        },
        error: function(obj) {
            console.log(obj.responseTest);
        }
    });
}

function displayRank(player, rank, rankImg) {
    let span = player.find('span');
    if (isTeam1(player)) {
        span.text(span.text() + ' | ' + rank);
    } else {
        span.text(rank + ' | ' + span.text());
    }

    let img = player.find('img');
    img.attr('src', rankImg);
    img.width(32);
    img.height(32);
}

function displayTimes(player, times) {
    let timesArray = [];
    for (key in times) {
        if (times[key] > 0) {
            timesArray.push([key == 'soldier76' ? 'soldier-76' : key, times[key]]);
        }
    }

    timesArray.sort(function(pair1, pair2) { return pair2[1] - pair1[1]; });
    if (timesArray.length > 5) {
        timesArray = timesArray.slice(0, 5);
    }

    if (isTeam1(player)) {
        timesArray.forEach(function(pair) {
            player.after(getImgForHero(pair[0]));
        });
    } else {
        let current = player;
        timesArray.forEach(function(pair) {
            let img = getImgForHero(pair[0]);
            current.after(img);
            current = img;
        });
    }
}

function isTeam1(player) {
    return player.parents("[class*='team1']").length > 0;
}

function getImgForHero(hero) {
    let img = $('<img></img>');
    img.attr('src', 'https://blzgdapipro-a.akamaihd.net/hero/' + hero + '/icon-portrait.png');
    img.width(32);
    img.height(32);
    img.css({
        'border': '1px solid #471b9f',
        'border-radius': '2px'
    });
    return img;
}

function updateAverageSR(element, averageSR) {
    let currentText = element.text();
    if (currentText != 'Average SR: ') {
        currentText = 'Average SR: ';
    }
    element.text(currentText + Math.floor(averageSR));
}