$(window).bind("load", function() {
    let battleTags = getBattleTags();
    console.log(battleTags);
    displayStats(battleTags);
});

// Arguments: 
// - team: String, either 1, 2, or nothing for both teams
function getBattleTags(team) {
    team = team || '';
    let spans = $(".match-detail__players [class*='match-detail__players_team"
                  + team + "'] p span:contains('#')");
    return spans.map(function(i, span) {
        return $.trim($(span).text().replace(/#/g, '-'));
    });
}

function displayStats(battleTags) {
    let team1Average = $("<p>Average SR: </p>");
    let team2Average = $("<p>Average SR: </p>");
    let team1TotalRank = 0, team1TotalRanked = 0;
    let team2TotalRank = 0, team2TotalRanked = 0;

    battleTags.map(function(i, battleTag) {
        let player = getPlayer(battleTag);
        addBorder(player);
        setPlayerIcon(player, chrome.extension.getURL('../img/loading.gif'));

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

function getPlayer(battleTag) {
    let battleTagNoNumbers = battleTag.split('-')[0];
    return $(".match-detail__players .no-margin:contains('" + battleTagNoNumbers + "')");
}

function addBorder(player) {
    player.wrap('<div class="player-stats"></div>');
    if (!player.parent().is(':last-child')) {
        let div = $('<div></div>');
        div.css({
            'border-bottom': '1px solid #6b67a7',
            'padding': '10px 0px',
            'display': 'inline-block'
        });
        player.wrap(div);
    }
}

function isTeam1(player) {
    return player.parents("[class*='team1']").length > 0;
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
            console.log(obj.status);
            setPlayerIcon(getPlayer(battleTag), chrome.extension.getURL('../img/error.png'));
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

    setPlayerIcon(player, rankImg);
}

function setPlayerIcon(player, imgSrc, width = 32, height = 32) {
    let img = player.find('img');
    img.attr('src', imgSrc);
    img.width(width);
    img.height(height)
}

function displayTimes(player, allTimes) {
    let timePairs = [];
    for (key in allTimes) {
        if (allTimes[key] > 0) {
            timePairs.push([key == 'soldier76' ? 'soldier-76' : key, allTimes[key]]);
        }
    }
    timePairs.sort(function(pair1, pair2) { return pair2[1] - pair1[1]; });
    if (timePairs.length > 5) {
        timePairs = timePairs.slice(0, 5);
    }

    let times = timePairs.map(pair => pair[1]);
    let max = Math.max.apply(Math, times) // fuck javascript

    let current = player;
    timePairs.forEach(function(pair) {
        let size = normalize(12, 48, 0, max, pair[1]);
        let img = getImgForHero(pair[0], size);
        current.after(img);
        if (!isTeam1(player)) {
            current = img;
        }
    });
}

function normalize(min, max, imin, imax, i) {
    let x = i * (max - min) / (imax - imin);
    return x + min;
}

function getImgForHero(hero, size) {
    let img = $('<img></img>');
    img.attr('src',
             'https://blzgdapipro-a.akamaihd.net/hero/' + hero + '/icon-portrait.png');
    img.width(size);
    img.height(size);
    img.css({
        'border': '1px solid #471b9f',
        'border-radius': '2px',
        'vertical-align': 'bottom'
    });
    return img;
}

function updateAverageSR(element, averageSR) {
    element.text('Average SR: ' + Math.floor(averageSR));
}