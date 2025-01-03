// @macro:persist
// @macro:singleton
var x = x === undefined ? 100 : (x + 1);

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function hello() {
    await sleep(10000);
    return vscode.window.showInformationMessage("hello world " + x );
}

hello();