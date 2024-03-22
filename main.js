let q = element => document.querySelector(element)

/** @type HTMLDivElement */
let accountList = q("#accountList")
/** @type HTMLDivElement */
let levelInfo = q("#singleLevelInfo")
/** @type HTMLDivElement */
let levelList = q("#levelList")
/** @type HTMLDivElement */
let singleLevelInfo = q("#singleLevelInfo")
/** @type HTMLDivElement */
let otherStuff = q("#other")
/** @type HTMLDivElement */
let info = q(".info")
/** @type HTMLDivElement */
let levelUpload = q("#levelUpload")

let ADMINPASSWORD = q("#adminpass").value
let USERNAME = q("#debugusername").value
let PASSWORD = q("#debugpassword").value

function check() {
    ADMINPASSWORD = q("#adminpass").value
    USERNAME = q("#debugusername").value
    PASSWORD = q("#debugpassword").value
    requestAnimationFrame(check)
}

check()

function popup(text) {
    let alertElement = document.createElement("div")
    alertElement.innerText = text
    alertElement.classList.add("popup")
    alertElement.style.opacity = 1
    setTimeout(() => {
        alertElement.style.opacity = 0
        setTimeout(() => {
            q("main").removeChild(alertElement)
        }, 1000)
    }, 500)
    q("main").appendChild(alertElement)
}

async function post(url, data) {
    return new Promise(resolve => {
        fetch(url, {method: "POST", body: JSON.stringify(data)})
        .then(r => {
            if (r.status != 200) {
                // aww shit
                let statusTypes = {
                    429: "Rate limited",
                    500: "Internal server error",
                    422: "Unprocessable Content",
                    403: "Forbidden",
                    400: "Bad request"
                }
                popup(statusTypes[r.status] + " (" + r.status + ")")
            }
            r.text().then(result => {
                // check for missing or extra parameter
                try {
                    let json = JSON.parse(result)
                    if (json.value == "MISSINGPARAMETEROREXTRAPARAMETER")
                        popup("Missing or extra parameter: " + json.parameter)
                } catch(_) {}
                resolve(result)
            })
        })
    })
}

function createInputAndButtonPair(labelLabel, buttonLabel="set", callbackOnButton, isNumberInput = false) {
    let parent = document.createElement("span")
        let labelAndInputParent = document.createElement("span")
            let label = document.createElement("label")
            label.innerText = labelLabel

            let input = document.createElement("input")
            input.type = isNumberInput ? "number" : "text"
        labelAndInputParent.appendChild(label)
        labelAndInputParent.appendChild(input)

        let button = document.createElement("button")
        button.addEventListener("click", () => {
            if (isNumberInput) callbackOnButton(Number(input.value))
            else               callbackOnButton(input.value)
        })
        button.innerText = buttonLabel
    parent.appendChild(labelAndInputParent)
    parent.appendChild(button)

    return parent
}

function createInputPairWithButton(labelLabel, buttonLabel="set", callbackOnButton) {
    let parent = document.createElement("span")
        let labelAndInputParent = document.createElement("span")
            let label = document.createElement("label")
            label.innerText = labelLabel

            let input = document.createElement("input")
            input.type = "text"
            let input2 = document.createElement("input")
            input2.type = "text"
        labelAndInputParent.appendChild(label)
        labelAndInputParent.appendChild(input)
        labelAndInputParent.appendChild(input2)

        let button = document.createElement("button")
        button.addEventListener("click", () => {
            callbackOnButton(input.value, input2.value)
        })
        button.innerText = buttonLabel
    parent.appendChild(labelAndInputParent)
    parent.appendChild(button)

    return parent
}

function createButton(label, callbackOnButton) {
    let button = document.createElement("button")
    button.innerText = label
    button.addEventListener("click", callbackOnButton)
    return button
}


/**
 * @param {Level} level 
 */
async function loadLevelInSingleLevelInfo(level) {
    singleLevelInfo.innerText = ""
    
    let lbl = document.createElement("div")
    lbl.innerText = "Level " + level.id + " (" + level.title + ")"
    singleLevelInfo.append(lbl)

    singleLevelInfo.appendChild(createInputAndButtonPair("Add to a list: ", "Add", function(input) {
        post("https://flicc.xyz:1002/admin/list/addLevelToList", {
            "level": level.id,
            "list": input,
            "apassword": ADMINPASSWORD
        })
    }))

    singleLevelInfo.appendChild(createInputAndButtonPair("Remove from a list: ", "Remove", function(input) {
        post("https://flicc.xyz:1002/admin/list/removeLevelFromList", {
            "level": level.id,
            "list": input,
            "apassword": ADMINPASSWORD
        })
    }))

    singleLevelInfo.appendChild(createInputPairWithButton("Set parameter: ", "Set", function(input1, input2) {
        post("https://flicc.xyz:1002/admin/level/setparam", {
            "level": level.id,
            "param": input1,
            "value": input2,
            "apassword": ADMINPASSWORD
        })
    }))

    singleLevelInfo.append(document.createElement("hr"))

    let buttons = document.createElement("div")
    buttons.classList.add("buttons")

        buttons.appendChild(createButton("Delete level", function() {
            post("https://flicc.xyz:1002/admin/level/delete", {
                "level": level.id,
                "apassword": ADMINPASSWORD
            })
            updateLevelList()
        }))

        buttons.appendChild(createButton("Download level data", async function() {
            let data = JSON.parse(await post("https://flicc.xyz:1002/level/get/single/data", {
                "level": level.id,
                "username": USERNAME,
                "password": PASSWORD
            })).value

            var element = document.createElement("a")
            element.setAttribute("href", "data:text/plaincharset=utf-8," + encodeURIComponent(data))
            element.setAttribute("download", level.name + ".flkk")
            element.click()
        }))

        buttons.appendChild(createButton("Make featured", function() {
            post("https://flicc.xyz:1002/admin/level/setparam", {
                "level": level.id,
                "param": "featured",
                "value": true,
                "apassword": ADMINPASSWORD
            })
            post("https://flicc.xyz:1002/admin/list/addLevelToList", {
                "level": level.id,
                "list": "featured",
                "apassword": ADMINPASSWORD
            })
            updateLevelList()
        }))

        buttons.appendChild(createButton("Unmake featured", function() {
            post("https://flicc.xyz:1002/admin/level/setparam", {
                "level": level.id,
                "param": "featured",
                "value": false,
                "apassword": ADMINPASSWORD
            })
            post("https://flicc.xyz:1002/admin/list/removeLevelFromList", {
                "level": level.id,
                "list": "featured",
                "apassword": ADMINPASSWORD
            })
            updateLevelList()
        }))

    singleLevelInfo.appendChild(buttons)
    
    singleLevelInfo.append(document.createElement("hr"))

    let metadataElement = document.createElement("pre")
    metadataElement.innerText = JSON.stringify(level, null, "\t")
    singleLevelInfo.append(metadataElement)
}

async function updateLevelList() {
    levelList.innerText = "Loading..."

    /** @type Array<Level> */
    let levels = JSON.parse(await post("https://flicc.xyz:1002/level/get/list/data", {
        "page": parseInt(q("#page").value),
        "list": q("#listname").value,
        "username": USERNAME,
        "password": PASSWORD
    })).value

    levelList.innerText = ""
    if (levels.length == 0) levelList.innerText = "[no levels in list]"

    for (let level of levels) {
        let element = document.createElement("fieldset")

        let title = document.createElement("legend")
        title.innerText = level.title
        element.appendChild(title)

        let author = document.createElement("div")
        author.innerText = "By " + level.author
        element.appendChild(author)

        let rankingParent = document.createElement("div")
            // add background
            if (level.ranking != -1) {
                let rankingBackground = document.createElement("img")
                if (level.ranking <= 15)        rankingBackground.src = "./assets/corebg.png"
                else if (level.ranking != 20)   rankingBackground.src = "./assets/corebg2.png"
                else                            rankingBackground.src = "./assets/corebg3.png"
                rankingParent.appendChild(rankingBackground)
            }

            let rankingImage = document.createElement("img")
            rankingImage.src = "./assets/"+level.ranking+"cores.png"
            rankingParent.appendChild(rankingImage)

            let ranking = document.createElement("div")
            ranking.innerText = "Ranking: " + level.ranking == -1 ? "None" : level.ranking
            ranking.style.backgroundColor = "black"
            rankingParent.appendChild(ranking)
        element.append(rankingParent)

        let otherInfo = document.createElement("div")
            let downloads = document.createElement("div")
            downloads.innerText = "Downloads: " + level.downloads
            otherInfo.appendChild(downloads)

            let featured = document.createElement("div")
            featured.innerText = level.featured ? "Featured: yes" : "Featured: no"
            otherInfo.appendChild(featured)

            let requestedDifficulty = document.createElement("div")
            requestedDifficulty.innerText = "Requested Difficulty: " + level.requestedDifficulty
            otherInfo.appendChild(requestedDifficulty)

            let ranking2 = document.createElement("div")
            ranking2.innerText = "Ranking: " + (level.ranking == -1 ? "None" : level.ranking)
            otherInfo.appendChild(ranking2)

            let unlisted = document.createElement("div")
            unlisted.innerText = level.unlisted ? "Unlisted: yes" : "Unlisted: no"
            otherInfo.appendChild(unlisted)

            let id = document.createElement("div")
            id.innerText = "ID: " + level.id
            otherInfo.appendChild(id)
        element.append(otherInfo)

        let description = document.createElement("div")
        description.innerText = level.description
        element.appendChild(description)

        levelList.appendChild(element)

        element.addEventListener("click", async _ => {
            loadLevelInSingleLevelInfo(level)
        })
    }
}

async function updateAccountList() {
    let accounts = JSON.parse(await post("https://flicc.xyz:1002/admin/get/getAllAccountData", {
        "apassword": ADMINPASSWORD
    })).value

    accountList.innerText = ""

    for (let [name, accountData] of Object.entries(accounts)) {
        let element = document.createElement("fieldset")

        let title = document.createElement("legend")
        title.innerText = name
        element.appendChild(title)

        let password = document.createElement("div")
        password.innerText = "Password hash: " + accountData.p
        element.appendChild(password)

        element.append(createButton("Delete", function() {
            post("https://flicc.xyz:1002/admin/account/deleteAccount", {
                "apassword": ADMINPASSWORD,
                "username": name
            })
            updateAccountList()
        }))

        accountList.appendChild(element)
    }
}

updateAccountList()
updateLevelList()
q("#refreshLevelList").addEventListener("click", updateLevelList)
q("#refreshAccountList").addEventListener("click", updateAccountList)

// create stuff in other section
otherStuff.appendChild(createInputPairWithButton("Create account (username, password)", "Create!", async function(username, password) {
    let result = JSON.parse(await post("https://flicc.xyz:1002/account/new", {
        "username": username,
        "password": password
    })).value

    if (result != true) {
        popup("Failed! Reason=" + result)
    }
    
    updateAccountList()
}))

otherStuff.appendChild(createInputPairWithButton("Change account password (username, new password)", "Change", async function(username, password) {
    let result = JSON.parse(await post("https://flicc.xyz:1002/admin/account/changePassword", {
        "username": username,
        "password": password,
        "apassword": ADMINPASSWORD
    })).value

    if (result != true) {
        popup("Failed! Reason=" + result)
    }
    
    updateAccountList()
}))

otherStuff.appendChild(createButton("Backup BINs", function() {
    post("https://flicc.xyz:1002/admin/backup/triggerBinBackup", {
        "apassword": ADMINPASSWORD,
    })
    popup("Check server remote desktop!")
}))

otherStuff.appendChild(createButton("Backup levels", function() {
    post("https://flicc.xyz:1002/admin/backup/triggerLevelBackup", {
        "apassword": ADMINPASSWORD,
    })
    popup("Check server remote desktop!")
}))


// create stuff in info section
info.children[0].appendChild(createButton("Hide", function() {
    info.querySelectorAll("input").forEach(element => {
        if (element.style.color == "transparent") {
            element.style.color = ""
            element.style.backgroundColor = ""
        } else {
            element.style.color = "transparent"
            element.style.backgroundColor = "red"
        }
    })
}))

// create stuff in single level info section
singleLevelInfo.parentElement.children[0].appendChild(createInputAndButtonPair("Load level from id", "Load", async function(id) {
    let levelObject = JSON.parse(await post("https://flicc.xyz:1002/level/get/single/metadata", {
        "username": USERNAME,
        "password": PASSWORD,
        "level": id
    })).value

    loadLevelInSingleLevelInfo(levelObject)
}, true))

// create stuff in upload section
levelUpload.appendChild(createButton("Upload", function() {
    /** @type File */
    let file = q("#levelUploadFilePicker").files[0]

    if (file) {
        let reader = new FileReader()
        reader.addEventListener("load", event => {
            let flikkFileData = event.target.result

            post("https://flicc.xyz:1002/level/upload", {
                "username": USERNAME,
                "password": PASSWORD,
                "title": q("#levelUploadName").value,
                "description": q("#levelUploadDescription").value,
                "unlisted": q("#levelUploadUnlisted").checked,
                "levelDataString": flikkFileData,
                "requestedDifficulty": q("#levelUploadDifficulty").value
            })
            popup("Uploaded! (hopefully)")
        })
        reader.readAsText(file)
    }
}))

// easter egg
let flikkman = q("#easteregg")
let timeSinceLastMoved = -400
function tickEasterEgg() {
    timeSinceLastMoved++

    if (timeSinceLastMoved == 120) {
        flikkman.style.scale = ""
        flikkman.style.left = "-60px"
        flikkman.style.transition = ""
        flikkman.style.translate = ""
    }

    if (timeSinceLastMoved == 300) {
        flikkman.style.left = "30px"
    }

    if (timeSinceLastMoved == 370) {
        flikkman.style.scale = "-1 1"
    }

    if (timeSinceLastMoved == 410) {
        flikkman.style.scale = "1 1"
    }

    if (timeSinceLastMoved == 470) {
        flikkman.style.left = "300px"
    }

    if (timeSinceLastMoved == 530) {
        flikkman.style.translate = "0px -150px"
    }

    if (timeSinceLastMoved == 545) {
        flikkman.style.transition = "left .75s ease-in-out, translate .2s ease-in"
        flikkman.style.translate = "0px 0px"
    }

    if (timeSinceLastMoved == 560) {
        flikkman.style.transition = ""
        flikkman.style.translate = "0px -150px"
    }

    if (timeSinceLastMoved == 575) {
        flikkman.style.transition = "left .75s ease-in-out, translate .2s ease-in"
        flikkman.style.translate = ""
    }

    if (timeSinceLastMoved == 650) {
        flikkman.style.transition = ""
        flikkman.style.scale = "1.3 0.3"
    }
    
    
    if (timeSinceLastMoved == 700) {
        flikkman.style.left = "150%"
    }

        
    if (timeSinceLastMoved == 750) {
        flikkman.style.transition = "initial"
        flikkman.style.left = "-100%"
    }

    requestAnimationFrame(tickEasterEgg)
}

tickEasterEgg()

document.addEventListener("mousemove", () => {
    timeSinceLastMoved = -400
    flikkman.style.scale = ""
    flikkman.style.left = "-100%"
    flikkman.style.transition = ""
    flikkman.style.translate = ""
})
