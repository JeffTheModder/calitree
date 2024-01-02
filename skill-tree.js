// I hope you like global variables

let skillsData; // JSON containing skills
let treeSkillsData; // JSON containing equipment and selectableSkills
let treeSkills = []; // An skill that appears on the crafting tree, with a corresponding skill
let skills; // An in-game skill from the game or one of the supported mods
let equipment; // A crafting station (anvil, furnace etc) and its sprite
let selectableSkills; // An skill selectable at load which will serve as the central/top level skill in the crafting tree

let statusSelectingSkill = true; // The skill selection screen is displayed
let statusSelectingLayout = false; // The layout selection screen is displayed
let statusClickDisabled = false; // Disables opening a wiki page or panning around, to avoid accidental clicks on loading the tree
let statusLoadingSprites = false; // Sprites are being loaded, and the "Loading sprites" screen is displayed
let statusDisplayControls = false; // Keyboard controls are displayed in the top left corner
let statusHoveringOverSkill = false; // A treeSkill is being hovered over, and its information displayed
let statusDragging = false; // The mouse is being clicked and dragged, and the view is panning

let selectedSkill; // The chosen selectableSkill, or the one hovered over while statusSelectingSkill

let spritesTotal = 0; // Number of sprites to be loaded during a statusLoadingSprites
let spritesLoaded = 0; // Sprites loaded so far, for tracking progress

let openSansBold; // Font file used for UI text

let cameraPan = new p5.Vector(0, 0); // Current position of the camera, relative to the centre of the crafting tree
let cameraHeight; // Distance from the camera to the canvas, affects visual zoom
let zoomLevel = 1; // Zoom percent relative to 1x, higher zooms out, affects cameraHeight
let dragStart = new p5.Vector(); // Mouse position at the beginning of a drag
let dragMouse = new p5.Vector(); // Mouse position during a drag, relative to dragStart and accounting for zoomLevel
let panStart = new p5.Vector(); // cameraPan at the beginning of a drag
let mousePos = new p5.Vector(); // Mouse position on the canvas, accounting for cameraPan and zoomLevel

let firstLoadTime = 0; // frameCount when first loading a tree, determines when to fade out control toggle message

let topCorner = new p5.Vector(); // Top left corner of the screen, accounting for cameraPan and zoomLevel
let bottomCorner = new p5.Vector(); // Bottom right corner of the screen, accounting for cameraPan and zoomLevel

let layoutImages = {}; // Images to serve as buttons on the layout selection screen
let layoutImageList = ["treeTop", "treeLeft", "treeBottom", "treeRight", "radial", "disabled"]; // Each layoutImage that needs to be loaded
let selectedLayout = ""; // The selected crafting tree layout - tree or radial
let treeBranchSpacing = 75; // Distance between branches when using tree layout
let treeBranchLength; // Length of each level of branches when using tree layout
let treeBranchWidth = 5; // Width of the lines connecting skills when using tree layout

function preload() {
    skillsData = loadJSON("skills.json");
    treeSkillsData = loadJSON("tree-skills.json");
    openSansBold = loadFont("open-sans-bold.ttf");
}

function setup() {
    createCanvas(windowWidth, windowHeight, WEBGL);
    frameRate(60);

    textFont(openSansBold);
    textAlign(CENTER);

    cameraHeight = (height/2) / tan(PI/6);
    cam = createCamera();
    cam.setPosition(cameraPan.x, cameraPan.y, cameraHeight);

    skills = skillsData.skills;
    equipment = treeSkillsData.equipment;
    selectableSkills = treeSkillsData.selectableSkills;
    statusLoadingSprites = true;
    spritesTotal = selectableSkills.length + equipment.length + layoutImageList.length;
    for (let i = 0; i < selectableSkills.length; i ++) {
        for (skill of skills) {
            console.log(skill)
            if (skill.name == selectableSkills[i].name) {
                selectableSkills[i].skill = skill;
            }
        }
        selectableSkills[i].sprite = loadImage("images/" + selectableSkills[i].name + ".png", incrementSpritesLoaded);
    }
    for (let i = 0; i < equipment.length; i ++) {
        equipment[i].sprite = loadImage("images/" + equipment[i].name + ".png", incrementSpritesLoaded);
    }
    for (let i = 0; i < layoutImageList.length; i ++) {
        layoutImages[layoutImageList[i]] = loadImage("images/layouts/" + layoutImageList[i] + ".png", incrementSpritesLoaded);
    }
}

function draw() {
    background(240);

    cam.setPosition(cameraPan.x, cameraPan.y, cameraHeight * zoomLevel);

    if (statusDragging) {
        dragMouse.x = (mouseX - dragStart.x) * zoomLevel;
        cameraPan.set(panStart.x - ((mouseX - dragStart.x) * zoomLevel), panStart.y - ((mouseY - dragStart.y) * zoomLevel));
    }

    topCorner.x = 0 - (width / 2) + cameraPan.x + (cameraPan.x * (-(zoomLevel - 1) / zoomLevel));
    topCorner.y = 0 - (height / 2) + cameraPan.y + (cameraPan.y * (-(zoomLevel - 1) / zoomLevel));
    topCorner.setMag(topCorner.mag() * zoomLevel);
    bottomCorner.x = width - (width / 2) + cameraPan.x + (cameraPan.x * (-(zoomLevel - 1) / zoomLevel))
    bottomCorner.y = height - (height / 2) + cameraPan.y + (cameraPan.y * (-(zoomLevel - 1) / zoomLevel));
    bottomCorner.setMag(bottomCorner.mag() * zoomLevel);
    mousePos.x = map(mouseX, 0, width, topCorner.x, bottomCorner.x);
    mousePos.y = map(mouseY, 0, height, topCorner.y, bottomCorner.y);

    // Display "Loading sprites" screen
    if (statusLoadingSprites) {
        fill(255);
        circle(0, 0, 30000);
        fill(0);
        textSize(40);
        text("Loading sprites (" + spritesLoaded + "/" + spritesTotal + ")", 0, 0);
    // Display skill selection screen
    } else if (statusSelectingSkill) {
        zoomLevel = 1.2;
        fill(255);
        noStroke();
        rect(-630, -460, 1260, 920);
        fill(0);
        textSize(40);
        text("Choose a crafting tree to display", 0, -360);

        for (let i = 0; i < 8; i ++) {
            for (let j = 0; j < 5; j ++) {
                if (selectableSkills.length > i + j * 8) {
                    selectableSkills[i + j * 8].position = new p5.Vector(-525 + i * 150, -240 + j * 150);
                }
            }
        }
        if (!statusSelectingLayout) {
            selectedSkill = null;
        }
        for (selectableSkill of selectableSkills) {
            let scaleFactor;
            if (selectableSkill.sprite.height > selectableSkill.sprite.width) {
                scaleFactor = min(75 / selectableSkill.sprite.height, 1.5);
            } else {
                scaleFactor = min(75 / selectableSkill.sprite.width, 1.5);
            }
            selectableSkill.scaledHeight = selectableSkill.sprite.height * scaleFactor;
            selectableSkill.scaledWidth = selectableSkill.sprite.width * scaleFactor;
            image(selectableSkill.sprite, selectableSkill.position.x - selectableSkill.scaledWidth * 0.5, selectableSkill.position.y - selectableSkill.scaledHeight * 0.5,
                  selectableSkill.scaledWidth, selectableSkill.scaledHeight);
            if (!statusSelectingLayout) {
                if (dist(mousePos.x, mousePos.y, selectableSkill.position.x, selectableSkill.position.y) < 45) {
                  selectedSkill = selectableSkill;
                }
            }
        }

        cursor(ARROW);
        // Display layout selection screen
        if (statusSelectingLayout) {
            fill(200, 200, 200, 70);
            circle(0, 0, 30000);
            fill(255);
            rect(-400, -175, 800, 350);
            fill(0);
            text("Choose a crafting tree layout", 0, -100);
            image(layoutImages["treeTop"], -360, -60, 120, 120);
            image(layoutImages["treeLeft"], -210, -60, 120, 120);
            image(layoutImages["treeBottom"], -60, -60, 120, 120);
            image(layoutImages["treeRight"], 90, -60, 120, 120);
            if (selectedSkill.radial) {
                image(layoutImages["radial"], 240, -60, 120, 120);
            } else {
                image(layoutImages["disabled"], 240, -60, 120, 120);
            }
            textSize(27);
            fill(0);
            if (mousePos.y < 50 && mousePos.y > -50) {
                cursor("pointer");
                if (mousePos.x < -250 && mousePos.x > -350) {
                    selectedLayout = "treeTop";
                    text("Tree with the final product at the top", 0, 120);
                } else if (mousePos.x < -100 && mousePos.x > -200) {
                    selectedLayout = "treeLeft";
                    text("Tree with the final product on the left", 0, 120);
                } else if (mousePos.x < 50 && mousePos.x > -50) {
                    selectedLayout = "treeBottom";
                    text("Tree with the final product at the bottom", 0, 120);
                } else if (mousePos.x < 200 && mousePos.x > 100) {
                    selectedLayout = "treeRight";
                    text("Tree with the final product on the right", 0, 120);
                } else if (mousePos.x < 350 && mousePos.x > 250) {
                    if (selectedSkill.radial) {
                        selectedLayout = "radial";
                        text("Radial tree with the final product in the centre", 0, 120);
                    } else {
                        selectedLayout = "disabled";
                        fill(150);
                        text("This crafting tree is too crowded for the radial layout", 0, 120);
                    }
                } else {
                    cursor(ARROW);
                    selectedLayout = "";
                }
            }
            if (mouseIsPressed && !statusClickDisabled) {
                if (mousePos.x > 400 || mousePos.x < -400 || mousePos.y > 175 || mousePos.y < -175) {
                    statusSelectingLayout = false;
                    statusClickDisabled = true;
                } else if (selectedLayout != "" && selectedLayout != "disabled") {
                    statusClickDisabled = true;
                    statusSelectingSkill = false;
                    statusSelectingLayout = false;
                    cursor(ARROW);
                    loadCraftingTree();
                }
            }
        } else if (selectedSkill != null) {
            cursor("pointer");
            fill(200, 200, 200, 50);
            circle(0, 0, 30000);
            fill(255);
            circle(selectedSkill.position.x, selectedSkill.position.y, 120)
            image(selectedSkill.sprite, selectedSkill.position.x - selectedSkill.scaledWidth * 0.75, selectedSkill.position.y - selectedSkill.scaledHeight * 0.75,
                  selectedSkill.scaledWidth * 1.5, selectedSkill.scaledHeight * 1.5);

            textSize(30);
            let rectWidth = textWidth(selectedSkill.displayName);
            textSize(20);
            rectWidth = max(rectWidth, textWidth(selectedSkill.difficulty));
            rectWidth += 40;
            rect(selectedSkill.position.x - rectWidth / 2, selectedSkill.position.y + selectedSkill.scaledHeight * 0.25 + 60, rectWidth, 85);

            fill(0);
            textSize(30);
            text(selectedSkill.displayName, selectedSkill.position.x, selectedSkill.position.y + selectedSkill.scaledHeight * 0.25 + 100);
            textSize(20);
            text(selectedSkill.difficulty, selectedSkill.position.x, selectedSkill.position.y + selectedSkill.scaledHeight * 0.25 + 130);
            if (mouseIsPressed && !statusClickDisabled) {
                statusSelectingLayout = true;
                statusClickDisabled = true;
                cursor(ARROW);
            }
        }
    // Display crafting tree
    } else {
        if (selectedLayout == "radial") {
            for (skill of treeSkills) {
                skill.update(mousePos, selectedLayout);
                skill.displaySkillRadial();
                if (skill.parent != null) {
                    skill.displayArrowRadial(mousePos);
                }
            }
        } else {
            for (skill of treeSkills) {
                skill.update(mousePos, selectedLayout);
                skill.displayLinesTree(zoomLevel, treeBranchWidth);
            }
            for (skill of treeSkills) {
                skill.displaySkillTree(zoomLevel);
            }
        }

        statusHoveringOverSkill = false;
        cursor(ARROW);
        for (skill of treeSkills) {
            if (skill.hoveredOver) {
                statusHoveringOverSkill = true;
                skill.displayHover(equipment);
            }
        }
    }

    // Display control toggle message
    if (firstLoadTime != 0 && frameCount - firstLoadTime < 300 && !statusDisplayControls && !statusLoadingSprites) {
        let textOpacity = map(frameCount - firstLoadTime, 0, 300, 2000, 0);
        textSize(25 * zoomLevel);
        textAlign(LEFT);
        fill(255, 255, 255, textOpacity);
        text("Press enter to toggle controls", (-width / 2 + 12) * zoomLevel + cameraPan.x, (-height / 2 + 67) * zoomLevel + cameraPan.y);
        fill(0, 0, 0, textOpacity);
        text("Press enter to toggle controls", (-width / 2 + 10) * zoomLevel + cameraPan.x, (-height / 2 + 65) * zoomLevel + cameraPan.y);
        textAlign(CENTER);
    }

    // Display keyboard controls
    if (statusDisplayControls) {
        let textPosition = new p5.Vector((-width / 2 + 10) * zoomLevel + cameraPan.x, (-height / 2 + 5) * zoomLevel + cameraPan.y);
        textSize(20 * zoomLevel);
        textAlign(LEFT);
        fill(255);
        text("Click and drag to pan around", textPosition.x + 2 * zoomLevel, textPosition.y + 27 * zoomLevel);
        text("Scroll or use arrow keys to zoom in and out", textPosition.x + 2 * zoomLevel, textPosition.y + 54 * zoomLevel);
        text("ESC to choose a different skill", textPosition.x + 2 * zoomLevel, textPosition.y + 81 * zoomLevel);
        text("Click on an skill to open its wiki page", textPosition.x + 2 * zoomLevel, textPosition.y + 108 * zoomLevel);
        text("Enter to close controls", textPosition.x + 2 * zoomLevel, textPosition.y + 135 * zoomLevel);
        fill(0);
        text("Click and drag to pan around", textPosition.x, textPosition.y + 25 * zoomLevel);
        text("Scroll or use arrow keys to zoom in and out", textPosition.x, textPosition.y + 52 * zoomLevel);
        text("ESC to choose a different skill", textPosition.x, textPosition.y + 79 * zoomLevel);
        text("Click on an skill to open its wiki page", textPosition.x, textPosition.y + 106 * zoomLevel);
        text("Enter to close controls", textPosition.x, textPosition.y + 133 * zoomLevel);
        textAlign(CENTER);
    }

    // Display back button
    if (!statusSelectingSkill && !statusLoadingSprites && !statusDisplayControls) {
        if (mousePos.x < (-width / 2 + 112) * zoomLevel + cameraPan.x && mousePos.y < (-height / 2 + 42) * zoomLevel + cameraPan.y) {
            fill(255);
            rect((-width / 2) * zoomLevel + cameraPan.x, (-height / 2) * zoomLevel + cameraPan.y, 112 * zoomLevel, 42 * zoomLevel);
            if (mouseIsPressed && !statusDragging) {
                statusDragging = false;
                statusDisplayControls = false;
                statusHoveringOverSkill = false;
                cameraPan.set(0, 0);
                statusSelectingSkill = true;
            }
        }
        textSize(25 * zoomLevel);
        textAlign(LEFT);
        fill(255, 255, 255);
        text("< Back", (-width / 2 + 12) * zoomLevel + cameraPan.x, (-height / 2 + 32) * zoomLevel + cameraPan.y);
        fill(0, 0, 0);
        text("< Back", (-width / 2 + 10) * zoomLevel + cameraPan.x, (-height / 2 + 30) * zoomLevel + cameraPan.y);
        textAlign(CENTER);
    }
}

function windowResized() {
    resizeCanvas(windowWidth - 20, windowHeight - 20);
    cameraHeight = (height/2) / tan(PI/6);
    cam.setPosition(cameraPan.x, cameraPan.y, cameraHeight);
}

function keyPressed() {
    if (keyCode == ESCAPE) {
        if (statusSelectingLayout) {
            statusSelectingLayout = false;
        } else {
            statusDragging = false;
            statusDisplayControls = false;
            statusHoveringOverSkill = false;
            cameraPan.set(0, 0);
            statusSelectingSkill = true;
        }
    } else if (keyCode == UP_ARROW) {
        if (!statusLoadingSprites && !statusSelectingSkill) {
            zoomLevel = max(zoomLevel * 0.9 * 0.9, 0.4);
        }
    } else if (keyCode == DOWN_ARROW) {
        if (!statusLoadingSprites && !statusSelectingSkill) {
            zoomLevel = min(zoomLevel * 1.1 * 1.1, 9.5);
        }
    } else if (keyCode == ENTER) {
        if (!statusLoadingSprites && !statusSelectingSkill) {
            statusDisplayControls = !statusDisplayControls;
            firstLoadTime = -400; // Prevents the toggle controls message from displaying again
        }
    }
}

function mousePressed() {
    if (!statusDragging && !statusHoveringOverSkill && !statusLoadingSprites && !statusSelectingSkill && !statusClickDisabled) {
        // Make sure the mouse isn't over the back button
        if (!((mousePos.x < (-width / 2 + 112) * zoomLevel + cameraPan.x && mousePos.y < (-height / 2 + 42) * zoomLevel + cameraPan.y))) {
            dragStart.set(mouseX, mouseY);
            panStart.set(cameraPan);
            statusDragging = true;
        }
    }
}

function mouseReleased() {
    if (statusDragging) {
        statusDragging = false;
    }
}

function mouseClicked() {
    if (statusClickDisabled) {
        statusClickDisabled = false;
    } else if (statusHoveringOverSkill) {
        let hoverSkill;
        for (skill of treeSkills) {
            if (skill.hoveredOver) {
                hoverSkill = skill;
            }
        }
        if (hoverSkill.skill.wikiLink != "") {
            window.open(hoverSkill.skill.wikiLink);
        }
    }
}

function mouseWheel(mouseEvent) {
    if (!statusLoadingSprites && !statusSelectingSkill) {
        if (mouseEvent.delta > 0) {
            zoomLevel = min(zoomLevel * map(mouseEvent.delta, 0, 80, 1, 1.1), 9.5);
        } else {
            zoomLevel = max(zoomLevel * map(mouseEvent.delta, 0, -80, 1, 0.9), 0.4);
        }
    }
}

function loadSkillRecursive(treeSkill, parentSkill) {
    if (treeSkill.progressions) {
        for (let i = 0; i < treeSkill.progressions.length; i ++) {
            let progression = treeSkill.progressions[i];
            let progressionNumber;
            let newSkillPosition = new p5.Vector();
            if (parentSkill.parent == null) {
                progressionNumber = (1 / treeSkill.progressions.length) * i;
                newSkillPosition.set(150, 0);
                newSkillPosition.rotate(TWO_PI - TWO_PI * progressionNumber);
            } else {
                progressionNumber = 1 / (treeSkill.progressions.length + 1) * (i + 1);
                newSkillPosition = p5.Vector.sub(parentSkill.parent.position, parentSkill.position);
                newSkillPosition.setMag(-150);
                newSkillPosition.rotate(map(progressionNumber, 0, 1, -HALF_PI, HALF_PI));
            }
            newSkillPosition.add(parentSkill.position);
            // let tempSpacing = [300, 600, 800, 950, 1100, 1250, 1400, 1550];
            newSkill = new Skill(newSkillPosition.x, newSkillPosition.y, skills[progression], parentSkill, selectedSkill.skillSpacing);
            // TEMP: ig
            // newSkill = new Skill(newSkillPosition.x, newSkillPosition.y, skills[progression], parentSkill, tempSpacing);
            treeSkills.push(newSkill);
            loadSkillRecursive(skills[progression], newSkill);
        }
    }
}

function loadSprites() {
    let spritesToLoad = [];
    for (let i = 0; i < treeSkills.length; i ++) {
        if (treeSkills[i].skill.sprite == null) {
            if (!spritesToLoad.includes(treeSkills[i].skill.name)) {
                append(spritesToLoad, treeSkills[i].skill.name);
            }
        }
    }

    if (spritesToLoad.length > 0) {
        statusLoadingSprites = true;
        spritesLoaded = 0;
        spritesTotal = spritesToLoad.length;
        for (let i = 0; i < treeSkills.length; i ++) {
            if (treeSkills[i].skill.sprite == null) {
                let newImage;
                if (treeSkills[i].skill.name.substring(0, 4) == "any-") {
                    newImage = loadImage("images/any.png", incrementSpritesLoaded);
                } else {
                    newImage = loadImage("images/" + treeSkills[i].skill.name + ".png", incrementSpritesLoaded);
                }
                treeSkills[i].skill.sprite = newImage;
                skills[treeSkills[i].skill.id].sprite = newImage;
            }
        }
    } else {
        statusLoadingSprites = false;
    }
}

function incrementSpritesLoaded(image) {
    spritesLoaded ++;
    if (spritesLoaded >= spritesTotal) {
        statusLoadingSprites = false;
        if (!statusSelectingSkill && firstLoadTime == 0) {
            firstLoadTime = frameCount;
        }
    }
}

function loadCraftingTree() {
    treeSkills = [];

    if (selectedLayout == "radial") {
        skillSpacing = selectedSkill.skillSpacing;
        firstSkill = new Skill(0, 0, selectedSkill.skill, null, skillSpacing);
    } else {
        firstSkill = new Skill(0, 0, selectedSkill.skill); // TODO: Does this need a null at the end?
    }
    treeSkills.push(firstSkill);
    loadSkillRecursive(selectedSkill.skill, firstSkill);

    loadSprites();

    for (treeSkill of treeSkills) {
        countChildrenRecursive(treeSkill, treeSkill.skill, skills);
    }

    if (selectedLayout.substring(0, 4) == "tree") {
        for (treeSkill of treeSkills) {
            placeChildrenTree(treeSkill, treeSkills);
        }
    } else {
        for (treeSkill of treeSkills) {
            placeChildrenRadially(treeSkill, treeSkills[0], treeSkills);
        }
    }

    zoomLevel = 1.2;
    cameraPan.set(0, 0);
}

function countChildrenRecursive(treeSkill, skill, skills) {
    if (treeSkill.skill.progressions.length == 0) {
        treeSkill.children = 1;
    } else {
        for (let i = 0; i < skill.progressions.length; i ++) {
            if (skills[skill.progressions[i]].progressions.length == 0) {
                treeSkill.children ++;
            }
            countChildrenRecursive(treeSkill, skills[skill.progressions[i]], skills);
        }
    }
}

function placeChildrenRadially(parentSkill, originSkill, treeSkills) {
    let childList = [];
    for (skill of treeSkills) {
        if (skill.parent == parentSkill) {
            append(childList, skill);
        }
    }
    if (parentSkill.parent == null) {
        let eachChildAngle = TWO_PI / parentSkill.children;
        let runningTotal = 0;
        for (child of childList) {
            let childAngle = eachChildAngle * child.children;
            let newSkillPosition = new p5.Vector(0, child.skillSpacing);
            newSkillPosition.rotate(childAngle / 2 + runningTotal);
            newSkillPosition.add(originSkill.position);
            runningTotal += childAngle;
            child.position.set(newSkillPosition);
        }
    } else {
        let parentAngle = (TWO_PI * parentSkill.children / originSkill.children);
        let runningTotal = 0;
        for (let i = 0; i < childList.length; i ++) {
            let prevTotal = runningTotal;
            runningTotal += parentAngle * childList[i].children / parentSkill.children;
            let childAngle = (prevTotal + runningTotal) / 2;

            newSkillPosition = p5.Vector.sub(parentSkill.position, originSkill.position);
            newSkillPosition.setMag(childList[i].skillSpacing);
            newSkillPosition.rotate(childAngle - parentAngle / 2);
            newSkillPosition.add(originSkill.position);
            childList[i].position.set(newSkillPosition);
        }
    }
}

function placeChildrenTree(parentSkill, treeSkills) {
    if (parentSkill.parent == null) {
        parentSkill.branchLength = min(250 + parentSkill.children * 2, 600);
    }
    let childList = [];
    for (skill of treeSkills) {
        if (skill.parent == parentSkill) {
            append(childList, skill);
        }
    }
    let runningTotal = 0;
    for (let i = 0; i < childList.length; i ++) {
        let prevTotal = runningTotal;
        runningTotal += childList[i].children * treeBranchSpacing;
        childList[i].branchLength = max(parentSkill.branchLength - 100, 120);
        if (selectedLayout == "treeTop") {
            childList[i].position.y = parentSkill.position.y + childList[i].branchLength;
            childList[i].position.x = (runningTotal + prevTotal) / 2 + parentSkill.position.x - (treeBranchSpacing * parentSkill.children) / 2;
        } else if (selectedLayout == "treeLeft") {
            childList[i].position.x = parentSkill.position.x + childList[i].branchLength;
            childList[i].position.y = (runningTotal + prevTotal) / 2 + parentSkill.position.y - (treeBranchSpacing * parentSkill.children) / 2;
        } else if (selectedLayout == "treeBottom") {
            childList[i].position.y = parentSkill.position.y - childList[i].branchLength;
            childList[i].position.x = (runningTotal + prevTotal) / 2 + parentSkill.position.x - (treeBranchSpacing * parentSkill.children) / 2;
        } else if (selectedLayout == "treeRight") {
            childList[i].position.x = parentSkill.position.x - childList[i].branchLength;
            childList[i].position.y = (runningTotal + prevTotal) / 2 + parentSkill.position.y - (treeBranchSpacing * parentSkill.children) / 2;
        }
    }
    if (childList.length > 1) {
        parentSkill.trunkTopOffset = childList[0].children * treeBranchSpacing / 2;
        parentSkill.trunkBottomOffset = childList[childList.length - 1].children * treeBranchSpacing / 2;
    }
}