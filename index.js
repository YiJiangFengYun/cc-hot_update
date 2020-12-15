const path = require("path");
const fsExtra = require("fs-extra");
const versionManifestGen = require('./version_manifest_generator');

function injectPrePosScript(dirBuildDest) {
    var _path = path.join(dirBuildDest, 'main.js');
    /**
     * @type { string }
     */
    var contentMain;
    return Promise.resolve()
    .then(() => {
        return fsExtra.readFile(_path);
    })
    .then((data) => {
        contentMain = data;
    })
    .then(() => {
        return fsExtra.readFile(path.join(__dirname, 'inject_code.js'))
    })
    .then((data) => {
        return data += contentMain;
    })
    .then((data) => {
        return fsExtra.writeFile(_path, data);
    });
}

function modifyBuildGradleCopyManifestFiles(dirDest) {
    const nativeProjectsDir = path.join(dirDest, "frameworks/runtime-src");
    const pathDirProjectAndroid = path.join(nativeProjectsDir, "proj.android-studio");
    const pathDirApp = path.join(pathDirProjectAndroid, "app");
    const pathBuildGradle = path.join(pathDirApp, "build.gradle");
    return Promise.resolve()
            .then(() => {
                return fsExtra.readFile(pathBuildGradle, "utf8");
            })
            .then((content) => {
                const target = 'from "${sourceDir}/project.json"\n';
                const index = content.indexOf(target);
                const strVersionManifest = 'from "${sourceDir}/version.manifest"\n';
                if (content.indexOf(strVersionManifest) < 0) content = add(strVersionManifest);
                const strProjectManifest = 'from "${sourceDir}/project.manifest"\n';
                if (content.indexOf(strProjectManifest) < 0) content = add(strProjectManifest);
                
                function add(str) {
                    const start = index + target.length;
                    return content.slice(0, start) + str + content.slice(start, content.length);
                }
                return content;
            })
            .then((content) => {
                return fsExtra.writeFile(pathBuildGradle, content);
            })
}

module.exports = {
    /**
     * Check build setting if is invalid when build is for native:
     * if the dirBuildDest is prefix jsb-, this build is for native.
     * the md5Cache feature should be closed.
     * @param {*} dirBuildDest 
     * @param {*} md5Cache
     * @returns { Promise<void> } 
     */
    check(dirBuildDest, md5Cache) {
        if (dirBuildDest.indexOf('jsb-') > -1 && md5Cache) {
            return Promise.reject(new Error('Building for native must not enable md5 cache feature of building.'));
        } else {
            return Promise.resolve();
        }
    },

    /**
     * Check if build is for native
     * @param {*} dirBuildDest 
     */
    isBuildNative(dirBuildDest) {
        if (dirBuildDest.indexOf('jsb-') > -1) {
            return true;
        } else {
            return false;
        }
    },
    
    /**
     * Start do work
     * @param { string } dirProject Project directory
     * @param { string } dirBuildDest Build directory
     * @param { object } [options] 选项
     * @param { string } [options.remoteURL] URL of root of remote assets
     * @param { string } [options.version] Version of project
     * @returns { Promise<void> }
     */
    doWork(dirProject, dirBuildDest, options) {
        return Promise.resolve()
        .then(() => {
            return injectPrePosScript(dirBuildDest);
        })
        .then(() => {
            return versionManifestGen(dirProject, dirBuildDest, options);
        })
        .then(() => {
            return modifyBuildGradleCopyManifestFiles(dirBuildDest);
        });
    },
};