let teams = [];
let matches = [];
let scoreboard = {};

function addTeam() {
    const teamName = $('#teamName').val().trim();
    console.log(`Adding team: ${teamName}`); // Debug log
    if (teamName && !teams.includes(teamName)) {
        teams.push(teamName);
        scoreboard[teamName] = {
            played: 0,
            goalWins: 0,
            cornerWins: 0,
            drawn: 0,
            lost: 0,
            goalsFor: 0,
            goalsAgainst: 0,
            points: 0
        };
        $('#teamList').append(`<li>${teamName}</li>`);
        $('#teamName').val('');
        updateTeamFilter();
        generateMatches();
        updateScoreboard();
    } else {
        console.log(`Team not added. Either the name is empty or the team already exists.`);
    }
}

function updateTeamFilter() {
    const filter = $('#teamFilter');
    filter.empty();
    filter.append('<option value="">All Teams</option>');
    teams.forEach(team => {
        filter.append(`<option value="${team}">${team}</option>`);
    });
}

function generateMatches() {
    matches = [];
    for (let i = 0; i < teams.length; i++) {
        for (let j = i + 1; j < teams.length; j++) {
            matches.push({
                team1: teams[i],
                team2: teams[j],
                played: false,
                goals1: 0,
                goals2: 0,
                corners1: 0,
                corners2: 0,
                points1: 0,
                points2: 0
            });
        }
    }
    displayMatches();
    displayMatchResults();
}

function displayMatches() {
    let matchesHtml = '';
    matches.forEach((match, index) => {
        if (!match.played) {
            matchesHtml += `
                <div class="score-input">
                    <span>${match.team1}</span>
                    <input type="number" id="goals1_${index}" placeholder="Goals" min="0">
                    <input type="number" id="corners1_${index}" placeholder="Corners" min="0">
                    <span>vs</span>
                    <input type="number" id="goals2_${index}" placeholder="Goals" min="0">
                    <input type="number" id="corners2_${index}" placeholder="Corners" min="0">
                    <span>${match.team2}</span>
                    <button onclick="submitMatch(${index})">Submit</button>
                </div>
            `;
        }
    });
    $('#matches').html(matchesHtml);
}

function filterMatches() {
    const selectedTeam = $('#teamFilter').val();
    displayMatchResults(selectedTeam);
}

function displayMatchResults(filterTeam = '') {
    let resultsHtml = '';
    matches.forEach((match, index) => {
        if (!filterTeam || match.team1 === filterTeam || match.team2 === filterTeam) {
            let resultClass = '';
            if (match.played) {
                if (match.points1 > match.points2) {
                    resultClass = 'team1-win';
                } else if (match.points2 > match.points1) {
                    resultClass = 'team2-win';
                } else {
                    resultClass = 'draw';
                }
            }
            resultsHtml += `
                <div class="match-result ${resultClass}">
                    ${match.team1} ${match.goals1} - ${match.goals2} ${match.team2}
                    (Corners: ${match.corners1} - ${match.corners2})
                    <span class="points">Points: ${match.points1} - ${match.points2}</span>
                    <button onclick="editMatch(${index})">Edit</button>
                </div>
            `;
        }
    });
    $('#matchResults').html(resultsHtml);
}

function submitMatch(index) {
    const match = matches[index];
    const goals1 = parseInt($(`#goals1_${index}`).val()) || 0;
    const corners1 = parseInt($(`#corners1_${index}`).val()) || 0;
    const goals2 = parseInt($(`#goals2_${index}`).val()) || 0;
    const corners2 = parseInt($(`#corners2_${index}`).val()) || 0;

    updateMatchResult(index, goals1, corners1, goals2, corners2);
    displayMatches();
    filterMatches();
    updateScoreboard();
    checkTournamentEnd();
}

function editMatch(index) {
    const match = matches[index];
    $('#matches').html(`
        <div class="score-input">
            <span>${match.team1}</span>
            <input type="number" id="goals1_${index}" value="${match.goals1}" min="0">
            <input type="number" id="corners1_${index}" value="${match.corners1}" min="0">
            <span>vs</span>
            <input type="number" id="goals2_${index}" value="${match.goals2}" min="0">
            <input type="number" id="corners2_${index}" value="${match.corners2}" min="0">
            <span>${match.team2}</span>
            <button onclick="updateMatch(${index})">Update</button>
        </div>
    `);
}

function updateMatch(index) {
    const goals1 = parseInt($(`#goals1_${index}`).val()) || 0;
    const corners1 = parseInt($(`#corners1_${index}`).val()) || 0;
    const goals2 = parseInt($(`#goals2_${index}`).val()) || 0;
    const corners2 = parseInt($(`#corners2_${index}`).val()) || 0;

    updateMatchResult(index, goals1, corners1, goals2, corners2);
    displayMatches();
    filterMatches();
    updateScoreboard();
    checkTournamentEnd();
}

function updateMatchResult(index, goals1, corners1, goals2, corners2) {
    const match = matches[index];
    
    // If the match was already played, subtract the old stats
    if (match.played) {
        updateTeamStats(match.team1, -match.goals1, -match.goals2, -match.corners1, -match.corners2, -match.points1, true);
        updateTeamStats(match.team2, -match.goals2, -match.goals1, -match.corners2, -match.corners1, -match.points2, true);
    }

    // Update match data
    match.goals1 = goals1;
    match.corners1 = corners1;
    match.goals2 = goals2;
    match.corners2 = corners2;
    match.played = true;

    // Calculate points
    if (goals1 > goals2) {
        match.points1 = 3;
        match.points2 = 0;
    } else if (goals2 > goals1) {
        match.points1 = 0;
        match.points2 = 3;
    } else {
        if (corners1 > corners2) {
            match.points1 = 2;
            match.points2 = 0;
        } else if (corners2 > corners1) {
            match.points1 = 0;
            match.points2 = 2;
        } else {
            match.points1 = 1;
            match.points2 = 1;
        }
    }

    // Add the new stats
    updateTeamStats(match.team1, goals1, goals2, corners1, corners2, match.points1);
    updateTeamStats(match.team2, goals2, goals1, corners2, corners1, match.points2);
}

function updateTeamStats(team, goalsFor, goalsAgainst, corners, opponentCorners, points, isEdit = false) {
    const stats = scoreboard[team];
    if (!isEdit) stats.played += 1;
    stats.goalsFor += goalsFor;
    stats.goalsAgainst += goalsAgainst;
    stats.points += points;

    if (points === 3) {
        stats.goalWins += 1;
    } else if (points === 2) {
        stats.cornerWins += 1;
    } else if (points === 0) {
        stats.lost += 1;
    } else {
        stats.drawn += 1;
    }
}

function updateScoreboard() {
    let scoreboardHtml = '';
    Object.entries(scoreboard).sort((a, b) => b[1].points - a[1].points).forEach(([team, stats]) => {
        scoreboardHtml += `
            <tr>
                <td>${team}</td>
                <td>${stats.played}</td>
                <td>${stats.goalWins}</td>
                <td>${stats.cornerWins}</td>
                <td>${stats.drawn}</td>
                <td>${stats.lost}</td>
                <td>${stats.goalsFor}</td>
                <td>${stats.goalsAgainst}</td>
                <td>${stats.goalsFor - stats.goalsAgainst}</td>
                <td>${stats.points}</td>
            </tr>
        `;
    });
    $('#scoreboard tbody').html(scoreboardHtml);
}

function checkTournamentEnd() {
    if (matches.every(match => match.played)) {
        const sortedTeams = Object.entries(scoreboard).sort((a, b) => b[1].points - a[1].points);
        const finalists = sortedTeams.slice(0, 2);
        $('#final').html(`
            <h3>Final Match</h3>
            <p>${finalists[0][0]} vs ${finalists[1][0]}</p>
        `);
        displayPositions(sortedTeams);
    }
}

function displayPositions(sortedTeams) {
    let positionsHtml = '<ol>';
    sortedTeams.forEach(([team, stats]) => {
        positionsHtml += `<li>${team}</li>`;
    });
    positionsHtml += '</ol>';
    $('#positions').html(positionsHtml);
}
