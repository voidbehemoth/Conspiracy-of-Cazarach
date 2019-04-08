const csv = require('csv-parser');
const fs = require('fs');
let roles = {};

fs.createReadStream(__dirname + '/../public_files/data/roles.csv')
    .pipe(csv())
    .on('data', (row) => {
        // All data processing goes here
        roles[row.Name] = {
            // The name of a role (ex: "Godfather")
            Name: row.Name,
            // The faction of a role (ex: Agency)
            Faction: row.Faction,
            // The category of a role (ex: Killing). Used primarily for generating role lists.
            Category: row.Category,
            // Whether the role is unique. A unique role will only appear once in each game.
            Unique: (row.Unique == "TRUE"),
            // The list of traits the role has. A trait is always active
            Traits: row.Traits.split(";"),
            // The list of abilities a role has. An ability has to be activated.
            Abilities: row.Abilities.split(";"), // Might scrap abilities and traits, maybe just hard code certain roles?
            // A brief description of the role. Doesn't go into detail about mechanics, but gives the player the gist of what their role is.
            Description: row.Description,
            // A detailed description of how the role works
            Functionality: row.Functionality,
            // The attack a role has. It can either be: None, Basic, Powerful or Unstoppable
            Attack: row.Attack,
            // The attack a role has. It can either be: None, Basic, Powerful or Invincible
            Defense: row.Defense
        };
    })
    .on('end', () => {
        console.log('CSV file processed')
        // console.log(getIntroRoleList());
        // console.log(getRoleInfo("Guardian"));
        module.exports.allRoles = roles;
        module.exports.getRandomRole = getElliotRole;
    })
// Gets an object with all agency roles in it.
function getAgencyRoles() {
    const agencyRoles = {};
    for (const roleName in roles) {
        if (roles[roleName].Faction === "Agency") {
            agencyRoles[roleName] = roles[roleName];
        }
    }
    return agencyRoles;
}
// Gets an object with all village roles in it.
function getVillageRoles() {
    const villageRoles = {};
    for (const roleName in roles) {
        if (roles[roleName].Faction === "Village") {
            villageRoles[roleName] = roles[roleName];
        }
    }
    return villageRoles;
}
// Gets an object with all bandit roles in it.
function getBanditRoles() {
    const banditRoles = {};
    for (const roleName in roles) {
        if (roles[roleName].Faction === "Bandits") {
            banditRoles[roleName] = roles[roleName];
        }
    }
    return banditRoles;
}
// Gets an object with all invasion roles in it.
function getInvasionRoles() {
    const invasionRoles = {};
    for (const roleName in roles) {
        if (roles[roleName].Faction === "Invasion") {
            invasionRoles[roleName] = roles[roleName];
        }
    }
    return invasionRoles;
}
// Gets an object with all neutral roles in it.
function getNeutralRoles() {
    const neutralRoles = {};
    for (const roleName in roles) {
        if (roles[roleName].Faction === "Neutral") {
            neutralRoles[roleName] = roles[roleName];
        }
    }
    return neutralRoles;
}
// Gets a role list using the classic gamemode.
function getClassicRoleList() {
    // The list of roles to return.
    var classicRoles = {};
    // Variables for easy access to role lists.
    const agencyRoles = getAgencyRoles();
    const villageRoles = getVillageRoles();
    const banditRoles = getBanditRoles();
    const invasionRoles = getInvasionRoles();
    const neutralRoles = getNeutralRoles();

    classicRoles[0] = getRandomOfCategory(agencyRoles, "Adept", classicRoles);
    classicRoles[1] = getRandomOfCategory(agencyRoles, "Adept", classicRoles);
    classicRoles[2] = getRandomOfCategory(agencyRoles, "Special Ops.", classicRoles);
    classicRoles[3] = getRandomOfCategory(villageRoles, "Support", classicRoles);
    classicRoles[4] = getRandomOfCategory(villageRoles, "Support", classicRoles);
    classicRoles[5] = getRandomOfCategory(villageRoles, "Protective", classicRoles);
    classicRoles[6] = getRandomOfCategory(villageRoles, "Killing", classicRoles);
    classicRoles[7] = getRandomOfCategory(villageRoles, "Any", classicRoles);
    classicRoles[8] = getRandomOfCategory(villageRoles, "Any", classicRoles);
    classicRoles[9] = getRandomOfCategory(banditRoles, "Decisive", classicRoles);
    classicRoles[10] = getRandomOfCategory(banditRoles, "Minion", classicRoles);
    classicRoles[11] = getRandomOfCategory(banditRoles, "Specialist", classicRoles);
    classicRoles[12] = getRandomOfCategory(invasionRoles, "Messenger", classicRoles);
    classicRoles[13] = getRandomOfCategory(neutralRoles, "Any", classicRoles);
    classicRoles[14] = getRandomOfCategory("Any", "Any", classicRoles);

    return classicRoles;
}

// The main function. We use this to get a random role from a specified object. 
// The first parameter specifies the object that we want to pull from. We can use this to specify a faction.
// We can (instead of passing an object) pass in the string "Any" to get a random role out of all of the possible roles.
// The second parameter (which we call "cat") specifies the category to select roles from.
// The current list of catagories are: Adept, Special Ops., Support, Protective, Killing, Detrimental, Decisive, Minion, Specialist, Messenger and Evil.
// We can instead pass in "Any" to select a role from the entire object.
// Passing in "Any" for out object completely ignores the category parameter. (Which might be changed in the future).
// The third parameter is mainObj. It is simply the object that we use to keep track of what we've already added. So for example in the getClassicRoleList() function we use the classicRoles object.
// The fourth parameter is excludeRoles. You pass in an array, with each value being a role name. It will exclude all roles you pass in from the possible roles to choose from.
// excludeRoles is completely optional.
function getRandomOfCategory(obj, cat, mainObj, excludeRoles) {
    // The list of roles to randomly select from.
    const catList = {};
    // To handle catList and make sure it works properly. Probably not needed but I'd rather be safe than sorry.
    var x = 0;
    // To handle whether a role is in the game yet or not.
    var inGame = false;
    // Checks if you replaced your object with "Any"
    if (obj === "Any") {
        // Iterates through all roles possible in the entire game.
        for (const roleName in roles) {
            // Checks if the role currently in iteration is unique. There may only be one copy of a unique role in each game.
            if (roles[roleName].Unique === true) {
                // Iterates through all roles already in the game.
                for (const key in mainObj) {
                    // Checks if the role in iteration is already in the game.
                    if (roles[roleName].Name === mainObj[key].Name) {
                        inGame = true;
                    }
                }
                // Checks if role isn't already in the game.
                if (!(inGame)) {
                    if (!(excludeRoles == null)) {
                        if (!(excludeRoles.includes(roles[roleName].Name))) {
                            catList[x] = roles[roleName];
                            x++; 
                        }
                    } else {
                        catList[x] = roles[roleName];
                        x++; 
                    }
                }
            } else {
                if (!(roles[roleName].Unique)) {
                    if (!(excludeRoles == null)) {
                        if (!(excludeRoles.includes(roles[roleName].Name))) {
                            catList[x] = roles[roleName];
                            x++; 
                        }
                    } else {
                        catList[x] = roles[roleName];
                        x++; 

                    }
                }
            }
        }
    } else {
        // Checks if category is "Any".
        if (cat === "Any") {
            for (const roleName in obj) {
                if (obj[roleName].Unique === true) {
                    // console.log(obj[roleName].Name + " is unique");
                    for (const key in mainObj) {
                        if (obj[roleName].Name === mainObj[key].Name) {
                            // console.log(obj[roleName].Name + " and " + classicRoles[key].Name + " are the same!");
                            inGame = true;
                        }
                    }
                    if (!(inGame)) {
                        if (!(excludeRoles == null)) {
                            if (!(excludeRoles.includes(roles[roleName].Name))) {
                                catList[x] = roles[roleName];
                                x++; 
                            }
                        } else {
                            catList[x] = roles[roleName];
                            x++;
                        }
                    }
                } else {
                    if (!(roles[roleName].Unique)) {
                        // console.log(obj[roleName].Name + " isn't unique");
                        if (!(excludeRoles == null)) {
                            if (!(excludeRoles.includes(roles[roleName].Name))) {
                                catList[x] = roles[roleName];
                                x++; 
                            }
                        } else {
                            catList[x] = roles[roleName];
                            x++; 

                        }
                    }
                }
            }
        } else {
            // If the category is defined
            for (const roleName in obj) {
                if (obj[roleName].Category === cat) {
                    if (obj[roleName].Unique === true) {
                        for (const key in mainObj) {
                            if (obj[roleName].Name === mainObj[key].Name) {
                                inGame = true;
                            }
                        }
                        if (!(inGame)) {
                            if (!(excludeRoles == null)) {
                                if (!(excludeRoles.includes(roles[roleName].Name))) {
                                    catList[x] = roles[roleName];
                                    x++; 
                                }
                            } else {
                                catList[x] = roles[roleName];
                                x++; 
    
                            }
                        }

                    } else {
                        if (!(roles[roleName].Unique)) {
                            if (!(excludeRoles == null)) {
                                if (!(excludeRoles.includes(roles[roleName].Name))) {
                                    catList[x] = roles[roleName];
                                    x++; 
                                }
                            } else {
                                catList[x] = roles[roleName];
                                x++; 
    
                            }
                        }
                    }
                }
            }
        }
    }
    return catList[Math.floor(Math.random() * (Object.keys(catList).length))];
}

// Another example of gamemode, using the above function. This gamemode will be entirely random.
function getAllAnyRoleList() {
    // The list of roles to return.
    const allAnyRoles = {};

    for (let index = 0; index < 15; index++) {
        allAnyRoles[index] = getRandomOfCategory("Any", "Any", allAnyRoles);

    }
    return allAnyRoles;
}

// Yet another example of gamemode. This gamemode would be aimed at beginners.
function getIntroRoleList() {
    // The list of roles to return.
    const introRoles = {};
    // Variables for easy access to role lists.
    const villageRoles = getVillageRoles();
    const banditRoles = getBanditRoles();

    introRoles[0] = getRandomOfCategory(villageRoles, "Support", introRoles, ["Protester", "DJ", "Detective", "Witness", "Psychologist", "Sentry", "Hermit"]);
    introRoles[1] = getRandomOfCategory(villageRoles, "Support", introRoles, ["Protester", "DJ", "Detective", "Witness", "Medic", "Sentry", "Hermit"]);
    introRoles[2] = getRandomOfCategory(villageRoles, "Protective", introRoles, ["Jailer", "Sniper"]);
    introRoles[3] = getRandomOfCategory(banditRoles, "Decisive", introRoles);
    introRoles[4] = getRandomOfCategory(banditRoles, "Minion", introRoles);

    return introRoles;
}

function getElliotRole() {
    // The list of roles to return.
    const elliotsRoles = {};

    return getRandomOfCategory("Any", "Any", elliotsRoles);
}

function getRoleInfo(role) {
    if (roles[role] === undefined) {
        return "I don't know what that is."
    } else {
        return roles[role];
    }
}