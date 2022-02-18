// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import * as os from "os";
import * as path from "path";
import * as fs from "fs";
import * as moment from "moment";
import { spawn } from "child_process";
const mkdirp = require("mkdirp");
import COSUpload from "./cos";

const upload = (
  progress: vscode.Progress<object>,
  config: vscode.WorkspaceConfiguration,
  selectFilePath: string = ""
) => {
  let editor = <any>vscode.window.activeTextEditor;
  if (!editor) {
    return Promise.reject();
  }
  let remotePath = config["remotePath"];
  if (remotePath.startsWith("/")) {
    vscode.window.showErrorMessage("remotePath can not start with /");
    return Promise.reject();
  }
  if (!config["remoteName"]) {
    vscode.window.showErrorMessage("missing remoteName param");
    return Promise.reject();
  }
  if (!config.bucket) {
    vscode.window.showErrorMessage("missing bucket param");
    return Promise.reject();
  }
  if (!config.region) {
    vscode.window.showErrorMessage("missing region param");
    return Promise.reject();
  }
  if (!config.secretId) {
    vscode.window.showErrorMessage("missing secretId param");
    return Promise.reject();
  }
  if (!config.secretKey) {
    vscode.window.showErrorMessage("missing secretKey param");
    return Promise.reject();
  }

  const isPaste = !selectFilePath;
  selectFilePath = selectFilePath || `${moment().format("YYYYMMDDHHmmss")}.png`;
  let mdFilePath = editor.document.uri.fsPath;
  let imagePath = getImagePath(mdFilePath, config.localPath, selectFilePath);

  if (isPaste) {
    return createImageDirWithImagePath(imagePath)
      .then(() => {
        saveClipboardImageToFileAndGetPath(imagePath, (imagePath: string) => {
          if (!imagePath) {
            return;
          }
          if (imagePath === "no image") {
            vscode.window.showInformationMessage("There is not a image in clipboard.");
            progress.report({ increment: 100, message: "There is not a image in clipboard." });
            return;
          }
          return COSUpload(config, imagePath)
            .then((res: any) => {
              console.log("Succeed to upload image to cos.");

              const img = `![${res.name}](${res.url})`;

              editor.edit((textEditorEdit: any) => {
                textEditorEdit.insert(editor.selection.active, img);
              });

              progress.report({ increment: 100, message: "Complete upload!" });
              vscode.window.showInformationMessage("Complete upload!");
            })
            .catch((error: Error) => {
              // console.log(error)
              progress.report({ increment: 100, message: "Upload error." + error.message });
              vscode.window.showErrorMessage("Failed to upload image. Error:" + error.message);
            });
        });
      })
      .catch((e) => {
        console.log(e);
        progress.report({ increment: 100, message: "Failed make folder." });
        vscode.window.showErrorMessage("Failed make folder.");
        return;
      });
  } else {
    return COSUpload(config, imagePath, selectFilePath)
      .then((res: any) => {
        console.log("Succeed to upload image to cos.");
        const img = `![${res.name}](${res.url})`;

        editor.edit((textEditorEdit: any) => {
          textEditorEdit.insert(editor.selection.active, img);
        });

        progress.report({ increment: 100, message: "Complete upload!" });
        vscode.window.showInformationMessage("Complete upload!");
      })
      .catch((error: Error) => {
        // console.log(error)
        progress.report({ increment: 100, message: "Upload error." + error.message });
        vscode.window.showErrorMessage("Failed to upload image. Error:" + error.message);
      });
  }
};

const getImagePath = function (filePath: string, localPath: string, selectFilePath: string) {
  // 图片名称
  let imageFileName = path.basename(selectFilePath);
  // imageDir = os.platform() === "win32" ? os.tmpdir() : imageDir

  // 图片本地保存路径
  let folderPath = path.dirname(filePath);
  let imagePath = "";

  if (path.isAbsolute(localPath)) {
    if (os.platform() === "win32") {
      imagePath = path.join(os.tmpdir(), imageFileName);
    } else {
      imagePath = path.join(localPath, imageFileName);
    }
  } else {
    imagePath = path.join(folderPath, localPath, imageFileName);
  }
  return imagePath;
};

const createImageDirWithImagePath = function (imagePath: string) {
  return new Promise((resolve, reject) => {
    let imageDir = path.dirname(imagePath);

    fs.exists(imageDir, (exists) => {
      if (exists) {
        resolve(imagePath);
        return;
      }
      mkdirp(imageDir, (err: Error) => {
        if (err) {
          console.log(err);
          reject(err);
          return;
        }
        resolve(imagePath);
      });
    });
  });
};

const saveClipboardImageToFileAndGetPath = function (imagePath: string, cb: Function) {
  if (!imagePath) {
    return;
  }
  let platform = process.platform;
  if (platform === "win32") {
    // Windows
    const scriptPath = path.join(__dirname, "../lib/pc.ps1");
    const powershell = spawn("powershell", [
      "-noprofile",
      "-noninteractive",
      "-nologo",
      "-sta",
      "-executionpolicy",
      "unrestricted",
      "-windowstyle",
      "hidden",
      "-file",
      scriptPath,
      imagePath,
    ]);
    powershell.on("exit", function (code, signal) {});
    powershell.stdout.on("data", function (data) {
      cb(data.toString().trim());
    });
  } else if (platform === "darwin") {
    // Mac
    let scriptPath = path.join(__dirname, "../lib/mac.applescript");

    let ascript = spawn("osascript", [scriptPath, imagePath]);
    ascript.on("exit", function (code, signal) {});

    ascript.stdout.on("data", function (data) {
      cb(data.toString().trim());
    });
  } else {
    // Linux

    let scriptPath = path.join(__dirname, "../lib/linux.sh");

    let ascript = spawn("sh", [scriptPath, imagePath]);
    ascript.on("exit", function (code, signal) {});
    ascript.stdout.on("data", function (data) {
      let result = data.toString().trim();
      if (result === "no xclip") {
        vscode.window.showInformationMessage("You need to install xclip command first.");
        return;
      }
      cb(result);
    });
  }
};

const error = (err: string) => vscode.window.showErrorMessage(err);

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log('Congratulations, your extension "tencent-cloud-cos-upload-image" is now active!');

  const config = vscode.workspace.getConfiguration("tencentCloudCOSUploader");

  // The command has been defined in the package.json file
  // Now provide the implementation of the command with registerCommand
  // The commandId parameter must match the command field in package.json
  let pasteUpload = vscode.commands.registerCommand("extension.tencentCloudCOSUploader.paste", () => {
    // The code you place here will be executed every time your command is executed

    // Display a message box to the user
    if (!vscode.window.activeTextEditor) {
      vscode.window.showErrorMessage("No editable window is open.");
      return;
    }

    vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: "上传图片",
        cancellable: false,
      },
      (progress: vscode.Progress<object>) => {
        progress.report({ increment: 0 });
        return upload(progress, config);
      }
    );
  });
  let selectUpload = vscode.commands.registerCommand("extension.tencentCloudCOSUploader.select", () => {
    // The code you place here will be executed every time your command is executed

    vscode.window
      .showOpenDialog({
        // filters: { Images: ["png", "jpg", "gif", "bmp"] },
      })
      .then((result) => {
        if (result) {
          const { fsPath } = result[0];

          vscode.window.withProgress(
            {
              location: vscode.ProgressLocation.Notification,
              title: "上传文件",
              cancellable: false,
            },
            (progress: vscode.Progress<object>) => {
              progress.report({ increment: 0 });
              return upload(progress, config, fsPath);
            }
          );
        }
      }, error);
  });

  context.subscriptions.push(pasteUpload);
  context.subscriptions.push(selectUpload);
}

// this method is called when your extension is deactivated
export function deactivate() {}
