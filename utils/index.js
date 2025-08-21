// utils/index.js
/*
 * 加载角色与武器JSON数据。
 */
let gameData = null;
async function loadCharacterAndWeaponData() {
    try {
        const response = await fetch("utils/characterAndWeapon.json");
        if (!response.ok) throw new Error("Network response was not ok");
        return await response.json();
    } catch (error) {
        console.error("Failed to load data:", error);
        return { character: [], weapon: [] };
    }
}

/*
 * 将角色字符串分割为数组并去除常驻角色，仅仅保留限定角色，最后补充上0命
 * @param {string} str - 输入的字符串
 * @return {
 */
async function handleCharacterStr(str) {
    gameData = await loadCharacterAndWeaponData();
    console.log("加载的游戏数据:", gameData);
    // 先把角色字符串分割为初始数组
    let originCharacterList = str.split("|");

    // 如果没有包含"命"字，则补充上"0命"
    let fillCharacterList = fillCharacterOriginList(originCharacterList);
    console.log("补充后的数组:", fillCharacterList);
    // 正确方法：使用 map 创建新数组
    const noSpaceList = trimCharacterOriginList(fillCharacterList);
    console.log("完全去除空格:", noSpaceList);

    // 使用 map 转换每个元素
    const result = noSpaceList.map((item) => {
        // 分割字符串：第一部分是角色名，第二部分是命数描述
        const [character, constellation] = item.split("*");
        // 提取数字部分：移除"命"字并保留数字
        const constellationLevel = constellation.replace("命", "");
        return [character, constellationLevel];
    });
    console.log("处理后的角色数组:", result);
    // 如果角色不在这个数组中，则认为是常驻角色，需要过滤掉该项数组
    const filteredArr = result.filter((item) => gameData.character.includes(item[0]));
    console.log("过滤后的角色数组:", filteredArr);
    return filteredArr;
}

/*
 * 将武器字符串分割为数组并去除常驻角色，仅仅保留限定武器，最后补充上0精
 * @param {string} str - 输入的字符串
 */
async function handleWeaponStr(str) {
    gameData = await loadCharacterAndWeaponData();
    console.log("加载的游戏数据:", gameData);
    // 先把武器字符串分割为初始数组
    let originWeaponList = str.split("|");
    // 武器比较特殊，会有重复的，所以需要接着去重
    originWeaponList = [...new Set(originWeaponList)];
    console.log("初始武器数组:", originWeaponList);
    // 如果没有包含"精"字，则补充上"1精"
    let fillWeaponList = fillWeaponOriginList(originWeaponList);
    console.log("补充后的武器数组:", fillWeaponList);
    // 正确方法：使用 map 创建新数组
    const noSpaceList = trimWeaponOriginList(fillWeaponList);
    console.log("完全去除空格:", noSpaceList);

    // 使用 map 转换每个元素
    const result = noSpaceList.map((item) => {
        // 分割字符串：第一部分是武器名，第二部分是命数描述
        const [character, constellation] = item.split("*");
        // 提取数字部分：移除"精"字并保留数字
        const constellationLevel = constellation.replace("精", "");
        return [character, constellationLevel];
    });
    console.log("处理后的武器数组:", result);
    // 如果武器不在这个数组中，则认为是常驻武器，需要过滤掉该项数组
    const filteredArr = result.filter((item) => gameData.weapon.includes(item[0]));
    console.log("过滤后的武器数组:", filteredArr);
    return result;
}
//  对五星角色的处理,如果没有包含"命"字，则补充上"0命"
function fillCharacterOriginList(arr) {
    return arr.map((item) => {
        if (!item.includes("命")) {
            return item + " * 0命";
        }
        return item;
    });
}
// //  对五星武器的处理,如果没有包含"精"字，则补充上"0精"
function fillWeaponOriginList(arr) {
    return arr.map((item) => {
        if (!item.includes("精")) {
            return item + " * 1精";
        }
        return item;
    });
}
//  对五星角色的处理,去除每一项的所有空字符
function trimCharacterOriginList(arr) {
    return arr.map((item) => item.replace(/\s+/g, ""));
}
// 对五星武器的处理,去除每一项的所有空字符
function trimWeaponOriginList(arr) {
    return arr.map((item) => item.replace(/\s+/g, ""));
}
//融合 武器和角色
async function fusionCharacterWithWeapon(characterArr, weaponArr) {
    gameData = await loadCharacterAndWeaponData();
    console.log("加载的游戏数据:", gameData);
    // 创建角色-武器映射关系
    const characterWeaponMap = new Map(gameData.characterWeaponDyadicArray);
    // 创建武器精炼映射关系
    const weaponRefinementMap = new Map(weaponArr);
    // 构建结果数组
    const result = characterArr.map((charEntry) => {
        const [charName, constellation] = charEntry;

        // 获取该角色的专属武器名称
        const weaponName = characterWeaponMap.get(charName);

        // 获取武器精炼值（如果存在则使用，否则为0）
        const refinement = weaponRefinementMap.has(weaponName) ? parseInt(weaponRefinementMap.get(weaponName), 10) : 0;

        // 从武器映射中移除已使用的武器（避免重复使用）
        if (weaponRefinementMap.has(weaponName)) {
            weaponRefinementMap.delete(weaponName);
        }

        return {
            character: [charName, parseInt(constellation, 10)],
            weapon: [weaponName, refinement],
        };
    });
    // 处理该数组 如果精数为0的角色的命座大于等于3，那么即是武器的精数是0，也可以保留该项，否则将其移除数组
    // 如果角色名字为‘相里要’、‘忌炎’、‘吟霖’且命座小于3的，则去除
    // const filteredResult = result.filter((item) => {
    //     const [charName, constellation] = item.character;
    //     const [weaponName, refinement] = item.weapon;
    //     // 检查角色是否是特定的角色且命座小于3
    //     const isSpecialCharacter = ["相里要", "忌炎", "吟霖"].includes(charName) && parseInt(constellation, 10) < 3;

    //     // 如果是特定角色且命座小于3，则过滤掉
    //     if (isSpecialCharacter) {
    //         return false;
    //     }

    //     // 保留精数为0的角色的命座大于等于3的项
    //     return !(refinement === 0 && parseInt(constellation, 10) < 3);
    // });
    return result;
}
/**
 * 从文本中提取五星角色和武器信息
 * @param {string} text - 输入的原始文本
 * @returns {Object} 包含str1(五星角色)和str2(五星武器)的对象
 */
function extractData(text) {
    // 提取str1（五星角色部分）
    const star5CharRegex = /五星角色:([\s\S]*?)(?=__|$)/;
    const star5CharMatch = text.match(star5CharRegex);
    const str1 = star5CharMatch ? star5CharMatch[1].trim() : "";

    // 提取str2（五星武器部分）
    const star5WeaponRegex = /五星武器:([\s\S]*?)(?=__|\n|$)/;
    const star5WeaponMatch = text.match(star5WeaponRegex);
    let str2 = star5WeaponMatch ? star5WeaponMatch[1].trim() : "";

    // 特殊处理：移除str2中可能出现的"服饰："部分
    if (str2.includes("|服饰：")) {
        str2 = str2.split("|服饰：")[0].trim();
    }

    return { str1, str2 };
}
function processData(data) {
    // 定义特定角色
    const specificCharacters = ["相里要", "吟霖", "忌炎"];

    // 计算第一个字符串：除特定角色外的角色总数 + 武器精炼>0的数量
    let otherCount = 0;
    let refinedWeaponCount = 0;

    // 准备符合条件的角色列表
    const qualifiedList = [];

    // 遍历所有角色
    for (const item of data) {
        const charName = item.character[0];
        const constellation = item.character[1];
        const weaponRefine = item.weapon[1];

        // 统计非特定角色
        if (!specificCharacters.includes(charName)) {
            otherCount++;
            if (weaponRefine > 0) {
                refinedWeaponCount++;
            }
        }

        // 检查是否符合条件
        if (specificCharacters.includes(charName)) {
            // 特定角色：命座≥4
            if (constellation >= 4) {
                qualifiedList.push({
                    charName,
                    constellation,
                    weaponRefine,
                });
            }
        } else {
            // 其他角色：武器精炼≥1 或 命座≥3
            if (weaponRefine >= 1 || constellation >= 3) {
                qualifiedList.push({
                    charName,
                    constellation,
                    weaponRefine,
                });
            }
        }
    }

    // 生成第一个字符串
    const firstString = `${otherCount}+${refinedWeaponCount}`;

    // 对符合条件的角色排序
    qualifiedList.sort((a, b) => {
        // 先按命座降序
        if (b.constellation !== a.constellation) {
            return b.constellation - a.constellation;
        }
        // 命座相同则按武器精炼降序
        if (b.weaponRefine !== a.weaponRefine) {
            return b.weaponRefine - a.weaponRefine;
        }
        // 命座和精炼都相同则按角色名称升序
        return a.charName.localeCompare(b.charName, "zh");
    });

    // 生成第二个字符串
    const secondString = qualifiedList
        .map((item) => {
            return `${item.constellation}${item.weaponRefine}${item.charName}`;
        })
        .join("，");

    return {
        firstString,
        secondString,
    };
}
// 导出函数
export { extractData, handleCharacterStr, handleWeaponStr, loadCharacterAndWeaponData, fusionCharacterWithWeapon, processData };
